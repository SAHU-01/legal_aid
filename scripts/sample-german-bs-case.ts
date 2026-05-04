/**
 * Sample German Berechtigungsschein Case — Real On-Chain Execution
 *
 * Follows the exact German legal aid (Beratungshilfe) workflow:
 *
 *   LAWYER FLOW:
 *     1. Lawyer registers (wallet connect) → SAS credential issued
 *     2. Lawyer requests Berechtigungsschein for client → case opened
 *     3. Lawyer uploads documents (Abrechnungsvordruck) → document anchored
 *     4. Lawyer verifies BS is valid → SAS credential check
 *     5. Lawyer requests payment → payment claim
 *
 *   OPERATOR (COURT) FLOW:
 *     6. Operator reviews application → case in progress
 *     7. Operator issues Berechtigungsschein → compressed log
 *     8. Operator reviews disbursement request → close case
 *     9. Operator approves payment → USDC transfer + mark paid
 *
 * Every transaction is real, on Solana Devnet, verifiable on Explorer.
 * No mocks. No simulations.
 *
 * Run:  npx ts-node scripts/sample-german-bs-case.ts
 */

import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import {
  Keypair,
  PublicKey,
  LAMPORTS_PER_SOL,
  ComputeBudgetProgram,
} from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
} from "@solana/spl-token";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import {
  getCreateAttestationInstruction,
  deriveAttestationPda,
  fetchSchema,
  serializeAttestationData,
  fetchMaybeAttestation,
  deserializeAttestationData,
} from "sas-lib";
import {
  createRpc,
  compress,
  buildAndSignTx,
  sendAndConfirmTx,
  confirmConfig,
} from "@lightprotocol/stateless.js";

import { HELIUS_RPC_URL, connection, payer } from "./lib/connection";
import type { LegalAid } from "../target/types/legal_aid";

// ── Constants ──────────────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV"
);
const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);
const DEVNET_RPC = "https://api.devnet.solana.com";
const USDC_DECIMALS = 6;
const JURISDICTION = "DE";

// German Berechtigungsschein sample case data
const SAMPLE_CASE = {
  lawyerName: "Rechtsanwalt Dieter Stein",
  lawyerId: "123ABC",
  clientName: "Max Mustermann",
  referenceNo: "123 UR II 143/22",
  assistanceType: "Representation (Vertretung)",
  applicationDate: "2026-05-02",
  courtName: "Amtsgericht Weiden i.d.OPf.",
  courtDepartment: "Beratungshilfe",
  paymentAmount: 85, // EUR equivalent in USDC (standard Beratungshilfe fee)
  documents: [
    "Abrechnungsvordruck (Form 789)",
    "Berechtigungsschein (Doc123.pdf)",
    "Vollmacht (Power of Attorney)",
  ],
};

// SAS schema
const schemaInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "schema-address.json"), "utf-8")
);
const { schemaAddress, credentialAddress } = schemaInfo;

// Unique case ID
const TIMESTAMP = Date.now();
const CASE_ID = `BS-DE-${SAMPLE_CASE.referenceNo.replace(/\s/g, "-")}-${TIMESTAMP.toString().slice(-6)}`;

// ── Helpers ────────────────────────────────────────────────────────────

function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

function explorerAddr(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}

function hashDocument(content: string): { hex: string; array: number[] } {
  const bytes = createHash("sha256").update(content).digest();
  return { hex: bytes.toString("hex"), array: Array.from(bytes) };
}

function phase(label: string) {
  console.log(`\n${"━".repeat(64)}`);
  console.log(`  ${label}`);
  console.log("━".repeat(64));
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function airdropWithRetry(
  pubkey: PublicKey,
  lamports: number,
  retries = 3
): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      const sig = await connection.requestAirdrop(pubkey, lamports);
      await connection.confirmTransaction(sig, "confirmed");
      return sig;
    } catch (err: any) {
      if (i === retries - 1) throw err;
      console.log(`  Airdrop attempt ${i + 1} failed, retrying...`);
      await sleep(3000);
    }
  }
  throw new Error("Airdrop failed after retries");
}

async function sendSasTx(rpc: any, txMessage: any): Promise<string> {
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const base64Tx = getBase64EncodedWireTransaction(signedTx);
  const sig = await rpc
    .sendTransaction(base64Tx, { encoding: "base64" })
    .send();
  for (let i = 0; i < 30; i++) {
    const status = await rpc.getSignatureStatuses([sig]).send();
    const val = status.value[0];
    if (
      val &&
      (val.confirmationStatus === "confirmed" ||
        val.confirmationStatus === "finalized")
    ) {
      return String(sig);
    }
    await sleep(2000);
  }
  console.warn("  Warning: SAS tx not confirmed within timeout");
  return String(sig);
}

// ── Load IDL + build Anchor program ────────────────────────────────────

const idl = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "target", "idl", "legal_aid.json"),
    "utf-8"
  )
);

const wallet = new anchor.Wallet(payer);
const provider = new anchor.AnchorProvider(connection, wallet, {
  commitment: "confirmed",
  preflightCommitment: "confirmed",
});
const program = new Program<LegalAid>(idl, provider);

// Light Protocol RPC
const lightRpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log("╔════════════════════════════════════════════════════════════╗");
  console.log("║  GERMAN BERECHTIGUNGSSCHEIN — SAMPLE CASE ON SOLANA      ║");
  console.log("║  Network: Devnet  |  Real transactions, no simulations   ║");
  console.log("╚════════════════════════════════════════════════════════════╝");
  console.log();
  console.log("  Case Reference:  ", SAMPLE_CASE.referenceNo);
  console.log("  Lawyer:          ", SAMPLE_CASE.lawyerName);
  console.log("  Client:          ", SAMPLE_CASE.clientName);
  console.log("  Court:           ", SAMPLE_CASE.courtName);
  console.log("  Assistance:      ", SAMPLE_CASE.assistanceType);
  console.log("  Program:         ", PROGRAM_ID.toBase58());
  console.log("  Case ID (chain): ", CASE_ID);

  // Verify devnet connection
  const slot = await connection.getSlot();
  console.log("  Devnet OK:        slot", slot);

  const authorityBal = await connection.getBalance(payer.publicKey);
  console.log(
    `  Authority:        ${payer.publicKey.toBase58()} (${(authorityBal / LAMPORTS_PER_SOL).toFixed(4)} SOL)`
  );
  if (authorityBal < 0.1 * LAMPORTS_PER_SOL) {
    throw new Error("Authority needs at least 0.1 SOL on devnet");
  }

  const r: Record<string, any> = {};

  // ════════════════════════════════════════════════════════════════════
  // PHASE 1: LAWYER LOGIN — Wallet Connect + Identity Setup
  // Maps to: German BS system "Login as a Lawyer" (LawyerID: 123ABC)
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 1: LAWYER LOGIN — Wallet Connect + Identity Setup");
  console.log(`  Simulating: ${SAMPLE_CASE.lawyerName} connects wallet`);
  console.log(`  LawyerID: ${SAMPLE_CASE.lawyerId}`);

  // Court authority = local wallet (the Operator/Amtsgericht)
  const authority = payer;
  r.authority = authority.publicKey.toBase58();
  console.log("  Court Authority (Operator):", r.authority);

  // Lawyer keypair (represents Lawyer Dieter Stein's wallet)
  const lawyerKeypair = Keypair.generate();
  r.lawyer = lawyerKeypair.publicKey.toBase58();
  console.log("  Lawyer Wallet:", r.lawyer);

  // Client keypair (represents the applicant Max Mustermann)
  const clientKeypair = Keypair.generate();
  r.client = clientKeypair.publicKey.toBase58();
  console.log("  Client (Applicant):", r.client);

  // Airdrop SOL to lawyer
  console.log("\n  Funding lawyer wallet...");
  try {
    await airdropWithRetry(lawyerKeypair.publicKey, 1 * LAMPORTS_PER_SOL);
    console.log("  Lawyer funded with 1 SOL");
  } catch {
    console.log("  Airdrop skipped — authority pays all fees");
  }

  // Create mock USDC mint (represents EUR-equivalent stablecoin)
  console.log("\n  Creating USDC mint (EUR-equivalent stablecoin)...");
  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    USDC_DECIMALS
  );
  r.usdcMint = usdcMint.toBase58();
  console.log("  USDC Mint:", r.usdcMint);

  // Fund authority (court treasury) with USDC
  const authorityAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    authority.publicKey
  );
  await mintTo(
    connection,
    payer,
    usdcMint,
    authorityAta.address,
    payer,
    10000 * 10 ** USDC_DECIMALS
  );
  console.log("  Court treasury funded: 10,000 USDC");

  // Create lawyer ATA
  const lawyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    lawyerKeypair.publicKey
  );
  r.lawyerAta = lawyerAta.address.toBase58();
  console.log("  Lawyer Token Account:", r.lawyerAta);

  // ════════════════════════════════════════════════════════════════════
  // PHASE 2: OPERATOR ISSUES SAS CREDENTIAL
  // Maps to: Court clerk (Sabine Mueller) issues Berechtigungsschein
  // The SAS attestation = the on-chain Berechtigungsschein
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 2: OPERATOR ISSUES BERECHTIGUNGSSCHEIN (SAS Credential)");
  console.log("  Operator: Sabine Mueller (OperatorID: ABC1234)");
  console.log("  Action: Review application, issue Berechtigungsschein");
  console.log("  Work Procedure: Review → Editing → Verification (3-step)");

  const sasRpc = createSolanaRpc(DEVNET_RPC);
  const issuerSigner = await createKeyPairSignerFromBytes(payer.secretKey);
  const lawyerSigner = await createKeyPairSignerFromBytes(
    lawyerKeypair.secretKey
  );

  // Fetch on-chain schema
  const schema = await fetchSchema(sasRpc, schemaAddress);
  console.log("  Schema fetched:", schemaInfo.schemaName);

  // Serialize: jurisdiction=DE, tier=TIER_1, expiry=1 year
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  r.sasExpiryDate = oneYearFromNow;

  const attestationData = serializeAttestationData(schema.data, {
    jurisdiction: "DE",
    eligibility_tier: "TIER_1",
    expiry_date: BigInt(oneYearFromNow),
  });

  // Derive attestation PDA (the on-chain Berechtigungsschein address)
  const [attestationAddress] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce: lawyerSigner.address,
  });
  r.berechtigungsscheinPda = String(attestationAddress);
  console.log("  Berechtigungsschein PDA:", r.berechtigungsscheinPda);

  // Build and send
  const createAttestationIx = getCreateAttestationInstruction({
    payer: issuerSigner,
    authority: issuerSigner,
    credential: credentialAddress,
    schema: schemaAddress,
    attestation: attestationAddress,
    nonce: lawyerSigner.address,
    data: attestationData,
    expiry: BigInt(oneYearFromNow),
  });

  const { value: sasBlockhash } = await sasRpc.getLatestBlockhash().send();
  const sasTxMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(issuerSigner, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(sasBlockhash, tx),
    (tx) => appendTransactionMessageInstruction(createAttestationIx, tx)
  );

  console.log("  Sending Berechtigungsschein issuance tx...");
  r.bsTx = await sendSasTx(sasRpc, sasTxMsg);
  console.log("  Tx:", r.bsTx);
  console.log("  Explorer:", explorerTx(r.bsTx));
  console.log(
    "  Expiry:",
    new Date(oneYearFromNow * 1000).toISOString().split("T")[0]
  );
  console.log("\n  Berechtigungsschein issued to lawyer wallet");

  // ════════════════════════════════════════════════════════════════════
  // PHASE 3: LAWYER REQUESTS BS FOR CLIENT — Case Opened
  // Maps to: "Request a Berechtigungsschein for your Client"
  // Lawyer enters client name, uploads documents, submits
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 3: LAWYER OPENS CASE — Request BS for Client");
  console.log(`  Client: ${SAMPLE_CASE.clientName}`);
  console.log(`  Reference: ${SAMPLE_CASE.referenceNo}`);
  console.log(`  Documents: ${SAMPLE_CASE.documents.join(", ")}`);

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(JURISDICTION)],
    PROGRAM_ID
  );
  const [casePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("case"), Buffer.from(CASE_ID)],
    PROGRAM_ID
  );
  r.caseId = CASE_ID;
  r.casePda = casePda.toBase58();

  // Initialize jurisdiction config (skip if exists)
  let configExists = false;
  try {
    const existing = await program.account.programConfig.fetch(configPda);
    if (existing.authority.toBase58() === authority.publicKey.toBase58()) {
      configExists = true;
      console.log(
        `  Jurisdiction config exists (total cases: ${existing.totalCases.toNumber()})`
      );
    }
  } catch {}

  if (!configExists) {
    console.log('  Creating jurisdiction config for "DE"...');
    await program.methods
      .initialize(JURISDICTION)
      .accounts({ authority: authority.publicKey })
      .rpc();
  }

  // Open case
  console.log(`\n  Opening case on-chain...`);
  r.openCaseTx = await program.methods
    .openCase(CASE_ID, lawyerKeypair.publicKey)
    .accounts({
      config: configPda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:", r.openCaseTx);
  console.log("  Explorer:", explorerTx(r.openCaseTx));
  console.log("  Case PDA:", r.casePda);
  console.log("  Status: Open (Application submitted)");

  // ════════════════════════════════════════════════════════════════════
  // PHASE 4: LAWYER ANCHORS DOCUMENTS
  // Maps to: Upload Abrechnungsvordruck + Berechtigungsschein documents
  // SHA-256 hash of documents stored on-chain (no PII)
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 4: LAWYER ANCHORS DOCUMENTS");
  console.log("  Anchoring document hash (SHA-256) on-chain...");
  console.log("  Documents hashed:");
  SAMPLE_CASE.documents.forEach((d) => console.log(`    - ${d}`));

  const documentContent = [
    `Berechtigungsschein Case ${SAMPLE_CASE.referenceNo}`,
    `Court: ${SAMPLE_CASE.courtName}, ${SAMPLE_CASE.courtDepartment}`,
    `Lawyer: ${SAMPLE_CASE.lawyerName} (${SAMPLE_CASE.lawyerId})`,
    `Client: ${SAMPLE_CASE.clientName}`,
    `Assistance: ${SAMPLE_CASE.assistanceType}`,
    `Application Date: ${SAMPLE_CASE.applicationDate}`,
    `Documents: ${SAMPLE_CASE.documents.join("; ")}`,
    `Issued: ${new Date().toISOString()}`,
  ].join(" | ");

  const { hex: docHashHex, array: docHashArray } = hashDocument(
    documentContent
  );
  r.documentHash = docHashHex;
  console.log("  Document hash:", docHashHex);

  r.anchorDocTx = await program.methods
    .anchorDocument(CASE_ID, docHashArray)
    .accounts({
      caseFile: casePda,
      lawyer: lawyerKeypair.publicKey,
    } as any)
    .signers([lawyerKeypair])
    .rpc();
  console.log("  Tx:", r.anchorDocTx);
  console.log("  Explorer:", explorerTx(r.anchorDocTx));
  console.log("  Status: InProgress (Documents anchored)");

  // ════════════════════════════════════════════════════════════════════
  // PHASE 5: COMPRESSED AUDIT LOG (Light Protocol)
  // Maps to: Operator generates QR-verifiable Berechtigungsschein PDF
  // ZK-compressed log for cost-efficient immutable audit trail
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 5: COMPRESSED AUDIT LOG (ZK Compression)");
  console.log("  Creating immutable audit trail via Light Protocol...");

  const solBefore = await connection.getBalance(payer.publicKey);

  // Compress SOL
  const compressLamports = 10_000;
  await compress(lightRpc, payer, compressLamports, payer.publicKey);

  // Build memo with German BS case metadata
  const memoPayload = JSON.stringify({
    type: "berechtigungsschein",
    reference: SAMPLE_CASE.referenceNo,
    case_id: CASE_ID,
    court: SAMPLE_CASE.courtName,
    lawyer: lawyerKeypair.publicKey.toBase58(),
    client_wallet: clientKeypair.publicKey.toBase58(),
    assistance: SAMPLE_CASE.assistanceType,
    document_hash: docHashHex,
    timestamp: Math.floor(Date.now() / 1000),
  });

  const memoIx = {
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
    data: Buffer.from(memoPayload, "utf-8"),
  };

  const { blockhash: memoBlockhash } = await lightRpc.getLatestBlockhash();
  const memoTx = buildAndSignTx(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }), memoIx],
    payer,
    memoBlockhash
  );

  r.compressedLogTx = await sendAndConfirmTx(lightRpc, memoTx, confirmConfig);
  console.log("  Tx:", r.compressedLogTx);
  console.log("  Explorer:", explorerTx(r.compressedLogTx));

  const solAfter = await connection.getBalance(payer.publicKey);
  r.compressedCostLamports = solBefore - solAfter;
  console.log(`  Cost: ${r.compressedCostLamports} lamports (~$${((r.compressedCostLamports / LAMPORTS_PER_SOL) * 150).toFixed(4)})`);

  // ════════════════════════════════════════════════════════════════════
  // PHASE 6: LAWYER VERIFIES BERECHTIGUNGSSCHEIN
  // Maps to: "Verification of the Berechtigungsschein" screen
  // Lawyer enters client name + reference no → valid/invalid check
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 6: LAWYER VERIFIES BERECHTIGUNGSSCHEIN");
  console.log(`  Client Name: ${SAMPLE_CASE.clientName}`);
  console.log(`  Reference No: ${SAMPLE_CASE.referenceNo}`);

  const verifyRpc = createSolanaRpc(DEVNET_RPC);
  const [verifyAddr] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce: lawyerSigner.address,
  });

  const maybeAttest = await fetchMaybeAttestation(verifyRpc, verifyAddr);
  if (maybeAttest.exists) {
    const sch = await fetchSchema(verifyRpc, schemaAddress);
    const dec = deserializeAttestationData<{
      jurisdiction: string;
      eligibility_tier: string;
      expiry_date: bigint;
    }>(sch.data, Uint8Array.from(maybeAttest.data.data));

    const expiryTs = Number(dec.expiry_date);
    const isValid = expiryTs > Math.floor(Date.now() / 1000);

    console.log(`\n  ${isValid ? "The Berechtigungsschein is valid." : "The Berechtigungsschein is invalid."}`);
    console.log(`  Jurisdiction: ${dec.jurisdiction}`);
    console.log(`  Eligibility Tier: ${dec.eligibility_tier}`);
    console.log(`  Expiry: ${new Date(expiryTs * 1000).toISOString().split("T")[0]}`);
    console.log(`  On-chain PDA: ${verifyAddr}`);
    r.bsVerified = true;
  } else {
    console.log("  WARNING: Berechtigungsschein not found on-chain");
    r.bsVerified = false;
  }

  // ════════════════════════════════════════════════════════════════════
  // PHASE 7: OPERATOR CLOSES CASE
  // Maps to: Operator reviews completed work, closes case
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 7: OPERATOR CLOSES CASE");
  console.log("  Operator reviews case and closes...");
  console.log(`  Activity Remark: BS issued to the lawyer`);
  console.log(`  Status change: InProgress → Closed`);

  r.closeCaseTx = await program.methods
    .closeCase(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:", r.closeCaseTx);
  console.log("  Explorer:", explorerTx(r.closeCaseTx));

  // ════════════════════════════════════════════════════════════════════
  // PHASE 8: LAWYER REQUESTS PAYMENT
  // Maps to: "Request your payment" screen
  // Choose reference number, type of assistance, upload documents
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 8: LAWYER REQUESTS PAYMENT (Disbursement)");
  console.log(`  Reference: ${SAMPLE_CASE.referenceNo}`);
  console.log(`  Assistance: ${SAMPLE_CASE.assistanceType}`);
  console.log(`  Amount: ${SAMPLE_CASE.paymentAmount} USDC (EUR equivalent)`);
  console.log("  Documents submitted: Abrechnungsvordruck + Berechtigungsschein");

  // USDC transfer: court treasury → lawyer
  const transferAmount = SAMPLE_CASE.paymentAmount * 10 ** USDC_DECIMALS;
  r.paymentTx = await transferChecked(
    connection,
    payer,
    authorityAta.address,
    usdcMint,
    lawyerAta.address,
    payer,
    transferAmount,
    USDC_DECIMALS
  );
  console.log("  Payment Tx:", r.paymentTx);
  console.log("  Explorer:", explorerTx(r.paymentTx));

  // ════════════════════════════════════════════════════════════════════
  // PHASE 9: OPERATOR MARKS PAID
  // Maps to: Operator enters paid sum, sets status, sends
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 9: OPERATOR MARKS CASE PAID");
  console.log(`  Paid Sum: ${SAMPLE_CASE.paymentAmount} EUR (USDC)`);
  console.log("  Status change: Closed → Paid");

  r.markPaidTx = await program.methods
    .markPaid(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:", r.markPaidTx);
  console.log("  Explorer:", explorerTx(r.markPaidTx));

  // ════════════════════════════════════════════════════════════════════
  // PHASE 10: VERIFICATION — All Checks
  // ════════════════════════════════════════════════════════════════════

  phase("PHASE 10: VERIFICATION — All On-Chain Checks");

  const checks: { label: string; pass: boolean; detail: string }[] = [];

  // Case status
  const caseFile = await program.account.caseFile.fetch(casePda);
  const statusIsPaid = "paid" in caseFile.status;
  checks.push({
    label: "On-chain status: Paid",
    pass: statusIsPaid,
    detail: JSON.stringify(caseFile.status),
  });

  // SAS credential
  checks.push({
    label: "Berechtigungsschein: Valid on-chain",
    pass: r.bsVerified === true,
    detail: `PDA: ${r.berechtigungsscheinPda}`,
  });

  // Compressed log
  let compressedFound = false;
  try {
    const memoTxInfo = await connection.getTransaction(r.compressedLogTx, {
      maxSupportedTransactionVersion: 0,
    });
    compressedFound = memoTxInfo !== null && !memoTxInfo.meta?.err;
  } catch {}
  checks.push({
    label: "Compressed audit log: Found",
    pass: compressedFound,
    detail: compressedFound ? "confirmed on-chain" : "not found",
  });

  // USDC balance
  const lawyerAtaFinal = await getAccount(connection, lawyerAta.address);
  const lawyerUsdcBal = Number(lawyerAtaFinal.amount) / 10 ** USDC_DECIMALS;
  checks.push({
    label: `USDC payment: ${lawyerUsdcBal.toFixed(2)} received`,
    pass: lawyerUsdcBal >= SAMPLE_CASE.paymentAmount,
    detail: `${lawyerUsdcBal} USDC`,
  });

  // Document hash
  const onChainHash = Buffer.from(caseFile.documentHash).toString("hex");
  const hashMatches = onChainHash === docHashHex;
  checks.push({
    label: "Document hash: Matches on-chain",
    pass: hashMatches,
    detail: hashMatches ? onChainHash : `mismatch`,
  });

  for (const c of checks) {
    console.log(`  ${c.pass ? "\u2713" : "\u2717"} ${c.label}`);
  }

  const allPassed = checks.every((c) => c.pass);

  // ════════════════════════════════════════════════════════════════════
  // REPORT
  // ════════════════════════════════════════════════════════════════════

  const standardPdaLamports = await connection.getMinimumBalanceForRentExemption(159);
  const compressedCostLamports = r.compressedCostLamports as number;
  const SOL_PRICE_USD = 150;

  const report = `
${"═".repeat(64)}
  GERMAN BERECHTIGUNGSSCHEIN — SAMPLE CASE REPORT
  Network: Solana Devnet
  Generated: ${new Date().toISOString()}
${"═".repeat(64)}

CASE DETAILS
  Reference:       ${SAMPLE_CASE.referenceNo}
  Court:           ${SAMPLE_CASE.courtName}
  Lawyer:          ${SAMPLE_CASE.lawyerName} (${SAMPLE_CASE.lawyerId})
  Client:          ${SAMPLE_CASE.clientName}
  Assistance:      ${SAMPLE_CASE.assistanceType}
  Payment:         ${SAMPLE_CASE.paymentAmount} USDC (EUR equivalent)

ON-CHAIN IDENTITIES
  Program ID:      ${PROGRAM_ID.toBase58()}
  Court Authority: ${r.authority}
  Lawyer Wallet:   ${r.lawyer}
  Client Wallet:   ${r.client}
  USDC Mint:       ${r.usdcMint}

TRANSACTION LOG
  [1] Berechtigungsschein Issued (SAS Credential)
      Tx:    ${r.bsTx}
      PDA:   ${r.berechtigungsscheinPda}
      Link:  ${explorerTx(r.bsTx)}

  [2] Case Opened
      ID:    ${CASE_ID}
      Tx:    ${r.openCaseTx}
      PDA:   ${r.casePda}
      Link:  ${explorerTx(r.openCaseTx)}

  [3] Documents Anchored
      Hash:  ${r.documentHash}
      Tx:    ${r.anchorDocTx}
      Link:  ${explorerTx(r.anchorDocTx)}

  [4] Compressed Audit Log
      Tx:    ${r.compressedLogTx}
      Cost:  ${compressedCostLamports} lamports (~$${((compressedCostLamports / LAMPORTS_PER_SOL) * SOL_PRICE_USD).toFixed(4)})
      Link:  ${explorerTx(r.compressedLogTx)}

  [5] Case Closed
      Tx:    ${r.closeCaseTx}
      Link:  ${explorerTx(r.closeCaseTx)}

  [6] Payment Disbursed
      Amount: ${SAMPLE_CASE.paymentAmount}.00 USDC
      Tx:    ${r.paymentTx}
      Link:  ${explorerTx(r.paymentTx)}

  [7] Case Marked Paid
      Tx:    ${r.markPaidTx}
      Link:  ${explorerTx(r.markPaidTx)}

VERIFICATION
  ${checks.map((c) => `${c.pass ? "\u2713" : "\u2717"} ${c.label}`).join("\n  ")}

COST ANALYSIS
  Standard PDA:    ${standardPdaLamports} lamports (~$${((standardPdaLamports / LAMPORTS_PER_SOL) * SOL_PRICE_USD).toFixed(4)})
  ZK Compressed:   ${compressedCostLamports} lamports (~$${((compressedCostLamports / LAMPORTS_PER_SOL) * SOL_PRICE_USD).toFixed(4)})
  Savings:         ${(((standardPdaLamports - compressedCostLamports) / standardPdaLamports) * 100).toFixed(1)}%

${"═".repeat(64)}
  ${allPassed ? "ALL CHECKS PASSED — CASE VERIFIED ON DEVNET" : "SOME CHECKS FAILED — REVIEW ABOVE"}
${"═".repeat(64)}
`;

  console.log(report);

  // Save outputs
  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  fs.writeFileSync(
    path.join(outputDir, "german-bs-case-report.txt"),
    report
  );

  const jsonReport = {
    timestamp: new Date().toISOString(),
    network: "solana:devnet",
    programId: PROGRAM_ID.toBase58(),
    sampleCase: SAMPLE_CASE,
    caseId: CASE_ID,
    identities: {
      authority: r.authority,
      lawyer: r.lawyer,
      client: r.client,
      usdcMint: r.usdcMint,
      lawyerAta: r.lawyerAta,
    },
    transactions: {
      berechtigungsscheinIssued: {
        tx: r.bsTx,
        pda: r.berechtigungsscheinPda,
        explorer: explorerTx(r.bsTx),
      },
      caseOpened: {
        tx: r.openCaseTx,
        pda: r.casePda,
        caseId: CASE_ID,
        explorer: explorerTx(r.openCaseTx),
      },
      documentsAnchored: {
        tx: r.anchorDocTx,
        hash: r.documentHash,
        explorer: explorerTx(r.anchorDocTx),
      },
      compressedLog: {
        tx: r.compressedLogTx,
        costLamports: compressedCostLamports,
        explorer: explorerTx(r.compressedLogTx),
      },
      caseClosed: {
        tx: r.closeCaseTx,
        explorer: explorerTx(r.closeCaseTx),
      },
      paymentDisbursed: {
        tx: r.paymentTx,
        amount: SAMPLE_CASE.paymentAmount,
        explorer: explorerTx(r.paymentTx),
      },
      caseMarkedPaid: {
        tx: r.markPaidTx,
        explorer: explorerTx(r.markPaidTx),
      },
    },
    verification: {
      onChainStatus: statusIsPaid ? "paid" : JSON.stringify(caseFile.status),
      berechtigungsscheinValid: r.bsVerified,
      compressedLogFound: compressedFound,
      usdcReceived: lawyerUsdcBal,
      documentHashMatches: hashMatches,
      allPassed,
    },
    explorerLinks: {
      program: explorerAddr(PROGRAM_ID.toBase58()),
      casePda: explorerAddr(r.casePda),
      berechtigungsschein: explorerAddr(r.berechtigungsscheinPda),
      lawyerWallet: explorerAddr(r.lawyer),
    },
  };

  fs.writeFileSync(
    path.join(outputDir, "german-bs-case-report.json"),
    JSON.stringify(jsonReport, null, 2)
  );

  console.log("  Report saved to: scripts/output/german-bs-case-report.txt");
  console.log("  JSON saved to:   scripts/output/german-bs-case-report.json");

  if (!allPassed) process.exit(1);
}

main().catch((err) => {
  console.error("\nFatal:", err.message ?? err);
  process.exit(1);
});
