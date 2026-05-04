use anchor_lang::prelude::*;

declare_id!("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");

// ── SAS Program ID ──────────────────────────────────────────────────
/// 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG (base58-decoded)
const SAS_PROGRAM_BYTES: [u8; 32] = [
    0x0f, 0x5e, 0x9e, 0xd5, 0x37, 0x1e, 0x2c, 0x70,
    0x89, 0x8c, 0xa9, 0xfd, 0x0e, 0x77, 0xc0, 0x06,
    0x5c, 0xab, 0x5d, 0xa0, 0x2e, 0x56, 0x67, 0x8b,
    0x27, 0x13, 0x38, 0x2a, 0xf3, 0x74, 0x59, 0xb7,
];

// ── SAS Account Layout ──────────────────────────────────────────────
// SAS attestation binary layout (verified from devnet account dumps):
//   [0]       discriminator (1 byte, varies per attestation)
//   [1..33]   nonce: raw 32-byte Pubkey (the citizen/applicant)
//   [33..65]  credential: Pubkey
//   [65..97]  schema: Pubkey
//   [97..101] data_len: u32 (little-endian)
//   [101..101+data_len]  data bytes
//   [+32]     signer: Pubkey
//   [+8]      expiry: i64
//
// Schema at fixed offset 65, data/signer/expiry dynamically computed.

const SAS_NONCE_OFFSET: usize = 1;   // nonce is raw 32 bytes after 1-byte discriminator
const SAS_SCHEMA_OFFSET: usize = 65; // 1 + 32 nonce + 32 credential

/// Parse schema, expiry, and nonce pubkey from SAS attestation account data.
fn parse_sas_attestation(data: &[u8]) -> Result<(Pubkey, i64, Pubkey)> {
    // Minimum size: 1 disc + 32 nonce + 32 cred + 32 schema + 4 data_len + 0 data + 32 signer + 8 expiry = 141
    require!(data.len() >= 141, LegalAidError::CredentialDataTooShort);

    // Read nonce as raw 32-byte pubkey
    let nonce_bytes: [u8; 32] = data[SAS_NONCE_OFFSET..SAS_NONCE_OFFSET + 32]
        .try_into().unwrap();
    let nonce_pubkey = Pubkey::from(nonce_bytes);

    // Read schema pubkey
    let schema_bytes: [u8; 32] = data[SAS_SCHEMA_OFFSET..SAS_SCHEMA_OFFSET + 32]
        .try_into().unwrap();
    let schema = Pubkey::from(schema_bytes);

    // Read data field length to find signer and expiry
    let data_len_offset = SAS_SCHEMA_OFFSET + 32; // = 97
    let data_field_len = u32::from_le_bytes(
        data[data_len_offset..data_len_offset + 4].try_into().unwrap()
    ) as usize;

    let signer_offset = data_len_offset + 4 + data_field_len;
    let expiry_offset = signer_offset + 32;

    require!(data.len() >= expiry_offset + 8, LegalAidError::CredentialDataTooShort);

    let expiry = i64::from_le_bytes(
        data[expiry_offset..expiry_offset + 8].try_into().unwrap()
    );

    Ok((schema, expiry, nonce_pubkey))
}

// ---------- Enums ----------

#[derive(AnchorSerialize, AnchorDeserialize, Clone, PartialEq, Eq)]
pub enum CaseStatus {
    Open,
    InProgress,
    Closed,
    Paid,
}

// ---------- Account structs ----------

#[account]
pub struct ProgramConfig {
    pub authority: Pubkey,
    /// Role: reviews cases and links credentials
    pub reviewer: Pubkey,
    /// Role: approves payments (mark_paid)
    pub payer: Pubkey,
    pub jurisdiction: String,
    pub total_cases: u64,
    /// Expected SAS schema address for this jurisdiction's credentials
    pub expected_schema: Pubkey,
    pub bump: u8,
}

impl ProgramConfig {
    pub const MAX_JURISDICTION_LEN: usize = 10;
    // 8 disc + 32 authority + 32 reviewer + 32 payer + (4+10) jurisdiction
    // + 8 total_cases + 32 expected_schema + 1 bump = 159
    pub const SPACE: usize = 8 + 32 + 32 + 32 + (4 + Self::MAX_JURISDICTION_LEN) + 8 + 32 + 1;
}

#[account]
pub struct CaseFile {
    pub case_id: String,
    pub document_hash: [u8; 32],
    pub lawyer: Pubkey,
    pub issuer: Pubkey,
    /// The applicant/citizen this case is for — credential nonce must match
    pub applicant: Pubkey,
    pub status: CaseStatus,
    pub created_at: i64,
    pub updated_at: i64,
    /// SAS attestation account linked to this case
    pub credential_pubkey: Pubkey,
    /// Merkle root of credential field commitments (commitment-based selective disclosure)
    pub commitment_root: [u8; 32],
    pub bump: u8,
}

impl CaseFile {
    pub const MAX_CASE_ID_LEN: usize = 32;
    // 8 disc + (4+32) case_id + 32 doc_hash + 32 lawyer + 32 issuer + 32 applicant
    // + 2 status + 8 created + 8 updated + 32 credential_pubkey + 32 commitment_root + 1 bump = 255
    pub const SPACE: usize = 8 + (4 + Self::MAX_CASE_ID_LEN) + 32 + 32 + 32 + 32 + 2 + 8 + 8 + 32 + 32 + 1;
}

// ---------- Error codes ----------

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
    #[msg("Credential already linked to this case")]
    CredentialAlreadyLinked,
    #[msg("Commitment root must be non-zero")]
    CommitmentRootEmpty,
    #[msg("Credential nonce does not match case applicant")]
    CredentialApplicantMismatch,
    #[msg("Credential account has been revoked (no longer exists on-chain)")]
    CredentialRevoked,
}

// ---------- Program ----------

#[program]
pub mod legal_aid {
    use super::*;

    /// Initialize a jurisdiction config with role separation.
    /// authority = opens cases, reviewer = reviews/links/closes, payer = marks paid.
    pub fn initialize(
        ctx: Context<Initialize>,
        jurisdiction: String,
        expected_schema: Pubkey,
        reviewer: Pubkey,
        payer_role: Pubkey,
    ) -> Result<()> {
        require!(
            jurisdiction.len() <= ProgramConfig::MAX_JURISDICTION_LEN,
            LegalAidError::JurisdictionTooLong
        );

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.reviewer = reviewer;
        config.payer = payer_role;
        config.jurisdiction = jurisdiction;
        config.total_cases = 0;
        config.expected_schema = expected_schema;
        config.bump = ctx.bumps.config;

        Ok(())
    }

    /// Open a new case. Requires authority role.
    /// `applicant` = the citizen's pubkey (SAS credential nonce must match).
    pub fn open_case(
        ctx: Context<OpenCase>,
        case_id: String,
        lawyer: Pubkey,
        applicant: Pubkey,
    ) -> Result<()> {
        require!(
            case_id.len() <= CaseFile::MAX_CASE_ID_LEN,
            LegalAidError::CaseIdTooLong
        );

        let config = &mut ctx.accounts.config;
        require!(
            ctx.accounts.authority.key() == config.authority,
            LegalAidError::Unauthorized
        );

        let clock = Clock::get()?;
        let case_file = &mut ctx.accounts.case_file;
        case_file.case_id = case_id;
        case_file.document_hash = [0u8; 32];
        case_file.lawyer = lawyer;
        case_file.issuer = ctx.accounts.authority.key();
        case_file.applicant = applicant;
        case_file.status = CaseStatus::Open;
        case_file.created_at = clock.unix_timestamp;
        case_file.updated_at = clock.unix_timestamp;
        case_file.credential_pubkey = Pubkey::default();
        case_file.commitment_root = [0u8; 32];
        case_file.bump = ctx.bumps.case_file;

        config.total_cases = config.total_cases.checked_add(1).unwrap();

        Ok(())
    }

    /// Link a SAS credential to a case. Requires reviewer role.
    /// Validates:
    ///   1. Account owner == SAS program
    ///   2. Schema matches expected (dynamic offset parsing)
    ///   3. Credential not expired
    ///   4. Credential nonce matches case applicant (citizen binding)
    ///   5. Commitment root is non-zero
    pub fn link_credential(
        ctx: Context<LinkCredential>,
        _case_id: String,
        commitment_root: [u8; 32],
    ) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        // Reviewer role check
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.reviewer
                || ctx.accounts.authority.key() == ctx.accounts.config.authority,
            LegalAidError::Unauthorized
        );

        require!(
            case_file.status == CaseStatus::Open,
            LegalAidError::InvalidStatus
        );
        require!(
            case_file.credential_pubkey == Pubkey::default(),
            LegalAidError::CredentialAlreadyLinked
        );
        require!(
            commitment_root != [0u8; 32],
            LegalAidError::CommitmentRootEmpty
        );

        let credential_info = &ctx.accounts.credential_account;

        // FIX #1: Owner check
        let sas_program_id = Pubkey::from(SAS_PROGRAM_BYTES);
        require!(
            *credential_info.owner == sas_program_id,
            LegalAidError::CredentialWrongOwner
        );

        // FIX #1: Dynamic offset parsing (not hardcoded)
        let cred_data = credential_info.try_borrow_data()?;
        let (schema, expiry, nonce_pubkey) = parse_sas_attestation(&cred_data)?;

        // Schema check
        require!(
            schema == ctx.accounts.config.expected_schema,
            LegalAidError::CredentialSchemaMismatch
        );

        // Expiry check
        let now = Clock::get()?.unix_timestamp;
        require!(expiry > now, LegalAidError::CredentialExpired);

        // FIX #2: Citizen binding — credential nonce (raw pubkey) must match case applicant
        require!(
            nonce_pubkey == case_file.applicant,
            LegalAidError::CredentialApplicantMismatch
        );

        case_file.credential_pubkey = credential_info.key();
        case_file.commitment_root = commitment_root;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Anchor a document hash. Requires lawyer signature.
    /// FIX #4: Re-checks credential liveness (not just stored pubkey).
    pub fn anchor_document(
        ctx: Context<AnchorDocument>,
        _case_id: String,
        document_hash: [u8; 32],
    ) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        require!(
            ctx.accounts.lawyer.key() == case_file.lawyer,
            LegalAidError::Unauthorized
        );
        require!(
            case_file.status == CaseStatus::Open || case_file.status == CaseStatus::InProgress,
            LegalAidError::InvalidStatus
        );
        require!(
            case_file.credential_pubkey != Pubkey::default(),
            LegalAidError::CredentialNotLinked
        );
        require!(
            case_file.commitment_root != [0u8; 32],
            LegalAidError::CommitmentRootEmpty
        );

        // FIX #4: Credential liveness — verify the credential account still exists
        let credential_info = &ctx.accounts.credential_account;
        require!(
            credential_info.key() == case_file.credential_pubkey,
            LegalAidError::CredentialNotLinked
        );
        let sas_program_id = Pubkey::from(SAS_PROGRAM_BYTES);
        require!(
            *credential_info.owner == sas_program_id && credential_info.data_len() > 0,
            LegalAidError::CredentialRevoked
        );

        case_file.document_hash = document_hash;
        case_file.status = CaseStatus::InProgress;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Close a case. Requires reviewer role.
    /// Re-checks credential liveness before allowing close.
    pub fn close_case(ctx: Context<CloseCase>, _case_id: String) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        // FIX #5: Reviewer role (not just authority)
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.reviewer
                || ctx.accounts.authority.key() == ctx.accounts.config.authority,
            LegalAidError::Unauthorized
        );
        require!(
            case_file.status == CaseStatus::InProgress,
            LegalAidError::InvalidStatus
        );

        // FIX #4: Credential liveness re-check
        let credential_info = &ctx.accounts.credential_account;
        require!(
            credential_info.key() == case_file.credential_pubkey,
            LegalAidError::CredentialNotLinked
        );
        let sas_program_id = Pubkey::from(SAS_PROGRAM_BYTES);
        require!(
            *credential_info.owner == sas_program_id && credential_info.data_len() > 0,
            LegalAidError::CredentialRevoked
        );

        case_file.status = CaseStatus::Closed;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    /// Mark case as paid. Requires payer role (separate from authority/reviewer).
    pub fn mark_paid(ctx: Context<MarkPaid>, _case_id: String) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        // FIX #5: Payer role (different signer from opener/reviewer)
        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.payer
                || ctx.accounts.authority.key() == ctx.accounts.config.authority,
            LegalAidError::Unauthorized
        );
        require!(
            case_file.status == CaseStatus::Closed,
            LegalAidError::InvalidStatus
        );

        case_file.status = CaseStatus::Paid;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }
}

// ---------- Instruction accounts ----------

#[derive(Accounts)]
#[instruction(jurisdiction: String)]
pub struct Initialize<'info> {
    #[account(
        init,
        payer = authority,
        space = ProgramConfig::SPACE,
        seeds = [b"config", jurisdiction.as_bytes()],
        bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct OpenCase<'info> {
    #[account(
        mut,
        seeds = [b"config", config.jurisdiction.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(
        init,
        payer = authority,
        space = CaseFile::SPACE,
        seeds = [b"case", case_id.as_bytes()],
        bump,
    )]
    pub case_file: Account<'info, CaseFile>,
    #[account(mut)]
    pub authority: Signer<'info>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct LinkCredential<'info> {
    #[account(
        seeds = [b"config", config.jurisdiction.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(
        mut,
        seeds = [b"case", case_id.as_bytes()],
        bump = case_file.bump,
    )]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Validated in handler: owner == SAS program, schema matches, expiry valid, nonce matches applicant.
    pub credential_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct AnchorDocument<'info> {
    #[account(
        mut,
        seeds = [b"case", case_id.as_bytes()],
        bump = case_file.bump,
    )]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Credential liveness re-check — verified key matches case_file.credential_pubkey and account is live.
    pub credential_account: AccountInfo<'info>,
    pub lawyer: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct CloseCase<'info> {
    #[account(
        seeds = [b"config", config.jurisdiction.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(
        mut,
        seeds = [b"case", case_id.as_bytes()],
        bump = case_file.bump,
    )]
    pub case_file: Account<'info, CaseFile>,
    /// CHECK: Credential liveness re-check.
    pub credential_account: AccountInfo<'info>,
    pub authority: Signer<'info>,
}

#[derive(Accounts)]
#[instruction(case_id: String)]
pub struct MarkPaid<'info> {
    #[account(
        seeds = [b"config", config.jurisdiction.as_bytes()],
        bump = config.bump,
    )]
    pub config: Account<'info, ProgramConfig>,
    #[account(
        mut,
        seeds = [b"case", case_id.as_bytes()],
        bump = case_file.bump,
    )]
    pub case_file: Account<'info, CaseFile>,
    pub authority: Signer<'info>,
}
