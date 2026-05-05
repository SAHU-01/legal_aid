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
import { Connection, PublicKey, Keypair } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
export declare const PROGRAM_ID: PublicKey;
export declare const SAS_PROGRAM_ID: PublicKey;
export declare const DEFAULT_SCHEMA: PublicKey;
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
export type CaseStatus = "Open" | "InProgress" | "Closed" | "Paid" | "Stayed" | "Appealed" | "Withdrawn" | "Remanded";
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
export declare function deriveConfigPda(jurisdiction: string, programId?: PublicKey): [PublicKey, number];
export declare function deriveCasePda(caseId: string, programId?: PublicKey): [PublicKey, number];
/**
 * Generate a lawyer commitment (hash of pubkey + random salt).
 * The commitment goes on-chain. The salt stays with the lawyer.
 * Lawyer proves identity during anchor_document by providing the salt.
 */
export declare function createLawyerCommitment(lawyerPubkey: PublicKey): LawyerCommitment;
/**
 * Verify a lawyer commitment matches a pubkey + salt.
 */
export declare function verifyLawyerCommitment(lawyerPubkey: PublicKey, salt: Uint8Array, commitment: Uint8Array): boolean;
/**
 * Hash a citizen's national ID for custodial cases.
 * The hash goes on-chain. The raw ID never touches the blockchain.
 */
export declare function hashCitizenId(nationalId: string): Uint8Array;
export declare class AdduceClient {
    readonly connection: Connection;
    readonly program: anchor.Program;
    readonly wallet: anchor.Wallet;
    readonly programId: PublicKey;
    constructor(config: AdduceConfig);
    initialize(params: InitializeParams): Promise<string>;
    /**
     * Open a new case. Returns { txSignature, casePda, lawyerCommitment }.
     * Store the lawyerCommitment.salt securely: the lawyer needs it for anchor_document.
     */
    openCase(params: OpenCaseParams, jurisdiction: string): Promise<{
        txSignature: string;
        casePda: PublicKey;
        lawyerCommitment: LawyerCommitment;
    }>;
    /**
     * Open a custodial case (citizen has no wallet).
     */
    openCaseCustodial(params: OpenCaseCustodialParams, jurisdiction: string): Promise<{
        txSignature: string;
        casePda: PublicKey;
        lawyerCommitment: LawyerCommitment;
        citizenIdHash: Uint8Array<ArrayBufferLike>;
    }>;
    /**
     * Link a SAS credential to a case.
     */
    linkCredential(params: LinkCredentialParams, jurisdiction: string): Promise<string>;
    /**
     * Anchor a document hash. Lawyer proves identity via their salt.
     */
    anchorDocument(params: AnchorDocumentParams, lawyerSalt: Uint8Array, credentialAddress: PublicKey): Promise<string>;
    /**
     * Close a case. Reviewer, delegate, or authority (if timed out).
     */
    closeCase(caseId: string, credentialAddress: PublicKey, jurisdiction: string): Promise<string>;
    /**
     * Mark case as paid with amount validation and payment reference.
     */
    markPaid(params: MarkPaidParams, jurisdiction: string): Promise<string>;
    reassignLawyer(params: ReassignLawyerParams, credentialAddress: PublicKey, jurisdiction: string): Promise<{
        txSignature: string;
        newLawyerCommitment: LawyerCommitment;
    }>;
    updateCaseStatus(caseId: string, newStatus: CaseStatus, jurisdiction: string): Promise<string>;
    reopenCase(caseId: string, reason: string, jurisdiction: string): Promise<string>;
    addDelegate(delegate: PublicKey, jurisdiction: string): Promise<string>;
    removeDelegate(delegate: PublicKey, jurisdiction: string): Promise<string>;
    fundOperations(amount: number, jurisdiction: string, operationsWallet: PublicKey): Promise<string>;
    verifyZkDisclosure(caseId: string, proofData: Uint8Array, publicInputs: Uint8Array[]): Promise<string>;
    getCase(caseId: string): Promise<CaseFile | null>;
    getConfig(jurisdiction: string): Promise<any>;
    getAllCases(): Promise<{
        pubkey: PublicKey;
        account: CaseFile;
    }[]>;
    getCasesByStatus(status: CaseStatus): Promise<{
        pubkey: PublicKey;
        account: CaseFile;
    }[]>;
}
export { PublicKey, Keypair, Connection } from "@solana/web3.js";
export { BN } from "@coral-xyz/anchor";
