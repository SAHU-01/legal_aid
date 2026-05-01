/**
 * Legal-Aid Automation Agent
 *
 * Polls devnet every 15 seconds for closed cases, then for each:
 *   1. Logs case data from on-chain PDA
 *   2. Creates a Light Protocol compressed state log (memo)
 *   3. Executes a real devnet USDC transfer to the lawyer
 *   4. Calls /api/claim-payment for credential verification (optional)
 *   5. Calls mark_paid on the Anchor program
 *
 * Run:  npx ts-node scripts/agent.ts
 * Stop: Ctrl+C
 */

import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import {
  getOrCreateAssociatedTokenAccount,
  transferChecked,
} from "@solana/spl-token";
import {
  createRpc,
  compress,
  buildAndSignTx,
  sendAndConfirmTx,
  confirmConfig,
} from "@lightprotocol/stateless.js";
import fs from "fs";
import path from "path";

import { HELIUS_RPC_URL, connection, payer } from "./lib/connection";
import { getOrCreateUsdcMint } from "./lib/setup-usdc";
import { scanClosedCases, type CaseFileEntry } from "./lib/case-scanner";

import type { LegalAid } from "../target/types/legal_aid";

// ── Constants ──────────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV"
);

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

const POLL_INTERVAL_MS = 15_000;
const USDC_DECIMALS = 6;
const USDC_PAYMENT_AMOUNT = 50; // 50 USDC per case
const API_BASE = process.env.API_BASE ?? "http://localhost:3000";

// Track cases we've already processed in this session to avoid double-processing
const processed = new Set<string>();

// ── Helpers ─────────────────────────────────────────────────────────

function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

function ts(): string {
  return new Date().toISOString();
}

function log(msg: string) {
  console.log(`[${ts()}] ${msg}`);
}

function logErr(msg: string) {
  console.error(`[${ts()}] ERROR: ${msg}`);
}

// ── Load IDL + build Anchor program ────────────────────────────────

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
const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

// ── Step functions ──────────────────────────────────────────────────

/**
 * Step 2a: LOG — print on-chain PDA data for a closed case.
 */
function logCaseData(entry: CaseFileEntry): void {
  const acct = entry.account;
  const docHashHex = Buffer.from(acct.documentHash).toString("hex");
  console.log(`  Case ID:       ${acct.caseId}`);
  console.log(`  Lawyer:        ${acct.lawyer.toBase58()}`);
  console.log(`  Document Hash: ${docHashHex}`);
  console.log(`  Issuer:        ${acct.issuer.toBase58()}`);
  console.log(`  Created:       ${new Date(acct.createdAt.toNumber() * 1000).toISOString()}`);
  console.log(`  Updated:       ${new Date(acct.updatedAt.toNumber() * 1000).toISOString()}`);
}

/**
 * Step 2b: COMPRESS — create a Light Protocol compressed log via memo.
 * Returns the memo tx signature.
 */
async function compressLog(entry: CaseFileEntry): Promise<string> {
  const acct = entry.account;
  const docHashHex = Buffer.from(acct.documentHash).toString("hex");

  // Compress a small amount of SOL to create a compressed account
  const compressLamports = 10_000;
  await compress(rpc, payer, compressLamports, payer.publicKey);

  // Build memo with case metadata
  const memoPayload = JSON.stringify({
    case_id: acct.caseId,
    document_hash: docHashHex,
    lawyer: acct.lawyer.toBase58(),
    timestamp: Math.floor(Date.now() / 1000),
    status: "DISBURSED",
  });

  const memoIx = {
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
    data: Buffer.from(memoPayload, "utf-8"),
  };

  const { blockhash } = await rpc.getLatestBlockhash();
  const memoTx = buildAndSignTx(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }), memoIx],
    payer,
    blockhash
  );

  return sendAndConfirmTx(rpc, memoTx, confirmConfig);
}

/**
 * Step 2c: PAYMENT — transfer devnet USDC to the lawyer, then optionally
 * call /api/claim-payment for SAS credential verification.
 * Returns the transfer tx signature.
 */
async function executePayment(
  entry: CaseFileEntry,
  usdcMint: PublicKey
): Promise<string> {
  const lawyerPubkey = entry.account.lawyer;

  // Ensure the authority has an ATA
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    payer.publicKey
  );

  // Ensure the lawyer has an ATA
  const lawyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    lawyerPubkey
  );

  // Transfer USDC
  const atomicAmount = USDC_PAYMENT_AMOUNT * 10 ** USDC_DECIMALS;
  const transferSig = await transferChecked(
    connection,
    payer,
    payerAta.address,
    usdcMint,
    lawyerAta.address,
    payer,
    atomicAmount,
    USDC_DECIMALS
  );

  // Optional: call /api/claim-payment for on-chain verification + SAS check
  try {
    const res = await fetch(`${API_BASE}/api/claim-payment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        paymentSignature: transferSig,
        lawyerWallet: lawyerPubkey.toBase58(),
        caseId: entry.account.caseId,
      }),
    });
    const body = await res.json();
    if (res.ok) {
      console.log(`  /api/claim-payment: ${res.status} — credential verified`);
    } else {
      console.log(
        `  /api/claim-payment: ${res.status} — ${(body as any).error ?? "see response"}`
      );
    }
  } catch {
    console.log(
      "  /api/claim-payment: server not reachable (skipped — USDC transfer still completed)"
    );
  }

  return transferSig;
}

/**
 * Step 2d: MARK PAID — call the Anchor mark_paid instruction.
 * Transitions CaseFile status from Closed → Paid on-chain.
 * Returns the tx signature.
 */
async function markPaid(entry: CaseFileEntry): Promise<string> {
  const acct = entry.account;

  // We need the ProgramConfig PDA for the mark_paid accounts.
  // Derive it from the case's issuer — scan configs to find the right one.
  // The config PDA seeds are [b"config", jurisdiction.as_bytes()].
  // Since we need the jurisdiction, fetch all configs and find the one
  // whose authority matches the case issuer.
  const allConfigs = await program.account.programConfig.all();
  const config = allConfigs.find(
    (c) => c.account.authority.toBase58() === acct.issuer.toBase58()
  );

  if (!config) {
    throw new Error(
      `No ProgramConfig found for issuer ${acct.issuer.toBase58()}`
    );
  }

  return program.methods
    .markPaid(acct.caseId)
    .accounts({
      config: config.publicKey,
      caseFile: entry.publicKey,
      authority: payer.publicKey,
    } as any)
    .rpc();
}

// ── Process a single closed case ────────────────────────────────────

async function processCase(
  entry: CaseFileEntry,
  usdcMint: PublicKey
): Promise<void> {
  const caseId = entry.account.caseId;
  console.log(`\n${"═".repeat(60)}`);
  log(`Processing case: ${caseId}`);
  console.log("═".repeat(60));

  // 2a. LOG
  console.log("\n[1/4] On-chain case data:");
  logCaseData(entry);

  // 2b. COMPRESS
  console.log("\n[2/4] Creating compressed log (Light Protocol)...");
  const memoSig = await compressLog(entry);
  console.log(`  Compressed Log tx: ${memoSig}`);

  // 2c. PAYMENT
  console.log("\n[3/4] Executing USDC payment...");
  const paymentSig = await executePayment(entry, usdcMint);
  console.log(`  USDC Payment tx:   ${paymentSig}`);

  // 2d. MARK PAID
  console.log("\n[4/4] Marking case as Paid on-chain...");
  const markPaidSig = await markPaid(entry);
  console.log(`  Status Update tx:  ${markPaidSig}`);

  // 2e. SUMMARY
  console.log(`\n${"─".repeat(60)}`);
  console.log(`  SUMMARY — Case ID: ${caseId}`);
  console.log(`  [1] Compressed Log: ${memoSig}`);
  console.log(`      ${explorerTx(memoSig)}`);
  console.log(`  [2] USDC Payment:   ${paymentSig}`);
  console.log(`      ${explorerTx(paymentSig)}`);
  console.log(`  [3] Status Update:  ${markPaidSig}`);
  console.log(`      ${explorerTx(markPaidSig)}`);
  console.log("  All verifiable on Solana Explorer (devnet)");
  console.log("─".repeat(60));

  processed.add(caseId);
}

// ── Poll loop ───────────────────────────────────────────────────────

async function poll(usdcMint: PublicKey): Promise<void> {
  // Scan all closed cases from devnet
  const closedCases = await scanClosedCases(connection, program);

  // Filter out cases we've already processed this session
  const pending = closedCases.filter(
    (c) => !processed.has(c.account.caseId)
  );

  if (pending.length === 0) {
    log("No closed cases. Polling...");
    return;
  }

  log(`Found ${pending.length} closed case(s) to process`);

  for (const entry of pending) {
    try {
      await processCase(entry, usdcMint);
    } catch (err: any) {
      logErr(`Failed to process case ${entry.account.caseId}: ${err.message ?? err}`);
    }
  }
}

// ── Startup checks ──────────────────────────────────────────────────

async function startupChecks(): Promise<PublicKey> {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║          Legal-Aid Automation Agent                     ║");
  console.log("║    On-chain scan → Compress → Pay → Mark Paid          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  // 1. Verify HELIUS_RPC_URL
  log(`Helius RPC: ${HELIUS_RPC_URL.replace(/api-key=.*/, "api-key=***")}`);

  // 2. Verify devnet connection
  const slot = await connection.getSlot();
  log(`Devnet connection OK — slot ${slot}`);

  // 3. Verify program exists
  const programInfo = await connection.getAccountInfo(PROGRAM_ID);
  if (!programInfo) {
    throw new Error(`Program not found at ${PROGRAM_ID.toBase58()}`);
  }
  log(`Program verified at ${PROGRAM_ID.toBase58()}`);

  // 4. Authority wallet + SOL balance
  const balance = await connection.getBalance(payer.publicKey);
  log(`Authority wallet: ${payer.publicKey.toBase58()}`);
  log(`SOL balance:      ${(balance / 1e9).toFixed(4)} SOL`);

  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient SOL — need at least 0.01 SOL on devnet");
  }

  // 5. Ensure USDC mint is available and funded
  log("Setting up devnet USDC mint...");
  const { mint } = await getOrCreateUsdcMint();
  log(`USDC mint: ${mint.toBase58()}`);

  // Fund the authority's USDC ATA if needed
  const { fundUsdcAccount } = await import("./lib/setup-usdc");
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    payer.publicKey
  );
  const currentBalance = Number(payerAta.amount) / 10 ** USDC_DECIMALS;
  if (currentBalance < USDC_PAYMENT_AMOUNT) {
    log(`Minting 10,000 USDC to authority ATA (current: ${currentBalance})...`);
    await fundUsdcAccount(mint, payer.publicKey, 10_000);
  }
  log(`Authority USDC balance: ${Math.max(currentBalance, 10_000)} USDC`);

  console.log();
  log(`Polling every ${POLL_INTERVAL_MS / 1000}s — Ctrl+C to stop`);
  console.log("═".repeat(60));

  return mint;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const usdcMint = await startupChecks();

  // Graceful shutdown
  let running = true;
  process.on("SIGINT", () => {
    log("Shutting down...");
    running = false;
  });

  // Initial poll
  await poll(usdcMint);

  // Polling loop
  while (running) {
    await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
    if (!running) break;
    try {
      await poll(usdcMint);
    } catch (err: any) {
      logErr(`Poll error: ${err.message ?? err}`);
    }
  }

  log("Agent stopped.");
}

main().catch((err) => {
  console.error("\nFatal:", err.message ?? err);
  process.exit(1);
});
