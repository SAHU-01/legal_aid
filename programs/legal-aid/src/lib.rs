use anchor_lang::prelude::*;
use sha2::{Sha256, Digest};

pub mod groth16;
pub mod vk;

declare_id!("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");

// ── SAS Program ID ──────────────────────────────────────────────────
const SAS_PROGRAM_BYTES: [u8; 32] = [
    0x0f, 0x5e, 0x9e, 0xd5, 0x37, 0x1e, 0x2c, 0x70,
    0x89, 0x8c, 0xa9, 0xfd, 0x0e, 0x77, 0xc0, 0x06,
    0x5c, 0xab, 0x5d, 0xa0, 0x2e, 0x56, 0x67, 0x8b,
    0x27, 0x13, 0x38, 0x2a, 0xf3, 0x74, 0x59, 0xb7,
];

const SAS_NONCE_OFFSET: usize = 1;
const SAS_SCHEMA_OFFSET: usize = 65;

fn parse_sas_attestation(data: &[u8]) -> Result<(Pubkey, i64, Pubkey)> {
    require!(data.len() >= 141, LegalAidError::CredentialDataTooShort);
    let nonce_bytes: [u8; 32] = data[SAS_NONCE_OFFSET..SAS_NONCE_OFFSET + 32].try_into().unwrap();
    let nonce_pubkey = Pubkey::from(nonce_bytes);
    let schema_bytes: [u8; 32] = data[SAS_SCHEMA_OFFSET..SAS_SCHEMA_OFFSET + 32].try_into().unwrap();
    let schema = Pubkey::from(schema_bytes);
    let data_len_offset = SAS_SCHEMA_OFFSET + 32;
    let data_field_len = u32::from_le_bytes(data[data_len_offset..data_len_offset + 4].try_into().unwrap()) as usize;
    let signer_offset = data_len_offset + 4 + data_field_len;
    let expiry_offset = signer_offset + 32;
    require!(data.len() >= expiry_offset + 8, LegalAidError::CredentialDataTooShort);
    let expiry = i64::from_le_bytes(data[expiry_offset..expiry_offset + 8].try_into().unwrap());
    Ok((schema, expiry, nonce_pubkey))
}

/// Check if signer is authorized (authority, reviewer, or delegate)
fn is_authorized(signer: &Pubkey, config: &ProgramConfig, include_reviewer: bool) -> bool {
    if *signer == config.authority { return true; }
    if include_reviewer && *signer == config.reviewer { return true; }
    config.delegates.contains(signer)
}

/// Re-check that a credential account is still live (not revoked)
fn check_credential_liveness(credential_info: &AccountInfo, expected_key: &Pubkey) -> Result<()> {
    require!(credential_info.key() == *expected_key, LegalAidError::CredentialNotLinked);
    let sas_program_id = Pubkey::from(SAS_PROGRAM_BYTES);
    require!(
        *credential_info.owner == sas_program_id && credential_info.data_len() > 0,
        LegalAidError::CredentialRevoked
    );
    Ok(())
}

// ── Enums ───────────────────────────────────────────────────────────

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    InProgress,
    Closed,
    Paid,
    Stayed,
    Appealed,
    Withdrawn,
    Remanded,
}

// ── Account Structs ─────────────────────────────────────────────────

#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,
    pub reviewer: Pubkey,
    pub payer: Pubkey,
    pub jurisdiction: String,
    pub total_cases: u64,
    pub expected_schema: Pubkey,
    /// Wallet that pays transaction fees for all operations (funded by ministry)
    pub operations_wallet: Pubkey,
    /// Delegate reviewers who can link credentials and close cases (max 3)
    pub delegates: Vec<Pubkey>,
    /// Auto-escalation: if a case is InProgress for this many days, authority can close directly
    pub case_timeout_days: u16,
    pub bump: u8,
}

impl ProgramConfig {
    pub const MAX_JURISDICTION_LEN: usize = 10;
    pub const MAX_DELEGATES: usize = 3;
    // 8 disc + 32 authority + 32 reviewer + 32 payer + (4+10) jurisdiction
    // + 8 total_cases + 32 expected_schema + 32 operations_wallet
    // + (4 + 32*3) delegates + 2 case_timeout_days + 1 bump = 293
    pub const SPACE: usize = 8 + 32 + 32 + 32 + (4 + Self::MAX_JURISDICTION_LEN)
        + 8 + 32 + 32 + (4 + 32 * Self::MAX_DELEGATES) + 2 + 1;
}

#[account]
pub struct CaseFile {
    pub case_id: String,
    pub document_hash: [u8; 32],
    /// Privacy-preserving lawyer assignment: hash(lawyer_pubkey || salt).
    /// Lawyer proves assignment by providing the salt during anchor_document.
    pub lawyer_commitment: [u8; 32],
    pub issuer: Pubkey,
    /// The applicant/citizen (wallet pubkey). Zero for custodial cases.
    pub applicant: Pubkey,
    pub status: CaseStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub credential_pubkey: Pubkey,
    pub commitment_root: [u8; 32],
    /// Custodian acting on behalf of a citizen without a wallet
    pub custodian: Pubkey,
    /// Hash of citizen's national ID (for custodial cases where citizen has no wallet)
    pub citizen_id_hash: [u8; 32],
    /// Fee schedule: authorized payment amount for this case (in atomic units)
    pub authorized_amount: u64,
    /// Actual amount disbursed (set during mark_paid)
    pub disbursed_amount: u64,
    /// Government payment reference (invoice number, SAP reference, etc.)
    pub payment_reference: String,
    pub bump: u8,
}

impl CaseFile {
    pub const MAX_CASE_ID_LEN: usize = 32;
    pub const MAX_PAYMENT_REF_LEN: usize = 64;
    // 8 disc + (4+32) case_id + 32 doc_hash + 32 lawyer_commitment + 32 issuer
    // + 32 applicant + 1 status + 8 created + 8 updated + 32 credential_pubkey
    // + 32 commitment_root + 32 custodian + 32 citizen_id_hash
    // + 8 authorized_amount + 8 disbursed_amount + (4+64) payment_reference + 1 bump = 404
    pub const SPACE: usize = 8 + (4 + Self::MAX_CASE_ID_LEN) + 32 + 32 + 32
        + 32 + 1 + 8 + 8 + 32 + 32 + 32 + 32 + 8 + 8 + (4 + Self::MAX_PAYMENT_REF_LEN) + 1;
}

// ── Error Codes ─────────────────────────────────────────────────────

#[error_code]
pub enum LegalAidError {
    #[msg("Jurisdiction exceeds maximum length")]
    JurisdictionTooLong,
    #[msg("Case ID exceeds maximum length")]
    CaseIdTooLong,
    #[msg("Unauthorized signer")]
    Unauthorized,
    #[msg("Invalid case status for this operation")]
    InvalidStatus,
    #[msg("No credential linked to this case")]
    CredentialNotLinked,
    #[msg("Credential account is not owned by the SAS program")]
    CredentialWrongOwner,
    #[msg("Credential schema does not match expected schema")]
    CredentialSchemaMismatch,
    #[msg("Credential has expired")]
    CredentialExpired,
    #[msg("Credential account data is too short")]
    CredentialDataTooShort,
    #[msg("This case already has a credential linked")]
    CaseAlreadyHasCredential,
    #[msg("Commitment root must be non-zero")]
    CommitmentRootEmpty,
    #[msg("Credential nonce does not match case applicant")]
    CredentialApplicantMismatch,
    #[msg("Credential account has been revoked (no longer exists on-chain)")]
    CredentialRevoked,
    #[msg("ZK proof verification failed")]
    ZkProofVerificationFailed,
    #[msg("ZK proof public inputs do not match on-chain state")]
    ZkPublicInputMismatch,
    #[msg("Predicate not satisfied by ZK proof")]
    ZkPredicateNotSatisfied,
    #[msg("Reassignment reason exceeds 128 characters")]
    ReasonTooLong,
    #[msg("Cannot reassign lawyer on a terminal case (Closed/Paid)")]
    CannotReassignTerminalCase,
    #[msg("Citizen ID hash must be non-zero for custodial cases")]
    CitizenIdHashEmpty,
    #[msg("Maximum delegates (3) reached")]
    MaxDelegatesReached,
    #[msg("Delegate not found")]
    DelegateNotFound,
    #[msg("Invalid status transition")]
    InvalidStatusTransition,
    #[msg("Can only reopen a Closed case")]
    CannotReopenNonClosedCase,
    #[msg("Disbursed amount exceeds authorized amount")]
    PaymentExceedsAuthorized,
    #[msg("Payment reference exceeds 64 characters")]
    PaymentReferenceTooLong,
    #[msg("Lawyer commitment hash does not match signer")]
    LawyerCommitmentMismatch,
}

// ── Program ─────────────────────────────────────────────────────────

#[program]
pub mod legal_aid {
    use super::*;

    /// Initialize a jurisdiction config with role separation and operations wallet.
    pub fn initialize(
        ctx: Context<Initialize>,
        jurisdiction: String,
        expected_schema: Pubkey,
        reviewer: Pubkey,
        payer_role: Pubkey,
        operations_wallet: Pubkey,
        case_timeout_days: u16,
    ) -> Result<()> {
        require!(jurisdiction.len() <= ProgramConfig::MAX_JURISDICTION_LEN, LegalAidError::JurisdictionTooLong);
        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.reviewer = reviewer;
        config.payer = payer_role;
        config.jurisdiction = jurisdiction;
        config.total_cases = 0;
        config.expected_schema = expected_schema;
        config.operations_wallet = operations_wallet;
        config.delegates = Vec::new();
        config.case_timeout_days = case_timeout_days;
        config.bump = ctx.bumps.config;
        Ok(())
    }

    // ── Gap 5: Delegation ───────────────────────────────────────────

    pub fn add_delegate(ctx: Context<ManageDelegates>, delegate: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(ctx.accounts.authority.key() == config.authority, LegalAidError::Unauthorized);
        require!(config.delegates.len() < ProgramConfig::MAX_DELEGATES, LegalAidError::MaxDelegatesReached);
        if !config.delegates.contains(&delegate) {
            config.delegates.push(delegate);
        }
        Ok(())
    }

    pub fn remove_delegate(ctx: Context<ManageDelegates>, delegate: Pubkey) -> Result<()> {
        let config = &mut ctx.accounts.config;
        require!(ctx.accounts.authority.key() == config.authority, LegalAidError::Unauthorized);
        let before = config.delegates.len();
        config.delegates.retain(|d| *d != delegate);
        require!(config.delegates.len() < before, LegalAidError::DelegateNotFound);
        Ok(())
    }

    // ── Gap 4: Fund Operations ──────────────────────────────────────

    pub fn fund_operations(ctx: Context<FundOperations>, amount: u64) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(ctx.accounts.funder.key() == config.authority, LegalAidError::Unauthorized);
        anchor_lang::system_program::transfer(
            CpiContext::new(
                ctx.accounts.system_program.to_account_info(),
                anchor_lang::system_program::Transfer {
                    from: ctx.accounts.funder.to_account_info(),
                    to: ctx.accounts.operations_wallet.to_account_info(),
                },
            ),
            amount,
        )
    }

    // ── Open Case (standard — citizen has wallet) ───────────────────

    pub fn open_case(
        ctx: Context<OpenCase>,
        case_id: String,
        lawyer_commitment: [u8; 32],
        applicant: Pubkey,
        authorized_amount: u64,
    ) -> Result<()> {
        require!(case_id.len() <= CaseFile::MAX_CASE_ID_LEN, LegalAidError::CaseIdTooLong);
        let config = &mut ctx.accounts.config;
        require!(ctx.accounts.authority.key() == config.authority, LegalAidError::Unauthorized);

        let clock = Clock::get()?;
        let case_file = &mut ctx.accounts.case_file;
        case_file.case_id = case_id;
        case_file.document_hash = [0u8; 32];
        case_file.lawyer_commitment = lawyer_commitment;
        case_file.issuer = ctx.accounts.authority.key();
        case_file.applicant = applicant;
        case_file.status = CaseStatus::Open;
        case_file.created_at = clock.unix_timestamp;
        case_file.updated_at = clock.unix_timestamp;
        case_file.credential_pubkey = Pubkey::default();
        case_file.commitment_root = [0u8; 32];
        case_file.custodian = Pubkey::default();
        case_file.citizen_id_hash = [0u8; 32];
        case_file.authorized_amount = authorized_amount;
        case_file.disbursed_amount = 0;
        case_file.payment_reference = String::new();
        case_file.bump = ctx.bumps.case_file;
        config.total_cases = config.total_cases.checked_add(1).unwrap();
        Ok(())
    }

    // ── Gap 3: Open Case Custodial (citizen has no wallet) ──────────

    pub fn open_case_custodial(
        ctx: Context<OpenCase>,
        case_id: String,
        lawyer_commitment: [u8; 32],
        citizen_id_hash: [u8; 32],
        custodian: Pubkey,
        authorized_amount: u64,
    ) -> Result<()> {
        require!(case_id.len() <= CaseFile::MAX_CASE_ID_LEN, LegalAidError::CaseIdTooLong);
        require!(citizen_id_hash != [0u8; 32], LegalAidError::CitizenIdHashEmpty);
        let config = &mut ctx.accounts.config;
        require!(ctx.accounts.authority.key() == config.authority, LegalAidError::Unauthorized);

        let clock = Clock::get()?;
        let case_file = &mut ctx.accounts.case_file;
        case_file.case_id = case_id;
        case_file.document_hash = [0u8; 32];
        case_file.lawyer_commitment = lawyer_commitment;
        case_file.issuer = ctx.accounts.authority.key();
        case_file.applicant = Pubkey::default(); // no wallet
        case_file.status = CaseStatus::Open;
        case_file.created_at = clock.unix_timestamp;
        case_file.updated_at = clock.unix_timestamp;
        case_file.credential_pubkey = Pubkey::default();
        case_file.commitment_root = [0u8; 32];
        case_file.custodian = custodian;
        case_file.citizen_id_hash = citizen_id_hash;
        case_file.authorized_amount = authorized_amount;
        case_file.disbursed_amount = 0;
        case_file.payment_reference = String::new();
        case_file.bump = ctx.bumps.case_file;
        config.total_cases = config.total_cases.checked_add(1).unwrap();
        Ok(())
    }

    // ── Link Credential ─────────────────────────────────────────────

    pub fn link_credential(
        ctx: Context<LinkCredential>,
        _case_id: String,
        commitment_root: [u8; 32],
    ) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;
        let config = &ctx.accounts.config;

        require!(is_authorized(&ctx.accounts.authority.key(), config, true), LegalAidError::Unauthorized);
        require!(case_file.status == CaseStatus::Open, LegalAidError::InvalidStatus);
        require!(case_file.credential_pubkey == Pubkey::default(), LegalAidError::CaseAlreadyHasCredential);
        require!(commitment_root != [0u8; 32], LegalAidError::CommitmentRootEmpty);

        let credential_info = &ctx.accounts.credential_account;
        let sas_program_id = Pubkey::from(SAS_PROGRAM_BYTES);
        require!(*credential_info.owner == sas_program_id, LegalAidError::CredentialWrongOwner);

        let cred_data = credential_info.try_borrow_data()?;
        let (schema, expiry, nonce_pubkey) = parse_sas_attestation(&cred_data)?;
        require!(schema == config.expected_schema, LegalAidError::CredentialSchemaMismatch);
        require!(expiry > Clock::get()?.unix_timestamp, LegalAidError::CredentialExpired);

        // Citizen binding: support both wallet-based and custodial models
        if case_file.citizen_id_hash != [0u8; 32] {
            // Custodial: nonce must match citizen_id_hash (interpreted as pubkey) OR custodian
            require!(
                nonce_pubkey == Pubkey::from(case_file.citizen_id_hash)
                    || nonce_pubkey == case_file.custodian,
                LegalAidError::CredentialApplicantMismatch
            );
        } else {
            // Standard: nonce must match applicant wallet
            require!(nonce_pubkey == case_file.applicant, LegalAidError::CredentialApplicantMismatch);
        }

        case_file.credential_pubkey = credential_info.key();
        case_file.commitment_root = commitment_root;
        case_file.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // ── Gap 1: Reassign Lawyer ──────────────────────────────────────

    pub fn reassign_lawyer(
        ctx: Context<ReassignLawyer>,
        _case_id: String,
        new_lawyer_commitment: [u8; 32],
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 128, LegalAidError::ReasonTooLong);
        let config = &ctx.accounts.config;
        require!(is_authorized(&ctx.accounts.authority.key(), config, true), LegalAidError::Unauthorized);

        let case_file = &mut ctx.accounts.case_file;
        require!(
            case_file.status == CaseStatus::Open
                || case_file.status == CaseStatus::InProgress
                || case_file.status == CaseStatus::Stayed,
            LegalAidError::CannotReassignTerminalCase
        );

        // Re-check credential liveness if one is linked
        if case_file.credential_pubkey != Pubkey::default() {
            check_credential_liveness(&ctx.accounts.credential_account, &case_file.credential_pubkey)?;
        }

        let old_commitment = case_file.lawyer_commitment;
        case_file.lawyer_commitment = new_lawyer_commitment;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        emit!(LawyerReassigned {
            case_id: case_file.case_id.clone(),
            old_lawyer_commitment: old_commitment,
            new_lawyer_commitment,
            reason,
            reassigned_by: ctx.accounts.authority.key(),
            timestamp: case_file.updated_at,
        });
        Ok(())
    }

    // ── Anchor Document (lawyer proves assignment via salt) ──────────

    pub fn anchor_document(
        ctx: Context<AnchorDocument>,
        _case_id: String,
        document_hash: [u8; 32],
        lawyer_salt: [u8; 32],
    ) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        // Verify lawyer commitment: sha256(signer || salt) must match stored commitment
        let lawyer_key = ctx.accounts.lawyer.key();
        let mut hasher = Sha256::new();
        hasher.update(lawyer_key.as_ref());
        hasher.update(&lawyer_salt);
        let computed: [u8; 32] = hasher.finalize().into();
        require!(computed == case_file.lawyer_commitment, LegalAidError::LawyerCommitmentMismatch);

        require!(
            case_file.status == CaseStatus::Open || case_file.status == CaseStatus::InProgress,
            LegalAidError::InvalidStatus
        );
        require!(case_file.credential_pubkey != Pubkey::default(), LegalAidError::CredentialNotLinked);
        require!(case_file.commitment_root != [0u8; 32], LegalAidError::CommitmentRootEmpty);

        check_credential_liveness(&ctx.accounts.credential_account, &case_file.credential_pubkey)?;

        case_file.document_hash = document_hash;
        case_file.status = CaseStatus::InProgress;
        case_file.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // ── Close Case (with escalation timeout) ────────────────────────

    pub fn close_case(ctx: Context<CloseCase>, _case_id: String) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;
        let config = &ctx.accounts.config;
        let signer = ctx.accounts.authority.key();
        let now = Clock::get()?.unix_timestamp;

        // Timeout escalation: if case has been InProgress longer than case_timeout_days,
        // authority can close directly even without reviewer permission
        let timeout_seconds = (config.case_timeout_days as i64) * 86400;
        let is_timed_out = case_file.status == CaseStatus::InProgress
            && timeout_seconds > 0
            && (now - case_file.updated_at) > timeout_seconds;

        require!(
            is_authorized(&signer, config, true) || (is_timed_out && signer == config.authority),
            LegalAidError::Unauthorized
        );
        require!(case_file.status == CaseStatus::InProgress, LegalAidError::InvalidStatus);

        check_credential_liveness(&ctx.accounts.credential_account, &case_file.credential_pubkey)?;

        case_file.status = CaseStatus::Closed;
        case_file.updated_at = now;
        Ok(())
    }

    // ── Gap 6: Update Case Status (non-linear transitions) ──────────

    pub fn update_case_status(
        ctx: Context<UpdateCaseStatus>,
        _case_id: String,
        new_status: CaseStatus,
    ) -> Result<()> {
        let config = &ctx.accounts.config;
        require!(is_authorized(&ctx.accounts.authority.key(), config, true), LegalAidError::Unauthorized);

        let case_file = &mut ctx.accounts.case_file;
        let old = &case_file.status;

        // Validate allowed transitions
        let valid = matches!(
            (old, &new_status),
            (CaseStatus::InProgress, CaseStatus::Stayed)
            | (CaseStatus::InProgress, CaseStatus::Appealed)
            | (CaseStatus::InProgress, CaseStatus::Withdrawn)
            | (CaseStatus::Closed, CaseStatus::Remanded)
            | (CaseStatus::Stayed, CaseStatus::InProgress)
            | (CaseStatus::Appealed, CaseStatus::InProgress)
            | (CaseStatus::Remanded, CaseStatus::InProgress)
        );
        require!(valid, LegalAidError::InvalidStatusTransition);

        let old_status = case_file.status.clone();
        case_file.status = new_status.clone();
        case_file.updated_at = Clock::get()?.unix_timestamp;

        emit!(CaseStatusUpdated {
            case_id: case_file.case_id.clone(),
            old_status,
            new_status,
            updated_by: ctx.accounts.authority.key(),
            timestamp: case_file.updated_at,
        });
        Ok(())
    }

    // ── Gap 6: Reopen Case ──────────────────────────────────────────

    pub fn reopen_case(
        ctx: Context<ReopenCase>,
        _case_id: String,
        reason: String,
    ) -> Result<()> {
        require!(reason.len() <= 128, LegalAidError::ReasonTooLong);
        let config = &ctx.accounts.config;
        require!(ctx.accounts.authority.key() == config.authority, LegalAidError::Unauthorized);

        let case_file = &mut ctx.accounts.case_file;
        require!(case_file.status == CaseStatus::Closed, LegalAidError::CannotReopenNonClosedCase);

        case_file.status = CaseStatus::InProgress;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        emit!(CaseReopened {
            case_id: case_file.case_id.clone(),
            reason,
            reopened_by: ctx.accounts.authority.key(),
            timestamp: case_file.updated_at,
        });
        Ok(())
    }

    // ── Mark Paid (with amount validation + payment reference) ──────

    pub fn mark_paid(
        ctx: Context<MarkPaid>,
        _case_id: String,
        disbursed_amount: u64,
        payment_reference: String,
    ) -> Result<()> {
        require!(payment_reference.len() <= CaseFile::MAX_PAYMENT_REF_LEN, LegalAidError::PaymentReferenceTooLong);
        let config = &ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.payer || ctx.accounts.authority.key() == config.authority,
            LegalAidError::Unauthorized
        );

        let case_file = &mut ctx.accounts.case_file;
        require!(case_file.status == CaseStatus::Closed, LegalAidError::InvalidStatus);
        require!(disbursed_amount <= case_file.authorized_amount, LegalAidError::PaymentExceedsAuthorized);

        case_file.disbursed_amount = disbursed_amount;
        case_file.payment_reference = payment_reference;
        case_file.status = CaseStatus::Paid;
        case_file.updated_at = Clock::get()?.unix_timestamp;
        Ok(())
    }

    // ── ZK Selective Disclosure Verification ─────────────────────────

    pub fn verify_zk_disclosure(
        ctx: Context<VerifyZkDisclosure>,
        _case_id: String,
        proof_data: [u8; 256],
        public_inputs: [[u8; 32]; 7],
    ) -> Result<()> {
        let case_file = &ctx.accounts.case_file;
        require!(case_file.credential_pubkey != Pubkey::default(), LegalAidError::CredentialNotLinked);
        require!(
            case_file.status == CaseStatus::Open
                || case_file.status == CaseStatus::InProgress
                || case_file.status == CaseStatus::Stayed,
            LegalAidError::InvalidStatus
        );
        require!(public_inputs[0] == case_file.commitment_root, LegalAidError::ZkPublicInputMismatch);

        let mut expected_one = [0u8; 32];
        expected_one[31] = 1;
        require!(public_inputs[5] == expected_one, LegalAidError::ZkPredicateNotSatisfied);

        let proof = groth16::parse_proof(&proof_data);
        let verification_key = vk::get_verification_key();
        let valid = groth16::verify_proof(&verification_key, &proof, &public_inputs)?;
        require!(valid, LegalAidError::ZkProofVerificationFailed);

        emit!(ZkDisclosureVerified {
            case_id: case_file.case_id.clone(),
            disclosed_value: public_inputs[1],
            disclosure_index: public_inputs[2][31] as u8,
            predicate_satisfied: true,
            verifier: ctx.accounts.verifier.key(),
            timestamp: Clock::get()?.unix_timestamp,
        });
        Ok(())
    }
}

// ── Instruction Accounts ────────────────────────────────────────────

#[derive(Accounts)]
#[instruction(jurisdiction: String)]
pub struct Initialize<'info> {
    #[account(init, payer = authority, space = ProgramConfig::SPACE, seeds = [b"config", jurisdiction.as_bytes()], bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct ManageDelegates<'info> {
    #[account(mut, seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
pub struct FundOperations<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub funder: Signer<'info>,
    /// CHECK: Validated against config.operations_wallet
    #[account(mut, constraint = operations_wallet.key() == config.operations_wallet)]
    pub operations_wallet: AccountInfo<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct OpenCase<'info> {
    #[account(mut, seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(init, payer = authority, space = CaseFile::SPACE, seeds = [b"case", case_id.as_bytes()], bump)]
    pub case_file: Account<'info, CaseFile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct LinkCredential<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Validated in handler: owner == SAS, schema, expiry, nonce.
    pub credential_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct ReassignLawyer<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Credential liveness re-check if linked.
    pub credential_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct AnchorDocument<'info> {
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Credential liveness re-check.
    pub credential_account: AccountInfo<'info>,
    pub lawyer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct CloseCase<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Credential liveness re-check.
    pub credential_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct UpdateCaseStatus<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct ReopenCase<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct MarkPaid<'info> {
    #[account(seeds = [b"config", config.jurisdiction.as_bytes()], bump = config.bump)]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut, seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct VerifyZkDisclosure<'info> {
    #[account(seeds = [b"case", case_id.as_bytes()], bump = case_file.bump)]
    pub case_file: Account<'info, CaseFile>,
    pub verifier: Signer<'info>,
}

// ── Events ──────────────────────────────────────────────────────────

#[event]
pub struct ZkDisclosureVerified {
    pub case_id: String,
    pub disclosed_value: [u8; 32],
    pub disclosure_index: u8,
    pub predicate_satisfied: bool,
    pub verifier: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct LawyerReassigned {
    pub case_id: String,
    pub old_lawyer_commitment: [u8; 32],
    pub new_lawyer_commitment: [u8; 32],
    pub reason: String,
    pub reassigned_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CaseStatusUpdated {
    pub case_id: String,
    pub old_status: CaseStatus,
    pub new_status: CaseStatus,
    pub updated_by: Pubkey,
    pub timestamp: i64,
}

#[event]
pub struct CaseReopened {
    pub case_id: String,
    pub reason: String,
    pub reopened_by: Pubkey,
    pub timestamp: i64,
}
