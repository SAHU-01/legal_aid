import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import type { LegalAid } from "../../target/types/legal_aid";

const PROGRAM_ID = new PublicKey(
  "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV"
);

// --- Types ---

type CaseFileAccount = anchor.IdlAccounts<LegalAid>["caseFile"];
type ProgramConfigAccount = anchor.IdlAccounts<LegalAid>["programConfig"];

export interface CaseFileEntry {
  publicKey: PublicKey;
  account: CaseFileAccount;
}

export interface ProgramConfigEntry {
  publicKey: PublicKey;
  account: ProgramConfigAccount;
}

// --- 1. Scan closed cases ---

export async function scanClosedCases(
  connection: Connection,
  program: Program<LegalAid>
): Promise<CaseFileEntry[]> {
  const allCases = await program.account.caseFile.all();

  return allCases.filter((entry) => {
    // Anchor deserialises enums as objects with a single key, e.g. { closed: {} }
    const status = entry.account.status;
    return "closed" in status;
  });
}

// --- 2. Scan program configs (existing jurisdictions) ---

export async function scanProgramConfigs(
  connection: Connection,
  program: Program<LegalAid>
): Promise<ProgramConfigEntry[]> {
  return program.account.programConfig.all();
}

// --- 3. Get a single case by ID ---

export async function getCaseByIdOnChain(
  program: Program<LegalAid>,
  caseId: string
): Promise<CaseFileEntry | null> {
  const [pda] = PublicKey.findProgramAddressSync(
    [Buffer.from("case"), Buffer.from(caseId)],
    PROGRAM_ID
  );

  try {
    const account = await program.account.caseFile.fetch(pda);
    return { publicKey: pda, account };
  } catch {
    // Account does not exist on-chain
    return null;
  }
}
