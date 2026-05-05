"use strict";
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
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.BN = exports.Connection = exports.Keypair = exports.PublicKey = exports.AdduceClient = exports.DEFAULT_SCHEMA = exports.SAS_PROGRAM_ID = exports.PROGRAM_ID = void 0;
exports.deriveConfigPda = deriveConfigPda;
exports.deriveCasePda = deriveCasePda;
exports.createLawyerCommitment = createLawyerCommitment;
exports.verifyLawyerCommitment = verifyLawyerCommitment;
exports.hashCitizenId = hashCitizenId;
const web3_js_1 = require("@solana/web3.js");
const anchor = __importStar(require("@coral-xyz/anchor"));
const crypto_1 = require("crypto");
// ── Constants ───────────────────────────────────────────────────────
exports.PROGRAM_ID = new web3_js_1.PublicKey("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");
exports.SAS_PROGRAM_ID = new web3_js_1.PublicKey("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");
exports.DEFAULT_SCHEMA = new web3_js_1.PublicKey("7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid");
// ── PDA Derivation ──────────────────────────────────────────────────
function deriveConfigPda(jurisdiction, programId = exports.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("config"), Buffer.from(jurisdiction)], programId);
}
function deriveCasePda(caseId, programId = exports.PROGRAM_ID) {
    return web3_js_1.PublicKey.findProgramAddressSync([Buffer.from("case"), Buffer.from(caseId)], programId);
}
// ── Lawyer Commitment ───────────────────────────────────────────────
/**
 * Generate a lawyer commitment (hash of pubkey + random salt).
 * The commitment goes on-chain. The salt stays with the lawyer.
 * Lawyer proves identity during anchor_document by providing the salt.
 */
function createLawyerCommitment(lawyerPubkey) {
    const salt = (0, crypto_1.randomBytes)(32);
    const commitment = (0, crypto_1.createHash)("sha256")
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
function verifyLawyerCommitment(lawyerPubkey, salt, commitment) {
    const computed = (0, crypto_1.createHash)("sha256")
        .update(Buffer.concat([lawyerPubkey.toBytes(), Buffer.from(salt)]))
        .digest();
    return Buffer.from(computed).equals(Buffer.from(commitment));
}
/**
 * Hash a citizen's national ID for custodial cases.
 * The hash goes on-chain. The raw ID never touches the blockchain.
 */
function hashCitizenId(nationalId) {
    return new Uint8Array((0, crypto_1.createHash)("sha256").update(nationalId).digest());
}
// ── Client ──────────────────────────────────────────────────────────
class AdduceClient {
    constructor(config) {
        const rpcUrl = config.cluster === "devnet"
            ? "https://api.devnet.solana.com"
            : config.cluster === "mainnet-beta"
                ? "https://api.mainnet-beta.solana.com"
                : config.cluster;
        this.connection = new web3_js_1.Connection(rpcUrl, "confirmed");
        this.programId = config.programId ?? exports.PROGRAM_ID;
        this.wallet = config.wallet instanceof web3_js_1.Keypair
            ? new anchor.Wallet(config.wallet)
            : config.wallet;
        const provider = new anchor.AnchorProvider(this.connection, this.wallet, { commitment: "confirmed" });
        // Load IDL from chain or use local
        this.program = new anchor.Program(require("../../target/idl/legal_aid.json"), provider);
    }
    // ── Jurisdiction Setup ──────────────────────────────────────────
    async initialize(params) {
        const [configPda] = deriveConfigPda(params.jurisdiction, this.programId);
        return this.program.methods
            .initialize(params.jurisdiction, params.expectedSchema, params.reviewer, params.payer, params.operationsWallet, params.caseTimeoutDays)
            .accounts({
            config: configPda,
            authority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
    }
    // ── Case Lifecycle ──────────────────────────────────────────────
    /**
     * Open a new case. Returns { txSignature, casePda, lawyerCommitment }.
     * Store the lawyerCommitment.salt securely: the lawyer needs it for anchor_document.
     */
    async openCase(params, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        const [casePda] = deriveCasePda(params.caseId, this.programId);
        const lc = createLawyerCommitment(params.lawyerPubkey);
        const tx = await this.program.methods
            .openCase(params.caseId, Array.from(lc.commitment), params.applicant, new anchor.BN(params.authorizedAmount))
            .accounts({
            config: configPda,
            caseFile: casePda,
            authority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
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
    async openCaseCustodial(params, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        const [casePda] = deriveCasePda(params.caseId, this.programId);
        const lc = createLawyerCommitment(params.lawyerPubkey);
        const citizenIdHash = hashCitizenId(params.citizenNationalId);
        const tx = await this.program.methods
            .openCaseCustodial(params.caseId, Array.from(lc.commitment), Array.from(citizenIdHash), params.custodian, new anchor.BN(params.authorizedAmount))
            .accounts({
            config: configPda,
            caseFile: casePda,
            authority: this.wallet.publicKey,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
        return { txSignature: tx, casePda, lawyerCommitment: lc, citizenIdHash };
    }
    /**
     * Link a SAS credential to a case.
     */
    async linkCredential(params, jurisdiction) {
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
    async anchorDocument(params, lawyerSalt, credentialAddress) {
        const [casePda] = deriveCasePda(params.caseId, this.programId);
        return this.program.methods
            .anchorDocument(params.caseId, Array.from(params.documentHash), Array.from(lawyerSalt))
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
    async closeCase(caseId, credentialAddress, jurisdiction) {
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
    async markPaid(params, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        const [casePda] = deriveCasePda(params.caseId, this.programId);
        return this.program.methods
            .markPaid(params.caseId, new anchor.BN(params.disbursedAmount), params.paymentReference)
            .accounts({
            config: configPda,
            caseFile: casePda,
            authority: this.wallet.publicKey,
        })
            .rpc();
    }
    // ── Extended Operations ─────────────────────────────────────────
    async reassignLawyer(params, credentialAddress, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        const [casePda] = deriveCasePda(params.caseId, this.programId);
        const newLc = createLawyerCommitment(params.newLawyerPubkey);
        const tx = await this.program.methods
            .reassignLawyer(params.caseId, Array.from(newLc.commitment), params.reason)
            .accounts({
            config: configPda,
            caseFile: casePda,
            credentialAccount: credentialAddress,
            authority: this.wallet.publicKey,
        })
            .rpc();
        return { txSignature: tx, newLawyerCommitment: newLc };
    }
    async updateCaseStatus(caseId, newStatus, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        const [casePda] = deriveCasePda(caseId, this.programId);
        return this.program.methods
            .updateCaseStatus(caseId, { [newStatus.charAt(0).toLowerCase() + newStatus.slice(1)]: {} })
            .accounts({
            config: configPda,
            caseFile: casePda,
            authority: this.wallet.publicKey,
        })
            .rpc();
    }
    async reopenCase(caseId, reason, jurisdiction) {
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
    async addDelegate(delegate, jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        return this.program.methods
            .addDelegate(delegate)
            .accounts({
            config: configPda,
            authority: this.wallet.publicKey,
        })
            .rpc();
    }
    async removeDelegate(delegate, jurisdiction) {
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
    async fundOperations(amount, jurisdiction, operationsWallet) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        return this.program.methods
            .fundOperations(new anchor.BN(amount))
            .accounts({
            config: configPda,
            funder: this.wallet.publicKey,
            operationsWallet,
            systemProgram: web3_js_1.SystemProgram.programId,
        })
            .rpc();
    }
    // ── ZK Verification ────────────────────────────────────────────
    async verifyZkDisclosure(caseId, proofData, publicInputs) {
        const [casePda] = deriveCasePda(caseId, this.programId);
        return this.program.methods
            .verifyZkDisclosure(caseId, Array.from(proofData), publicInputs.map((pi) => Array.from(pi)))
            .accounts({
            caseFile: casePda,
            verifier: this.wallet.publicKey,
        })
            .rpc();
    }
    // ── Read Operations ─────────────────────────────────────────────
    async getCase(caseId) {
        const [casePda] = deriveCasePda(caseId, this.programId);
        try {
            const accounts = this.program.account;
            const account = await accounts.caseFile.fetch(casePda);
            return account;
        }
        catch {
            return null;
        }
    }
    async getConfig(jurisdiction) {
        const [configPda] = deriveConfigPda(jurisdiction, this.programId);
        try {
            const accounts = this.program.account;
            return await accounts.programConfig.fetch(configPda);
        }
        catch {
            return null;
        }
    }
    async getAllCases() {
        const accounts = this.program.account;
        return await accounts.caseFile.all();
    }
    async getCasesByStatus(status) {
        const all = await this.getAllCases();
        return all.filter((c) => {
            const s = c.account.status;
            return typeof s === "object" && Object.keys(s)[0]?.toLowerCase() === status.toLowerCase();
        });
    }
}
exports.AdduceClient = AdduceClient;
// ── Re-exports ──────────────────────────────────────────────────────
var web3_js_2 = require("@solana/web3.js");
Object.defineProperty(exports, "PublicKey", { enumerable: true, get: function () { return web3_js_2.PublicKey; } });
Object.defineProperty(exports, "Keypair", { enumerable: true, get: function () { return web3_js_2.Keypair; } });
Object.defineProperty(exports, "Connection", { enumerable: true, get: function () { return web3_js_2.Connection; } });
var anchor_1 = require("@coral-xyz/anchor");
Object.defineProperty(exports, "BN", { enumerable: true, get: function () { return anchor_1.BN; } });
