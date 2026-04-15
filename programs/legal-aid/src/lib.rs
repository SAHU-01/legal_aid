use anchor_lang::prelude::*;

declare_id!("HFg8TFxt2LU1pXqVmKYqJHsHDnc7wne1bHH4V1S3EDUe");

#[program]
pub mod legal_aid {
    use super::*;

    pub fn initialize(ctx: Context<Initialize>) -> Result<()> {
        msg!("Greetings from: {:?}", ctx.program_id);
        Ok(())
    }
}

#[derive(Accounts)]
pub struct Initialize {}
