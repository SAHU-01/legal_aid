use anchor_lang::prelude::*;

declare_id!("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");

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
    pub jurisdiction: String,
    pub total_cases: u64,
    pub bump: u8,
}

// Space: 8 discriminator + 32 authority + (4 + 10) jurisdiction + 8 total_cases + 1 bump = 63
impl ProgramConfig {
    pub const MAX_JURISDICTION_LEN: usize = 10;
    pub const SPACE: usize = 8 + 32 + (4 + Self::MAX_JURISDICTION_LEN) + 8 + 1;
}

#[account]
pub struct CaseFile {
    pub case_id: String,
    pub document_hash: [u8; 32],
    pub lawyer: Pubkey,
    pub issuer: Pubkey,
    pub status: CaseStatus,
    pub created_at: i64,
    pub updated_at: i64,
    pub bump: u8,
}

// Space: 8 + (4+32) + 32 + 32 + 32 + 1+1 (enum) + 8 + 8 + 1 = 159
impl CaseFile {
    pub const MAX_CASE_ID_LEN: usize = 32;
    pub const SPACE: usize = 8 + (4 + Self::MAX_CASE_ID_LEN) + 32 + 32 + 32 + 2 + 8 + 8 + 1;
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
}

// ---------- Program ----------

#[program]
pub mod legal_aid {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>, jurisdiction: String) -> Result<()> {
        require!(
            jurisdiction.len() <= ProgramConfig::MAX_JURISDICTION_LEN,
            LegalAidError::JurisdictionTooLong
        );

        let config = &mut ctx.accounts.config;
        config.authority = ctx.accounts.authority.key();
        config.jurisdiction = jurisdiction;
        config.total_cases = 0;
        config.bump = ctx.bumps.config;

        Ok(())
    }

    pub fn open_case(ctx: Context<OpenCase>, case_id: String, lawyer: Pubkey) -> Result<()> {
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
        case_file.status = CaseStatus::Open;
        case_file.created_at = clock.unix_timestamp;
        case_file.updated_at = clock.unix_timestamp;
        case_file.bump = ctx.bumps.case_file;

        config.total_cases = config.total_cases.checked_add(1).unwrap();

        Ok(())
    }

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

        case_file.document_hash = document_hash;
        case_file.status = CaseStatus::InProgress;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn close_case(ctx: Context<CloseCase>, _case_id: String) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.authority,
            LegalAidError::Unauthorized
        );
        require!(
            case_file.status == CaseStatus::InProgress,
            LegalAidError::InvalidStatus
        );

        case_file.status = CaseStatus::Closed;
        case_file.updated_at = Clock::get()?.unix_timestamp;

        Ok(())
    }

    pub fn mark_paid(ctx: Context<MarkPaid>, _case_id: String) -> Result<()> {
        let case_file = &mut ctx.accounts.case_file;

        require!(
            ctx.accounts.authority.key() == ctx.accounts.config.authority,
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
pub struct AnchorDocument<'info> {
    #[account(
        mut,
        seeds = [b"case", case_id.as_bytes()],
        bump = case_file.bump,
    )]
    pub case_file: Account<'info, CaseFile>,
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
