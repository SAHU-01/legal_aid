/**
 * @adduce/sdk
 *
 * Issue. Prove. Settle.
 *
 * The Adduce SDK provides a clean TypeScript interface to the Adduce
 * legal aid credential protocol deployed on Solana. All 14 program
 * instructions are callable through this SDK against the existing
 * deployed program. No cloning, no deploying, no scripts.
 *
 * Usage:
 *   import { AdduceClient } from "@adduce/sdk";
 *   const adduce = new AdduceClient({ cluster: "devnet", wallet });
 *   await adduce.openCase({ ... });
 */

import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  TransactionInstruction,
} from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import { createHash, randomBytes } from "crypto";

// ── Constants ───────────────────────────────────────────────────────

export const PROGRAM_ID = new PublicKey("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");
export const SAS_PROGRAM_ID = new PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
export const DEFAULT_SCHEMA = new PublicKey("7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid");

// ── Types ───────────────────────────────────────────────────────────

export interface AdduceConfig {
  /** "devnet" | "mainnet-beta" | custom RPC URL */
  cluster: string;
  /** Wallet keypair or Anchor wallet */
  wallet: Keypair | anchor.Wallet;
  /** Optional: custom program ID (defaults to deployed devnet program) */
  programId?: PublicKey;
}

export interface InitializeParams {
  jurisdiction: string;
  expectedSchema: PublicKey;
  reviewer: PublicKey;
  payer: PublicKey;
  operationsWallet: PublicKey;
  caseTimeoutDays: number;
}

export interface OpenCaseParams {
  caseId: string;
  lawyerPubkey: PublicKey;
  applicant: PublicKey;
  authorizedAmount: number;
}

export interface OpenCaseCustodialParams {
  caseId: string;
  lawyerPubkey: PublicKey;
  citizenNationalId: string;
  custodian: PublicKey;
  authorizedAmount: number;
}

export interface LinkCredentialParams {
  caseId: string;
  credentialAddress: PublicKey;
  commitmentRoot: Uint8Array;
}

export interface AnchorDocumentParams {
  caseId: string;
  documentHash: Uint8Array;
}

export interface ReassignLawyerParams {
  caseId: string;
  newLawyerPubkey: PublicKey;
  reason: string;
}

export interface MarkPaidParams {
  caseId: string;
  disbursedAmount: number;
  paymentReference: string;
}

export type CaseStatus =
  | "Open"
  | "InProgress"
  | "Closed"
  | "Paid"
  | "Stayed"
  | "Appealed"
  | "Withdrawn"
  | "Remanded";

export interface CaseFile {
  caseId: string;
  documentHash: number[];
  lawyerCommitment: number[];
  issuer: PublicKey;
  applicant: PublicKey;
  status: CaseStatus;
  createdAt: number;
  updatedAt: number;
  credentialPubkey: PublicKey;
  commitmentRoot: number[];
  custodian: PublicKey;
  citizenIdHash: number[];
  authorizedAmount: number;
  disbursedAmount: number;
  paymentReference: string;
}

export interface LawyerCommitment {
  commitment: Uint8Array;
  salt: Uint8Array;
}

// ── PDA Derivation ──────────────────────────────────────────────────

export function deriveConfigPda(
  jurisdiction: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(jurisdiction)],
    programId
  );
}

export function deriveCasePda(
  caseId: string,
  programId: PublicKey = PROGRAM_ID
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("case"), Buffer.from(caseId)],
    programId
  );
}

// ── Lawyer Commitment ───────────────────────────────────────────────

/**
 * Generate a lawyer commitment (hash of pubkey + random salt).
 * The commitment goes on-chain. The salt stays with the lawyer.
 * Lawyer proves identity during anchor_document by providing the salt.
 */
export function createLawyerCommitment(lawyerPubkey: PublicKey): LawyerCommitment {
  const salt = randomBytes(32);
  const commitment = createHash("sha256")
    .update(Buffer.concat([lawyerPubkey.toBytes(), salt]))
    .digest();
  return {
    commitment: new Uint8Array(commitment),
    salt: new Uint8Array(salt),
  };
}

/**
 * Verify a lawyer commitment matches a pubkey + salt.
 */
export function verifyLawyerCommitment(
  lawyerPubkey: PublicKey,
  salt: Uint8Array,
  commitment: Uint8Array
): boolean {
  const computed = createHash("sha256")
    .update(Buffer.concat([lawyerPubkey.toBytes(), Buffer.from(salt)]))
    .digest();
  return Buffer.from(computed).equals(Buffer.from(commitment));
}

/**
 * Hash a citizen's national ID for custodial cases.
 * The hash goes on-chain. The raw ID never touches the blockchain.
 */
export function hashCitizenId(nationalId: string): Uint8Array {
  return new Uint8Array(
    createHash("sha256").update(nationalId).digest()
  );
}

// ── Client ──────────────────────────────────────────────────────────

export class AdduceClient {
  readonly connection: Connection;
  readonly program: anchor.Program;
  readonly wallet: anchor.Wallet;
  readonly programId: PublicKey;

  constructor(config: AdduceConfig) {
    const rpcUrl = config.cluster === "devnet"
      ? "https://api.devnet.solana.com"
      : config.cluster === "mainnet-beta"
        ? "https://api.mainnet-beta.solana.com"
        : config.cluster;

    this.connection = new Connection(rpcUrl, "confirmed");
    this.programId = config.programId ?? PROGRAM_ID;

    this.wallet = config.wallet instanceof Keypair
      ? new anchor.Wallet(config.wallet)
      : config.wallet;

    const provider = new anchor.AnchorProvider(
      this.connection,
      this.wallet,
      { commitment: "confirmed" }
    );

    // Load IDL from chain or use local
    this.program = new anchor.Program(
      require("../../target/idl/legal_aid.json"),
      provider
    );
  }

  // ── Jurisdiction Setup ──────────────────────────────────────────

  async initialize(params: InitializeParams): Promise<string> {
    const [configPda] = deriveConfigPda(params.jurisdiction, this.programId);
    return this.program.methods
      .initialize(
        params.jurisdiction,
        params.expectedSchema,
        params.reviewer,
        params.payer,
        params.operationsWallet,
        params.caseTimeoutDays
      )
      .accounts({
        config: configPda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ── Case Lifecycle ──────────────────────────────────────────────

  /**
   * Open a new case. Returns { txSignature, casePda, lawyerCommitment }.
   * Store the lawyerCommitment.salt securely: the lawyer needs it for anchor_document.
   */
  async openCase(params: OpenCaseParams, jurisdiction: string) {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(params.caseId, this.programId);
    const lc = createLawyerCommitment(params.lawyerPubkey);

    const tx = await this.program.methods
      .openCase(
        params.caseId,
        Array.from(lc.commitment),
        params.applicant,
        new anchor.BN(params.authorizedAmount)
      )
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return {
      txSignature: tx,
      casePda,
      lawyerCommitment: lc,
    };
  }

  /**
   * Open a custodial case (citizen has no wallet).
   */
  async openCaseCustodial(params: OpenCaseCustodialParams, jurisdiction: string) {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(params.caseId, this.programId);
    const lc = createLawyerCommitment(params.lawyerPubkey);
    const citizenIdHash = hashCitizenId(params.citizenNationalId);

    const tx = await this.program.methods
      .openCaseCustodial(
        params.caseId,
        Array.from(lc.commitment),
        Array.from(citizenIdHash),
        params.custodian,
        new anchor.BN(params.authorizedAmount)
      )
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: this.wallet.publicKey,
        systemProgram: SystemProgram.programId,
      })
      .rpc();

    return { txSignature: tx, casePda, lawyerCommitment: lc, citizenIdHash };
  }

  /**
   * Link a SAS credential to a case.
   */
  async linkCredential(params: LinkCredentialParams, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(params.caseId, this.programId);

    return this.program.methods
      .linkCredential(params.caseId, Array.from(params.commitmentRoot))
      .accounts({
        config: configPda,
        caseFile: casePda,
        credentialAccount: params.credentialAddress,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Anchor a document hash. Lawyer proves identity via their salt.
   */
  async anchorDocument(
    params: AnchorDocumentParams,
    lawyerSalt: Uint8Array,
    credentialAddress: PublicKey
  ): Promise<string> {
    const [casePda] = deriveCasePda(params.caseId, this.programId);

    return this.program.methods
      .anchorDocument(
        params.caseId,
        Array.from(params.documentHash),
        Array.from(lawyerSalt)
      )
      .accounts({
        caseFile: casePda,
        credentialAccount: credentialAddress,
        lawyer: this.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Close a case. Reviewer, delegate, or authority (if timed out).
   */
  async closeCase(caseId: string, credentialAddress: PublicKey, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(caseId, this.programId);

    return this.program.methods
      .closeCase(caseId)
      .accounts({
        config: configPda,
        caseFile: casePda,
        credentialAccount: credentialAddress,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  /**
   * Mark case as paid with amount validation and payment reference.
   */
  async markPaid(params: MarkPaidParams, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(params.caseId, this.programId);

    return this.program.methods
      .markPaid(
        params.caseId,
        new anchor.BN(params.disbursedAmount),
        params.paymentReference
      )
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  // ── Extended Operations ─────────────────────────────────────────

  async reassignLawyer(
    params: ReassignLawyerParams,
    credentialAddress: PublicKey,
    jurisdiction: string
  ) {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(params.caseId, this.programId);
    const newLc = createLawyerCommitment(params.newLawyerPubkey);

    const tx = await this.program.methods
      .reassignLawyer(
        params.caseId,
        Array.from(newLc.commitment),
        params.reason
      )
      .accounts({
        config: configPda,
        caseFile: casePda,
        credentialAccount: credentialAddress,
        authority: this.wallet.publicKey,
      })
      .rpc();

    return { txSignature: tx, newLawyerCommitment: newLc };
  }

  async updateCaseStatus(
    caseId: string,
    newStatus: CaseStatus,
    jurisdiction: string
  ): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(caseId, this.programId);

    return this.program.methods
      .updateCaseStatus(caseId, { [newStatus.charAt(0).toLowerCase() + newStatus.slice(1)]: {} } as any)
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  async reopenCase(caseId: string, reason: string, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    const [casePda] = deriveCasePda(caseId, this.programId);

    return this.program.methods
      .reopenCase(caseId, reason)
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  // ── Delegation ──────────────────────────────────────────────────

  async addDelegate(delegate: PublicKey, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);

    return this.program.methods
      .addDelegate(delegate)
      .accounts({
        config: configPda,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  async removeDelegate(delegate: PublicKey, jurisdiction: string): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);

    return this.program.methods
      .removeDelegate(delegate)
      .accounts({
        config: configPda,
        authority: this.wallet.publicKey,
      })
      .rpc();
  }

  // ── Operations ──────────────────────────────────────────────────

  async fundOperations(amount: number, jurisdiction: string, operationsWallet: PublicKey): Promise<string> {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);

    return this.program.methods
      .fundOperations(new anchor.BN(amount))
      .accounts({
        config: configPda,
        funder: this.wallet.publicKey,
        operationsWallet,
        systemProgram: SystemProgram.programId,
      })
      .rpc();
  }

  // ── ZK Verification ────────────────────────────────────────────

  async verifyZkDisclosure(
    caseId: string,
    proofData: Uint8Array,
    publicInputs: Uint8Array[]
  ): Promise<string> {
    const [casePda] = deriveCasePda(caseId, this.programId);

    return this.program.methods
      .verifyZkDisclosure(
        caseId,
        Array.from(proofData),
        publicInputs.map((pi) => Array.from(pi))
      )
      .accounts({
        caseFile: casePda,
        verifier: this.wallet.publicKey,
      })
      .rpc();
  }

  // ── Read Operations ─────────────────────────────────────────────

  async getCase(caseId: string): Promise<CaseFile | null> {
    const [casePda] = deriveCasePda(caseId, this.programId);
    try {
      const accounts = this.program.account as any;
      const account = await accounts.caseFile.fetch(casePda);
      return account as CaseFile;
    } catch {
      return null;
    }
  }

  async getConfig(jurisdiction: string) {
    const [configPda] = deriveConfigPda(jurisdiction, this.programId);
    try {
      const accounts = this.program.account as any;
      return await accounts.programConfig.fetch(configPda);
    } catch {
      return null;
    }
  }

  async getAllCases(): Promise<{ pubkey: PublicKey; account: CaseFile }[]> {
    const accounts = this.program.account as any;
    return await accounts.caseFile.all();
  }

  async getCasesByStatus(status: CaseStatus): Promise<{ pubkey: PublicKey; account: CaseFile }[]> {
    const all = await this.getAllCases();
    return all.filter((c: any) => {
      const s = c.account.status;
      return typeof s === "object" && Object.keys(s)[0]?.toLowerCase() === status.toLowerCase();
    });
  }
}

// ── Re-exports ──────────────────────────────────────────────────────

export { PublicKey, Keypair, Connection } from "@solana/web3.js";
export { BN } from "@coral-xyz/anchor";
