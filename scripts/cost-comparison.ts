import "dotenv/config";
import fs from "fs";
import path from "path";
import { createRpc } from "@lightprotocol/stateless.js";
import { HELIUS_RPC_URL, payer } from "./lib/connection";

// ── Constants ───────────────────────────────────────────────────────

// CaseFile PDA size from programs/legal-aid/src/lib.rs:
//   8 discriminator + (4+32) case_id + 32 hash + 32 lawyer +
//   32 issuer + 2 status enum + 8 created_at + 8 updated_at + 1 bump
const CASE_FILE_SPACE = 159;

const SOL_PRICE_USD = 150;

// ── Helpers ─────────────────────────────────────────────────────────

function lamportsToSol(lamports: number): number {
  return lamports / 1e9;
}

function lamportsToUsd(lamports: number): string {
  return (lamportsToSol(lamports) * SOL_PRICE_USD).toFixed(6);
}

function pct(a: number, b: number): string {
  return ((1 - a / b) * 100).toFixed(1);
}

function fmtUsd(n: number): string {
  return n >= 1
    ? `$${n.toFixed(2)}`
    : n >= 0.01
      ? `$${n.toFixed(4)}`
      : `$${n.toFixed(6)}`;
}

function fmtNum(n: number): string {
  return n.toLocaleString("en-US");
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

  // ── 1. Standard PDA cost ─────────────────────────────────────────

  const pdaRentLamports =
    await rpc.getMinimumBalanceForRentExemption(CASE_FILE_SPACE);

  // Anchor init also costs a tx fee (5000 lamports baseline)
  const pdaTxFee = 5000;
  const pdaTotalLamports = pdaRentLamports + pdaTxFee;

  // ── 2. Compressed account cost ───────────────────────────────────

  const infoPath = path.join(__dirname, "compressed-anchor-info.json");
  const info = JSON.parse(fs.readFileSync(infoPath, "utf-8"));

  const compressSig = info.compression.compress_tx_signature;
  const memoSig = info.compression.memo_tx_signature;

  const [compressTx, memoTx] = await Promise.all([
    rpc.getTransaction(compressSig, { maxSupportedTransactionVersion: 0 }),
    rpc.getTransaction(memoSig, { maxSupportedTransactionVersion: 0 }),
  ]);

  if (!compressTx || !memoTx) {
    throw new Error("Could not fetch transaction details from Helius");
  }

  // Total payer cost = preBalance - postBalance (includes fees + network fees + compressed lamports)
  const compressCost =
    (compressTx.meta!.preBalances[0] ?? 0) -
    (compressTx.meta!.postBalances[0] ?? 0);
  const memoCost =
    (memoTx.meta!.preBalances[0] ?? 0) -
    (memoTx.meta!.postBalances[0] ?? 0);

  const compressedTotalLamports = compressCost + memoCost;

  // ── 3. Print comparison ──────────────────────────────────────────

  const savingsPct = pct(compressedTotalLamports, pdaTotalLamports);

  const W = 60;
  const hr = "═".repeat(W);
  const row = (s: string) => `║  ${s.padEnd(W - 2)}║`;
  const blank = row("");

  console.log(`╔${hr}╗`);
  console.log(row("Legal-Aid Storage Cost Comparison"));
  console.log(`╠${hr}╣`);
  console.log(row(`SOL price: $${SOL_PRICE_USD}/SOL`));
  console.log(`╠${hr}╣`);
  console.log(blank);

  console.log(row(
    `Standard PDA:  ${fmtNum(pdaTotalLamports).padStart(10)} lamports  (~$${lamportsToUsd(pdaTotalLamports)})`
  ));
  console.log(row(
    `  ├─ rent-exempt:  ${fmtNum(pdaRentLamports).padStart(10)} lamports`
  ));
  console.log(row(
    `  └─ tx fee:       ${fmtNum(pdaTxFee).padStart(10)} lamports`
  ));
  console.log(blank);

  console.log(row(
    `Compressed:    ${fmtNum(compressedTotalLamports).padStart(10)} lamports  (~$${lamportsToUsd(compressedTotalLamports)})`
  ));
  console.log(row(
    `  ├─ compress tx:  ${fmtNum(compressCost).padStart(10)} lamports`
  ));
  console.log(row(
    `  └─ memo tx:      ${fmtNum(memoCost).padStart(10)} lamports`
  ));

  console.log(blank);
  console.log(`╠${hr}╣`);
  console.log(row(`Savings: ${savingsPct}% per case`));
  console.log(`╠${hr}╣`);

  // ── 4. Scale projections ─────────────────────────────────────────

  console.log(blank);
  console.log(row("Scale projections:"));
  console.log(blank);

  const scales = [10_000, 100_000];
  for (const n of scales) {
    const pdaCostAtScale = pdaTotalLamports * n;
    const cmpCostAtScale = compressedTotalLamports * n;
    const savedLamports = pdaCostAtScale - cmpCostAtScale;
    const savedUsd = lamportsToSol(savedLamports) * SOL_PRICE_USD;
    const pdaUsdAtScale = lamportsToSol(pdaCostAtScale) * SOL_PRICE_USD;
    const cmpUsdAtScale = lamportsToSol(cmpCostAtScale) * SOL_PRICE_USD;

    console.log(row(
      `  ${fmtNum(n).padStart(7)} cases  ─  ` +
      `PDA ${fmtUsd(pdaUsdAtScale).padStart(10)}  vs  ` +
      `Compressed ${fmtUsd(cmpUsdAtScale)}`
    ));
    console.log(row(
      `${" ".repeat(19)}saved: ${fmtUsd(savedUsd)}`
    ));
    console.log(blank);
  }

  console.log(`╚${hr}╝`);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
