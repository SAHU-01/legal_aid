/**
 * End-to-end test of the x402 payment flow on devnet.
 *
 * Prerequisites:
 *   1. cd app && npm run dev   (in a separate terminal)
 *   2. HELIUS_RPC_URL set in .env
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import {
  Keypair,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
} from "@solana/spl-token";
import { connection, payer } from "./lib/connection";

// ── Config ──────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const ENDPOINT = `${API_BASE}/api/claim-payment`;
const USDC_DECIMALS = 6;
const CASE_ID = `X402-${Date.now().toString().slice(-6)}`;

// Lawyer keypair — the payment recipient
const lawyerKeypair = Keypair.generate();

// ── Helpers ─────────────────────────────────────────────────────────

function step(n: number, label: string) {
  console.log(`\n── Step ${n}: ${label} ${"─".repeat(50 - label.length)}`);
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║         x402 Payment Flow — End-to-End Test            ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log("API endpoint:", ENDPOINT);
  console.log("Payer:       ", payer.publicKey.toBase58());
  console.log("Lawyer:      ", lawyerKeypair.publicKey.toBase58());
  console.log("Case ID:     ", CASE_ID);

  const results: Record<string, any> = {
    caseId: CASE_ID,
    payer: payer.publicKey.toBase58(),
    lawyer: lawyerKeypair.publicKey.toBase58(),
  };

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Set up devnet mock USDC
  // ═══════════════════════════════════════════════════════════════════

  step(1, "set up devnet mock USDC");

  // Create a mint we control (same 6 decimals as real USDC)
  console.log("  Creating mock USDC mint (6 decimals)...");
  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey, // mint authority = payer
    null, // no freeze authority
    USDC_DECIMALS
  );
  console.log("  Mock USDC mint:", usdcMint.toBase58());

  // Create token accounts for payer and lawyer
  console.log("  Creating payer token account...");
  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    payer.publicKey
  );
  console.log("  Payer ATA:  ", payerAta.address.toBase58());

  console.log("  Creating lawyer token account...");
  const lawyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer, // payer funds the account creation
    usdcMint,
    lawyerKeypair.publicKey
  );
  console.log("  Lawyer ATA: ", lawyerAta.address.toBase58());

  // Mint 1000 USDC to payer
  const mintAmount = 1000 * 10 ** USDC_DECIMALS; // 1,000,000,000 atomic
  console.log(`  Minting 1000 USDC to payer...`);
  const mintSig = await mintTo(
    connection,
    payer,
    usdcMint,
    payerAta.address,
    payer, // mint authority
    mintAmount
  );
  console.log("  Mint tx:", mintSig);

  const payerBalance = await getAccount(connection, payerAta.address);
  console.log(
    "  Payer balance:",
    Number(payerBalance.amount) / 10 ** USDC_DECIMALS,
    "USDC"
  );

  results.mockUsdcMint = usdcMint.toBase58();
  results.mintTx = mintSig;

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: GET /api/claim-payment → 402 Payment Required
  // ═══════════════════════════════════════════════════════════════════

  step(2, "GET /api/claim-payment (402)");

  const getRes = await fetch(ENDPOINT);
  console.log("  HTTP status:", getRes.status);

  if (getRes.status !== 402) {
    throw new Error(
      `Expected 402, got ${getRes.status}. Is the dev server running? (cd app && npm run dev)`
    );
  }

  const paymentReq: any = await getRes.json();
  console.log("  x402 version:", paymentReq.x402Version);
  console.log("  network:     ", paymentReq.accepts[0].network);
  console.log("  amount:      ", paymentReq.accepts[0].amount, "atomic");
  console.log("  asset (USDC):", paymentReq.accepts[0].asset);
  console.log("  pay to:      ", paymentReq.accepts[0].payTo);
  console.log("  description: ", paymentReq.accepts[0].extra?.description);

  results.paymentRequirements = paymentReq;

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Execute USDC transfer on devnet
  // ═══════════════════════════════════════════════════════════════════

  step(3, "execute USDC transfer on devnet");

  const transferAmount = Number(paymentReq.accepts[0].amount); // 50_000_000 atomic

  // Use the generated lawyer keypair as the actual transfer recipient.
  // In production the payTo address would be a separate wallet; for this
  // devnet demo the payer wallet doubles as the 402 recipient, so we
  // transfer to the lawyer keypair to get an observable balance change.
  console.log("  Lawyer (recipient) token account for mock USDC...");
  const recipientAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    lawyerKeypair.publicKey
  );
  console.log("  Recipient ATA:", recipientAta.address.toBase58());

  console.log(
    `  Transferring ${transferAmount / 10 ** USDC_DECIMALS} USDC...`
  );
  const transferSig = await transferChecked(
    connection,
    payer, // fee payer + source owner
    payerAta.address, // source
    usdcMint, // mint
    recipientAta.address, // destination
    payer, // owner of source
    transferAmount,
    USDC_DECIMALS
  );
  console.log("  Transfer tx:", transferSig);

  results.transferTx = transferSig;

  // Brief wait for confirmation to propagate
  await sleep(2000);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: POST /api/claim-payment with PAYMENT-SIGNATURE
  // ═══════════════════════════════════════════════════════════════════

  step(4, "POST /api/claim-payment (verify)");

  const postRes = await fetch(`${ENDPOINT}?caseId=${CASE_ID}`, {
    method: "POST",
    headers: {
      "PAYMENT-SIGNATURE": transferSig,
      "Content-Type": "application/json",
    },
  });

  console.log("  HTTP status:", postRes.status);
  const postBody: any = await postRes.json();
  console.log("  Response:", JSON.stringify(postBody, null, 4));

  if (postRes.status !== 200) {
    throw new Error(
      `Expected 200, got ${postRes.status}: ${JSON.stringify(postBody)}`
    );
  }

  results.verificationResponse = postBody;

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Verify balances
  // ═══════════════════════════════════════════════════════════════════

  step(5, "verify token balances");

  const payerFinal = await getAccount(connection, payerAta.address);
  const recipientFinal = await getAccount(connection, recipientAta.address);

  const payerUSDC = Number(payerFinal.amount) / 10 ** USDC_DECIMALS;
  const recipientUSDC = Number(recipientFinal.amount) / 10 ** USDC_DECIMALS;

  console.log(`  Payer balance:     ${payerUSDC} USDC (was 1000)`);
  console.log(`  Recipient balance: ${recipientUSDC} USDC (was 0)`);

  const expectedRecipient = transferAmount / 10 ** USDC_DECIMALS;
  const balanceCorrect = recipientUSDC === expectedRecipient;
  console.log(`  Expected recipient: ${expectedRecipient} USDC`);
  console.log(`  Balance correct:    ${balanceCorrect ? "YES" : "NO"}`);

  results.finalBalances = {
    payer: payerUSDC,
    recipient: recipientUSDC,
    balanceCorrect,
  };

  // ═══════════════════════════════════════════════════════════════════
  // Save results
  // ═══════════════════════════════════════════════════════════════════

  const outPath = path.join(__dirname, "x402-payment-info.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log(
    `║  ${balanceCorrect ? "PASS" : "FAIL"}${" ".repeat(53)}║`
  );
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║  Mock USDC mint: ${usdcMint.toBase58().slice(0, 36)}...  ║`
  );
  console.log(
    `║  Transfer tx:    ${transferSig.slice(0, 36)}...  ║`
  );
  console.log(
    `║  Case ID:        ${CASE_ID.padEnd(38)}║`
  );
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log(`\nSaved to ${outPath}`);

  if (!balanceCorrect) process.exit(1);
}

main().catch((err) => {
  console.error("\nError:", err.message ?? err);
  console.error(
    "\nMake sure the Next.js dev server is running: cd app && npm run dev"
  );
  process.exit(1);
});
