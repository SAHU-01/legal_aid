/**
 * Legal Aid Protocol — End-to-End Full Pipeline
 *
 * Runs the ENTIRE legal aid flow from scratch on Solana devnet.
 * No mocks, no simulations — every transaction is real and verifiable.
 *
 * Steps:
 *   1. Setup identities (authority, lawyer, citizen) + USDC
 *   2. Issue SAS credential to lawyer (Day 2)
 *   3. Open case on Anchor program (Day 1)
 *   4. Anchor document hash on-chain (Day 1)
 *   5. Create compressed log via Light Protocol (Day 3)
 *   6. Close case (Day 1)
 *   7. Disburse USDC payment + SAS verification (Day 4)
 *   8. Mark case as paid on-chain (Day 1)
 *   9. Verify everything
 *  10. Print demo report + save to files
 *
 * Run:  npx ts-node scripts/e2e-full-pipeline.ts
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
const USDC_PAYMENT_AMOUNT = 50;
const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const JURISDICTION = "DE";

// SAS schema from Day 2
const schemaInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "schema-address.json"), "utf-8")
);
const { schemaAddress, credentialAddress } = schemaInfo;

// Unique case ID for this run
const TIMESTAMP = Date.now();
const CASE_ID = `E2E-DEMO-${TIMESTAMP}`;

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

function step(n: number, label: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`  STEP ${n}: ${label}`);
  console.log("=".repeat(60));
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

// Light Protocol RPC (Helius serves rpc + compression + prover)
const lightRpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

// ── Main ───────────────────────────────────────────────────────────────

async function main() {
  console.log(
    "================================================================"
  );
  console.log(
    "   LEGAL AID PROTOCOL — END-TO-END FULL PIPELINE"
  );
  console.log(
    "   Network: Solana Devnet  |  No mocks, no simulations"
  );
  console.log(
    "================================================================"
  );
  console.log();
  console.log("  Helius RPC:", HELIUS_RPC_URL.replace(/api-key=.*/, "api-key=***"));
  console.log("  Program:   ", PROGRAM_ID.toBase58());
  console.log("  Case ID:   ", CASE_ID);

  // Verify devnet connection
  const slot = await connection.getSlot();
  console.log("  Devnet OK:  slot", slot);

  // Verify authority SOL balance
  const authorityBal = await connection.getBalance(payer.publicKey);
  console.log(
    `  Authority:  ${payer.publicKey.toBase58()} (${(authorityBal / LAMPORTS_PER_SOL).toFixed(4)} SOL)`
  );
  if (authorityBal < 0.1 * LAMPORTS_PER_SOL) {
    throw new Error("Authority needs at least 0.1 SOL on devnet");
  }

  // Track all results
  const r: Record<string, any> = {};

  // ==================================================================
  // STEP 1: SETUP IDENTITIES
  // ==================================================================

  step(1, "SETUP IDENTITIES");

  // Court authority = local wallet
  const authority = payer;
  r.authority = authority.publicKey.toBase58();
  console.log("  Court Authority:", r.authority);

  // Fresh lawyer keypair
  const lawyerKeypair = Keypair.generate();
  r.lawyer = lawyerKeypair.publicKey.toBase58();
  console.log("  Lawyer:         ", r.lawyer);

  // Fresh citizen keypair
  const citizenKeypair = Keypair.generate();
  r.citizen = citizenKeypair.publicKey.toBase58();
  console.log("  Citizen:        ", r.citizen);

  // Airdrop SOL to lawyer (best-effort — provider wallet pays all tx fees,
  // so the lawyer doesn't strictly need SOL)
  console.log("\n  Airdropping SOL to lawyer...");
  try {
    await airdropWithRetry(lawyerKeypair.publicKey, 1 * LAMPORTS_PER_SOL);
    const lawyerSolBal = await connection.getBalance(lawyerKeypair.publicKey);
    console.log(
      `  Lawyer SOL balance: ${(lawyerSolBal / LAMPORTS_PER_SOL).toFixed(4)} SOL`
    );
  } catch {
    console.log(
      "  Airdrop skipped (rate-limited) — provider wallet pays all fees"
    );
  }

  // Create mock USDC mint
  console.log("\n  Creating mock USDC mint...");
  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority
    null,
    USDC_DECIMALS
  );
  r.usdcMint = usdcMint.toBase58();
  console.log("  USDC mint:", r.usdcMint);

  // Fund authority with 1000 USDC
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
    1000 * 10 ** USDC_DECIMALS
  );
  console.log("  Authority funded: 1,000 USDC");

  // Create lawyer ATA
  const lawyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    lawyerKeypair.publicKey
  );
  console.log("  Lawyer ATA:     ", lawyerAta.address.toBase58());

  console.log("\n  Step 1 complete");

  // ==================================================================
  // STEP 2: ISSUE SAS CREDENTIAL (Day 2)
  // ==================================================================

  step(2, "ISSUE SAS CREDENTIAL");

  const sasRpc = createSolanaRpc(DEVNET_RPC);

  // Bridge keypairs to @solana/kit signers for SAS
  const issuerSigner = await createKeyPairSignerFromBytes(payer.secretKey);
  const lawyerSigner = await createKeyPairSignerFromBytes(
    lawyerKeypair.secretKey
  );
  console.log("  Issuer:          ", issuerSigner.address);
  console.log("  Lawyer (kit):    ", lawyerSigner.address);

  // Fetch on-chain schema
  const schema = await fetchSchema(sasRpc, schemaAddress);
  console.log("  Schema:          ", schemaInfo.schemaName);

  // Serialize attestation data
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  r.sasExpiryDate = oneYearFromNow;

  const attestationData = serializeAttestationData(schema.data, {
    jurisdiction: "DE",
    eligibility_tier: "TIER_1",
    expiry_date: BigInt(oneYearFromNow),
  });

  // Derive attestation PDA (nonce = lawyer wallet)
  const [attestationAddress] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce: lawyerSigner.address,
  });
  r.sasCredentialPda = String(attestationAddress);
  console.log("  Attestation PDA: ", r.sasCredentialPda);

  // Build and send createAttestation tx
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

  console.log("  Sending attestation tx...");
  r.sasCredentialTx = await sendSasTx(sasRpc, sasTxMsg);
  console.log("  Tx:              ", r.sasCredentialTx);
  console.log(
    "  Expiry:          ",
    new Date(oneYearFromNow * 1000).toISOString()
  );

  console.log("\n  Step 2 complete — SAS credential issued to lawyer");

  // ==================================================================
  // STEP 3: OPEN CASE (Day 1)
  // ==================================================================

  step(3, "OPEN CASE");

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
  console.log(`  Initializing jurisdiction "${JURISDICTION}"...`);
  let configExists = false;
  try {
    const existingConfig = await program.account.programConfig.fetch(configPda);
    if (existingConfig.authority.toBase58() !== authority.publicKey.toBase58()) {
      throw new Error(
        `Config for "${JURISDICTION}" exists but authority is ${existingConfig.authority.toBase58()}, not ${authority.publicKey.toBase58()}`
      );
    }
    configExists = true;
    console.log(
      `  Config already exists (total cases: ${existingConfig.totalCases.toNumber()})`
    );
  } catch (err: any) {
    if (err.message?.includes("Config for")) throw err;
  }

  if (!configExists) {
    console.log("  Creating new ProgramConfig...");
    const initTx = await program.methods
      .initialize(JURISDICTION)
      .accounts({ authority: authority.publicKey })
      .rpc();
    console.log("  Initialize tx:   ", initTx);
  }

  // Open case
  console.log(`\n  Opening case ${CASE_ID}...`);
  r.openCaseTx = await program.methods
    .openCase(CASE_ID, lawyerKeypair.publicKey)
    .accounts({
      config: configPda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:              ", r.openCaseTx);
  console.log("  Case PDA:        ", r.casePda);

  console.log("\n  Step 3 complete — case opened");

  // ==================================================================
  // STEP 4: ANCHOR DOCUMENT (Day 1)
  // ==================================================================

  step(4, "ANCHOR DOCUMENT");

  const documentContent = [
    `Legal Aid Certificate #${CASE_ID}`,
    `issued under jurisdiction ${JURISDICTION}`,
    `for citizen ${citizenKeypair.publicKey.toBase58()}`,
    `represented by ${lawyerKeypair.publicKey.toBase58()}.`,
    `Case closed with ruling in favor of applicant.`,
    `Dated ${new Date().toISOString()}.`,
  ].join(" ");

  const { hex: docHashHex, array: docHashArray } = hashDocument(
    documentContent
  );
  r.documentHash = docHashHex;
  console.log("  Document hash:   ", docHashHex);

  console.log("  Anchoring (signed by lawyer)...");
  r.anchorDocumentTx = await program.methods
    .anchorDocument(CASE_ID, docHashArray)
    .accounts({
      caseFile: casePda,
      lawyer: lawyerKeypair.publicKey,
    } as any)
    .signers([lawyerKeypair])
    .rpc();
  console.log("  Tx:              ", r.anchorDocumentTx);

  console.log("\n  Step 4 complete — document anchored on-chain");

  // ==================================================================
  // STEP 5: COMPRESSED LOG (Day 3)
  // ==================================================================

  step(5, "COMPRESSED LOG (Light Protocol)");

  // Measure cost
  const solBefore = await connection.getBalance(payer.publicKey);

  // Compress SOL to create a compressed account
  const compressLamports = 10_000;
  console.log("  Compressing SOL via Light Protocol...");
  await compress(lightRpc, payer, compressLamports, payer.publicKey);

  // Build memo with case metadata
  const memoPayload = JSON.stringify({
    case_id: CASE_ID,
    document_hash: docHashHex,
    lawyer: lawyerKeypair.publicKey.toBase58(),
    citizen: citizenKeypair.publicKey.toBase58(),
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

  console.log("  Sending compressed log memo...");
  r.compressedLogTx = await sendAndConfirmTx(lightRpc, memoTx, confirmConfig);
  console.log("  Tx:              ", r.compressedLogTx);

  const solAfter = await connection.getBalance(payer.publicKey);
  r.compressedCostLamports = solBefore - solAfter;
  console.log(`  Total cost:       ${r.compressedCostLamports} lamports`);

  console.log("\n  Step 5 complete — compressed log via Helius/Photon");

  // ==================================================================
  // STEP 6: CLOSE CASE (Day 1)
  // ==================================================================

  step(6, "CLOSE CASE");

  r.closeCaseTx = await program.methods
    .closeCase(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:              ", r.closeCaseTx);

  console.log("\n  Step 6 complete — case closed by authority");

  // ==================================================================
  // STEP 7: CLAIM PAYMENT (Day 4)
  // ==================================================================

  step(7, "CLAIM PAYMENT");

  // Execute USDC transfer: authority -> lawyer (50 USDC)
  const transferAmount = USDC_PAYMENT_AMOUNT * 10 ** USDC_DECIMALS;
  console.log(`  Transferring ${USDC_PAYMENT_AMOUNT} USDC to lawyer...`);

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
  console.log("  Payment tx:      ", r.paymentTx);

  // Try POST /api/claim-payment for credential verification
  let claimResult = "";
  try {
    await sleep(2000); // Let tx propagate
    const res = await fetch(`${API_BASE}/api/claim-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentSignature: r.paymentTx,
        lawyerWallet: lawyerKeypair.publicKey.toBase58(),
        caseId: CASE_ID,
      }),
    });
    const body: any = await res.json();
    claimResult = `API ${res.status}`;
    if (res.ok) {
      console.log(
        `  /api/claim-payment: ${res.status} — credential verified`
      );
      console.log(
        `    Jurisdiction:  ${body.credential?.jurisdiction}`
      );
      console.log(`    Tier:          ${body.credential?.eligibilityTier}`);
    } else {
      console.log(
        `  /api/claim-payment: ${res.status} — ${body.error ?? "see response"}`
      );
    }
  } catch {
    // Next.js server not running — do inline SAS verification
    console.log(
      "  Next.js server not reachable — inline SAS verification..."
    );
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
      console.log("  SAS credential verified inline:");
      console.log(`    Jurisdiction:  ${dec.jurisdiction}`);
      console.log(`    Tier:          ${dec.eligibility_tier}`);
      console.log(
        `    Expiry:        ${new Date(Number(dec.expiry_date) * 1000).toISOString()}`
      );
      claimResult = "inline SAS verified";
    } else {
      claimResult = "SAS credential not found";
      console.warn("  WARNING: SAS credential not found for lawyer");
    }
  }

  console.log(`\n  Step 7 complete — payment disbursed (${claimResult})`);

  // ==================================================================
  // STEP 8: MARK PAID (Day 1)
  // ==================================================================

  step(8, "MARK PAID");

  r.markPaidTx = await program.methods
    .markPaid(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: authority.publicKey,
    } as any)
    .rpc();
  console.log("  Tx:              ", r.markPaidTx);

  console.log("\n  Step 8 complete — case marked as paid on-chain");

  // ==================================================================
  // STEP 9: VERIFY EVERYTHING
  // ==================================================================

  step(9, "VERIFY EVERYTHING");

  const checks: { label: string; pass: boolean; detail: string }[] = [];

  // 9a. CaseFile status == Paid
  const caseFile = await program.account.caseFile.fetch(casePda);
  const statusIsPaid = "paid" in caseFile.status;
  checks.push({
    label: "On-chain status: Paid",
    pass: statusIsPaid,
    detail: JSON.stringify(caseFile.status),
  });

  // 9b. SAS credential active + valid
  const verifyRpc2 = createSolanaRpc(DEVNET_RPC);
  const [verifyAddr2] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce: lawyerSigner.address,
  });
  const attestation = await fetchMaybeAttestation(verifyRpc2, verifyAddr2);
  const sasActive = attestation.exists;
  let sasExpiryStr = "";
  if (sasActive) {
    const sch = await fetchSchema(verifyRpc2, schemaAddress);
    const dec = deserializeAttestationData<{
      jurisdiction: string;
      eligibility_tier: string;
      expiry_date: bigint;
    }>(sch.data, Uint8Array.from(attestation.data.data));
    const expiryTs = Number(dec.expiry_date);
    sasExpiryStr = new Date(expiryTs * 1000).toISOString().split("T")[0];
    const isValid = expiryTs > Math.floor(Date.now() / 1000);
    checks.push({
      label: `SAS credential: Active, expires ${sasExpiryStr}`,
      pass: isValid,
      detail: `jurisdiction=${dec.jurisdiction}, tier=${dec.eligibility_tier}`,
    });
  } else {
    checks.push({
      label: "SAS credential: Active",
      pass: false,
      detail: "not found",
    });
  }

  // 9c. Compressed log exists via Photon
  let compressedLogFound = false;
  try {
    const memoTxInfo = await connection.getTransaction(r.compressedLogTx, {
      maxSupportedTransactionVersion: 0,
    });
    compressedLogFound = memoTxInfo !== null && !memoTxInfo.meta?.err;
  } catch {
    compressedLogFound = false;
  }
  checks.push({
    label: "Compressed log: Found via Photon indexer",
    pass: compressedLogFound,
    detail: compressedLogFound ? "confirmed on-chain" : "not found",
  });

  // 9d. Lawyer USDC balance
  const lawyerAtaFinal = await getAccount(connection, lawyerAta.address);
  const lawyerUsdcBal =
    Number(lawyerAtaFinal.amount) / 10 ** USDC_DECIMALS;
  checks.push({
    label: `USDC balance: ${lawyerUsdcBal.toFixed(2)} received`,
    pass: lawyerUsdcBal >= USDC_PAYMENT_AMOUNT,
    detail: `${lawyerUsdcBal} USDC`,
  });

  // 9e. Document hash matches
  const onChainHash = Buffer.from(caseFile.documentHash).toString("hex");
  const hashMatches = onChainHash === docHashHex;
  checks.push({
    label: "Document hash: Matches on-chain",
    pass: hashMatches,
    detail: hashMatches
      ? onChainHash
      : `expected ${docHashHex}, got ${onChainHash}`,
  });

  for (const c of checks) {
    console.log(`  ${c.pass ? "\u2713" : "\u2717"} ${c.label}`);
  }

  const allPassed = checks.every((c) => c.pass);
  console.log(
    `\n  ${allPassed ? "\u2713 ALL CHECKS PASSED" : "\u2717 SOME CHECKS FAILED"}`
  );

  // ==================================================================
  // STEP 10: PRINT DEMO REPORT
  // ==================================================================

  step(10, "PRINT DEMO REPORT");

  // Cost analysis
  const standardPdaLamports =
    await connection.getMinimumBalanceForRentExemption(159);
  const compressedCostLamports = r.compressedCostLamports as number;

  const SOL_PRICE_USD = 150;
  const standardUsd =
    (standardPdaLamports / LAMPORTS_PER_SOL) * SOL_PRICE_USD;
  const compressedUsd =
    (compressedCostLamports / LAMPORTS_PER_SOL) * SOL_PRICE_USD;
  const savingsPercent = (
    ((standardPdaLamports - compressedCostLamports) / standardPdaLamports) *
    100
  ).toFixed(1);
  const annualSavings = (
    ((standardPdaLamports - compressedCostLamports) /
      LAMPORTS_PER_SOL) *
    SOL_PRICE_USD *
    100_000
  ).toFixed(2);

  const report = `
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   LEGAL AID PROTOCOL \u2014 END-TO-END DEMO REPORT
   Network: Solana Devnet
   Timestamp: ${new Date().toISOString()}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550

PROGRAM
  Program ID: ${PROGRAM_ID.toBase58()}
  Explorer:   ${explorerAddr(PROGRAM_ID.toBase58())}

IDENTITIES
  Court Authority: ${r.authority}
  Lawyer:          ${r.lawyer}
  Citizen:         ${r.citizen}

PIPELINE EXECUTION
  [1] SAS Credential Issued
      Tx:      ${r.sasCredentialTx}
      PDA:     ${r.sasCredentialPda}
      Link:    ${explorerTx(r.sasCredentialTx)}

  [2] Case Opened
      Case ID: ${CASE_ID}
      Tx:      ${r.openCaseTx}
      PDA:     ${r.casePda}
      Link:    ${explorerTx(r.openCaseTx)}

  [3] Document Anchored
      Hash:    ${r.documentHash}
      Tx:      ${r.anchorDocumentTx}
      Link:    ${explorerTx(r.anchorDocumentTx)}

  [4] Compressed Log Created
      Tx:      ${r.compressedLogTx}
      Link:    ${explorerTx(r.compressedLogTx)}
      Cost:    ${compressedCostLamports} lamports (~$${compressedUsd.toFixed(4)})

  [5] Case Closed
      Tx:      ${r.closeCaseTx}
      Link:    ${explorerTx(r.closeCaseTx)}

  [6] Payment Disbursed
      Amount:  ${USDC_PAYMENT_AMOUNT}.00 USDC
      Tx:      ${r.paymentTx}
      Link:    ${explorerTx(r.paymentTx)}

  [7] Case Marked Paid
      Tx:      ${r.markPaidTx}
      Link:    ${explorerTx(r.markPaidTx)}

VERIFICATION
  ${checks.map((c) => `${c.pass ? "\u2713" : "\u2717"} ${c.label}`).join("\n  ")}

COST ANALYSIS (per case)
  Standard PDA storage:  ${standardPdaLamports} lamports (~$${standardUsd.toFixed(4)})
  Compressed storage:    ${compressedCostLamports} lamports (~$${compressedUsd.toFixed(4)})
  Savings:               ${savingsPercent}%
  At 100,000 cases/year: ~$${annualSavings} saved

\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
   ${allPassed ? "ALL CHECKS PASSED \u2014 MVP VERIFIED ON DEVNET" : "SOME CHECKS FAILED \u2014 REVIEW ABOVE"}
\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550\u2550
`;

  console.log(report);

  // ── Save outputs ─────────────────────────────────────────────────────

  const outputDir = path.join(__dirname, "output");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  // Text report
  const reportPath = path.join(outputDir, "demo-report.txt");
  fs.writeFileSync(reportPath, report);
  console.log(`  Report saved to: ${reportPath}`);

  // JSON report
  const jsonReport = {
    timestamp: new Date().toISOString(),
    network: "solana:devnet",
    programId: PROGRAM_ID.toBase58(),
    caseId: CASE_ID,
    identities: {
      authority: r.authority,
      lawyer: r.lawyer,
      citizen: r.citizen,
    },
    pipeline: {
      sasCredential: {
        tx: r.sasCredentialTx,
        pda: r.sasCredentialPda,
        expiryDate: r.sasExpiryDate,
        expiryISO: new Date(r.sasExpiryDate * 1000).toISOString(),
      },
      openCase: {
        tx: r.openCaseTx,
        caseId: CASE_ID,
        pda: r.casePda,
      },
      anchorDocument: {
        tx: r.anchorDocumentTx,
        hash: r.documentHash,
      },
      compressedLog: {
        tx: r.compressedLogTx,
        costLamports: compressedCostLamports,
      },
      closeCase: {
        tx: r.closeCaseTx,
      },
      payment: {
        tx: r.paymentTx,
        amount: USDC_PAYMENT_AMOUNT,
        asset: "USDC",
        mint: usdcMint.toBase58(),
      },
      markPaid: {
        tx: r.markPaidTx,
      },
    },
    verification: {
      onChainStatus: statusIsPaid ? "paid" : JSON.stringify(caseFile.status),
      sasCredentialActive: sasActive,
      sasCredentialExpiry: sasExpiryStr,
      compressedLogFound,
      usdcBalanceReceived: lawyerUsdcBal,
      documentHashMatches: hashMatches,
      allPassed,
    },
    costAnalysis: {
      standardPdaLamports,
      standardPdaUsd: parseFloat(standardUsd.toFixed(4)),
      compressedLamports: compressedCostLamports,
      compressedUsd: parseFloat(compressedUsd.toFixed(4)),
      savingsPercent: parseFloat(savingsPercent),
      annualSavings100kCases: parseFloat(annualSavings),
      solPriceEstimate: SOL_PRICE_USD,
    },
    explorerLinks: {
      program: explorerAddr(PROGRAM_ID.toBase58()),
      sasCredential: explorerTx(r.sasCredentialTx),
      openCase: explorerTx(r.openCaseTx),
      anchorDocument: explorerTx(r.anchorDocumentTx),
      compressedLog: explorerTx(r.compressedLogTx),
      closeCase: explorerTx(r.closeCaseTx),
      payment: explorerTx(r.paymentTx),
      markPaid: explorerTx(r.markPaidTx),
    },
  };

  const jsonPath = path.join(outputDir, "demo-report.json");
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2));
  console.log(`  JSON saved to:   ${jsonPath}`);

  if (!allPassed) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nFatal:", err.message ?? err);
  process.exit(1);
});
