/**
 * Verify that the automation agent correctly processed test cases.
 *
 * Reads scripts/data/test-cases-info.json, then checks on-chain state:
 *   1. Cases A + B should now be status "Paid"
 *   2. Case C should still be status "InProgress"
 *   3. Lawyers should have received USDC
 *   4. Document hashes on PDAs should match expected SHA-256 values
 *
 * Run:  npx ts-node scripts/verify-agent-run.ts
 */

import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { getOrCreateAssociatedTokenAccount, getAccount } from "@solana/spl-token";
import fs from "fs";
import path from "path";

import { connection, payer } from "./lib/connection";
import { getCaseByIdOnChain } from "./lib/case-scanner";

import type { LegalAid } from "../target/types/legal_aid";

// ── Setup ──────────────────────────────────────────────────────────

const USDC_DECIMALS = 6;

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

// ── Helpers ─────────────────────────────────────────────────────────

function statusName(status: any): string {
  if ("open" in status) return "Open";
  if ("inProgress" in status) return "InProgress";
  if ("closed" in status) return "Closed";
  if ("paid" in status) return "Paid";
  return "Unknown";
}

interface CheckResult {
  label: string;
  pass: boolean;
  detail: string;
}

const results: CheckResult[] = [];

function check(label: string, pass: boolean, detail: string) {
  results.push({ label, pass, detail });
  const icon = pass ? "PASS" : "FAIL";
  console.log(`  [${icon}] ${label}: ${detail}`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║        Verify Agent Run — On-Chain State Check          ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();

  // Load test info
  const infoPath = path.join(__dirname, "data", "test-cases-info.json");
  if (!fs.existsSync(infoPath)) {
    console.error(
      "ERROR: scripts/data/test-cases-info.json not found.\n" +
        "Run create-test-cases.ts first."
    );
    process.exit(1);
  }

  const info = JSON.parse(fs.readFileSync(infoPath, "utf-8"));
  console.log("Test run from:", info.createdAt);
  console.log("Suffix:       ", info.suffix);
  console.log();

  // ═══════════════════════════════════════════════════════════════════
  // CHECK 1: Case A should be Paid
  // ═══════════════════════════════════════════════════════════════════

  console.log("── Case A ──────────────────────────────────────────────");
  const caseA = await getCaseByIdOnChain(program, info.cases.caseA.caseId);
  if (!caseA) {
    check("Case A exists", false, "PDA not found on-chain");
  } else {
    check("Case A exists", true, caseA.publicKey.toBase58());
    const status = statusName(caseA.account.status);
    check("Case A status", status === "Paid", `expected Paid, got ${status}`);
    const hashHex = Buffer.from(caseA.account.documentHash).toString("hex");
    const hashMatch = hashHex === info.cases.caseA.documentHash;
    check(
      "Case A doc hash",
      hashMatch,
      hashMatch ? "matches" : `expected ${info.cases.caseA.documentHash}, got ${hashHex}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHECK 2: Case B should be Paid
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n── Case B ──────────────────────────────────────────────");
  const caseB = await getCaseByIdOnChain(program, info.cases.caseB.caseId);
  if (!caseB) {
    check("Case B exists", false, "PDA not found on-chain");
  } else {
    check("Case B exists", true, caseB.publicKey.toBase58());
    const status = statusName(caseB.account.status);
    check("Case B status", status === "Paid", `expected Paid, got ${status}`);
    const hashHex = Buffer.from(caseB.account.documentHash).toString("hex");
    const hashMatch = hashHex === info.cases.caseB.documentHash;
    check(
      "Case B doc hash",
      hashMatch,
      hashMatch ? "matches" : `expected ${info.cases.caseB.documentHash}, got ${hashHex}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHECK 3: Case C should still be InProgress
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n── Case C ──────────────────────────────────────────────");
  const caseC = await getCaseByIdOnChain(program, info.cases.caseC.caseId);
  if (!caseC) {
    check("Case C exists", false, "PDA not found on-chain");
  } else {
    check("Case C exists", true, caseC.publicKey.toBase58());
    const status = statusName(caseC.account.status);
    check(
      "Case C status",
      status === "InProgress",
      `expected InProgress, got ${status}`
    );
  }

  // ═══════════════════════════════════════════════════════════════════
  // CHECK 4: Lawyer USDC balances
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n── USDC Balances ───────────────────────────────────────");

  const usdcMint = new PublicKey(info.usdcMint);

  for (const [label, lawyerInfo] of [
    ["Lawyer 1", info.lawyers.lawyer1],
    ["Lawyer 2", info.lawyers.lawyer2],
  ] as const) {
    const lawyerPubkey = new PublicKey(lawyerInfo.publicKey);
    try {
      const ata = await getOrCreateAssociatedTokenAccount(
        connection,
        payer,
        usdcMint,
        lawyerPubkey
      );
      const acct = await getAccount(connection, ata.address);
      const balance = Number(acct.amount) / 10 ** USDC_DECIMALS;
      check(
        `${label} USDC`,
        balance > 0,
        `${balance} USDC (${lawyerInfo.publicKey.slice(0, 16)}...)`
      );
    } catch (err: any) {
      check(`${label} USDC`, false, `could not fetch ATA: ${err.message}`);
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  const passed = results.filter((r) => r.pass).length;
  const failed = results.filter((r) => !r.pass).length;
  const total = results.length;

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                  VERIFICATION RESULTS                   ║");
  console.log("╠══════════════════════════════════════════════════════════╣");

  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    const line = `  [${icon}] ${r.label}`;
    console.log(`║${line.padEnd(57)}║`);
  }

  console.log("╠══════════════════════════════════════════════════════════╣");
  const summary = `  ${passed}/${total} passed, ${failed} failed`;
  console.log(`║${summary.padEnd(57)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  if (failed > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nError:", err.message ?? err);
  process.exit(1);
});
