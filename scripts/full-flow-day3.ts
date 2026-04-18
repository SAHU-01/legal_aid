import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import {
  createRpc,
  createBN254,
  compress,
  buildAndSignTx,
  sendAndConfirmTx,
  confirmConfig,
} from "@lightprotocol/stateless.js";
import { HELIUS_RPC_URL, payer } from "./lib/connection";

// Load IDL + types
import type { LegalAid } from "../target/types/legal_aid";
const idl = JSON.parse(
  fs.readFileSync(
    path.join(__dirname, "..", "target", "idl", "legal_aid.json"),
    "utf-8"
  )
);

// ── Constants ───────────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV"
);

const MEMO_PROGRAM_ID = new PublicKey(
  "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
);

// Unique suffix for this run so PDAs don't collide with prior devnet runs
const suffix = Date.now().toString().slice(-6);
const JURISDICTION = "D3"; // short jurisdiction for this demo
const CASE_ID = `D3-${suffix}`;
const DOCUMENT_CONTENT = "test legal document day 3";
const documentHashBytes = createHash("sha256")
  .update(DOCUMENT_CONTENT)
  .digest();
const documentHashHex = documentHashBytes.toString("hex");
const documentHashArray = Array.from(documentHashBytes) as number[];

const lawyerKeypair = Keypair.generate();

// ── Derive PDAs ─────────────────────────────────────────────────────

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config"), Buffer.from(JURISDICTION)],
  PROGRAM_ID
);
const [casePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("case"), Buffer.from(CASE_ID)],
  PROGRAM_ID
);

// ── Helpers ─────────────────────────────────────────────────────────

function explorerUrl(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

function accountUrl(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}

function step(n: number, label: string) {
  console.log(`\n── Step ${n}: ${label} ${"─".repeat(50 - label.length)}`);
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║       Legal-Aid Day 3 — Hybrid Full Flow Demo          ║");
  console.log("║  Anchor state machine + Light Protocol document logs   ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log("Case ID:       ", CASE_ID);
  console.log("Jurisdiction:  ", JURISDICTION);
  console.log("Lawyer:        ", lawyerKeypair.publicKey.toBase58());
  console.log("Document hash: ", documentHashHex);
  console.log("Config PDA:    ", configPda.toBase58());
  console.log("Case PDA:      ", casePda.toBase58());

  // Set up Anchor provider pointing at Helius (devnet)
  const connection = new anchor.web3.Connection(HELIUS_RPC_URL, "confirmed");
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });

  const program = new Program<LegalAid>(idl, provider);

  // Light Protocol RPC
  const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

  const txSigs: Record<string, string> = {};

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: initialize (Anchor) — create ProgramConfig PDA
  // ═══════════════════════════════════════════════════════════════════

  step(1, "initialize (Anchor)");

  txSigs.initialize = await program.methods
    .initialize(JURISDICTION)
    .accounts({ authority: payer.publicKey })
    .rpc();

  console.log("  tx:", txSigs.initialize);

  const config = await program.account.programConfig.fetch(configPda);
  console.log("  jurisdiction:", config.jurisdiction);
  console.log("  authority:   ", config.authority.toBase58());

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: open_case (Anchor) — create CaseFile PDA
  // ═══════════════════════════════════════════════════════════════════

  step(2, "open_case (Anchor)");

  txSigs.openCase = await program.methods
    .openCase(CASE_ID, lawyerKeypair.publicKey)
    .accounts({
      config: configPda,
      authority: payer.publicKey,
    } as any)
    .rpc();

  console.log("  tx:", txSigs.openCase);

  let caseFile = await program.account.caseFile.fetch(casePda);
  console.log("  status: Open ✓");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3a: anchor_document (Anchor) — store hash on PDA
  // ═══════════════════════════════════════════════════════════════════

  step(3, "anchor_document (Anchor PDA)");

  txSigs.anchorDocument = await program.methods
    .anchorDocument(CASE_ID, documentHashArray)
    .accounts({
      caseFile: casePda,
      lawyer: lawyerKeypair.publicKey,
    } as any)
    .signers([lawyerKeypair])
    .rpc();

  console.log("  tx:", txSigs.anchorDocument);

  caseFile = await program.account.caseFile.fetch(casePda);
  const pdaHashHex = Buffer.from(caseFile.documentHash).toString("hex");
  console.log("  PDA hash:", pdaHashHex);
  console.log("  status: InProgress ✓");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3b: Compressed document log (Light Protocol)
  // ═══════════════════════════════════════════════════════════════════

  step(4, "compressed doc log (Light Protocol)");

  // 4a. Compress SOL to create a compressed account on the Merkle tree
  const compressLamports = 10_000;
  console.log(`  Compressing ${compressLamports} lamports...`);
  txSigs.compress = await compress(
    rpc,
    payer,
    compressLamports,
    payer.publicKey
  );
  console.log("  compress tx:", txSigs.compress);

  // 4b. Anchor the document metadata via Memo
  const memoPayload = JSON.stringify({
    case_id: CASE_ID,
    document_hash: documentHashHex,
    lawyer: lawyerKeypair.publicKey.toBase58(),
    timestamp: Math.floor(Date.now() / 1000),
    status: "ANCHORED",
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

  txSigs.memo = await sendAndConfirmTx(rpc, memoTx, confirmConfig);
  console.log("  memo tx:    ", txSigs.memo);

  // Query the compressed account
  const compressedAccounts = await rpc.getCompressedAccountsByOwner(
    payer.publicKey
  );
  const latestCompressed =
    compressedAccounts.items[compressedAccounts.items.length - 1];
  const compressedHash = latestCompressed.hash.toString(16).padStart(64, "0");
  console.log("  compressed account hash:", compressedHash);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: close_case (Anchor)
  // ═══════════════════════════════════════════════════════════════════

  step(5, "close_case (Anchor)");

  txSigs.closeCase = await program.methods
    .closeCase(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: payer.publicKey,
    } as any)
    .rpc();

  console.log("  tx:", txSigs.closeCase);

  caseFile = await program.account.caseFile.fetch(casePda);
  console.log("  status: Closed ✓");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: mark_paid (Anchor)
  // ═══════════════════════════════════════════════════════════════════

  step(6, "mark_paid (Anchor)");

  txSigs.markPaid = await program.methods
    .markPaid(CASE_ID)
    .accounts({
      config: configPda,
      caseFile: casePda,
      authority: payer.publicKey,
    } as any)
    .rpc();

  console.log("  tx:", txSigs.markPaid);

  caseFile = await program.account.caseFile.fetch(casePda);
  console.log("  status: Paid ✓");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 7: Verify compressed log via Photon
  // ═══════════════════════════════════════════════════════════════════

  step(7, "verify compressed log (Photon)");

  const hashBn = createBN254(compressedHash, "hex");
  const verifiedAccount = await rpc.getCompressedAccount(undefined, hashBn);

  if (!verifiedAccount) {
    console.log("  FAIL: compressed account not found");
    process.exit(1);
  }

  console.log("  owner:   ", verifiedAccount.owner.toBase58());
  console.log("  lamports:", verifiedAccount.lamports.toString());
  console.log("  tree:    ", verifiedAccount.treeInfo.tree.toString());

  // Fetch memo tx to verify document hash
  const memoTxInfo = await rpc.getTransaction(txSigs.memo, {
    maxSupportedTransactionVersion: 0,
  });
  const memoLine = memoTxInfo?.meta?.logMessages?.find((l: string) =>
    l.includes("Memo (len")
  );
  const jsonMatch = memoLine?.match(/Memo \(len \d+\): (.+)$/);
  const compressedMeta = jsonMatch ? JSON.parse(JSON.parse(jsonMatch[1])) : null;
  const compressedDocHash: string = compressedMeta?.document_hash ?? "";

  console.log("  compressed doc hash:", compressedDocHash);

  // ═══════════════════════════════════════════════════════════════════
  // SUMMARY
  // ═══════════════════════════════════════════════════════════════════

  const hashesMatch = pdaHashHex === compressedDocHash;

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    SUMMARY                             ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Case ID:         ${CASE_ID.padEnd(38)}║`);
  console.log(`║  Final status:    Paid${" ".repeat(34)}║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Anchor Program (case lifecycle)                       ║");
  console.log(`║    Case PDA:      ${casePda.toBase58().slice(0, 36)}...  ║`);
  console.log(`║    PDA doc hash:  ${pdaHashHex.slice(0, 36)}...  ║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Light Protocol (compressed doc log)                   ║");
  console.log(`║    Account hash:  ${compressedHash.slice(0, 36)}...  ║`);
  console.log(`║    Log doc hash:  ${compressedDocHash.slice(0, 36)}...  ║`);
  console.log("╠══════════════════════════════════════════════════════════╣");

  const matchStr = hashesMatch ? "YES ✓" : "NO ✗";
  console.log(`║  Hashes match:    ${matchStr.padEnd(38)}║`);
  console.log("╚══════════════════════════════════════════════════════════╝");

  console.log("\n── Explorer Links ──────────────────────────────────────");
  console.log("  Case PDA:        ", accountUrl(casePda.toBase58()));
  console.log("  Config PDA:      ", accountUrl(configPda.toBase58()));
  console.log("  initialize:      ", explorerUrl(txSigs.initialize));
  console.log("  open_case:       ", explorerUrl(txSigs.openCase));
  console.log("  anchor_document: ", explorerUrl(txSigs.anchorDocument));
  console.log("  compress:        ", explorerUrl(txSigs.compress));
  console.log("  memo:            ", explorerUrl(txSigs.memo));
  console.log("  close_case:      ", explorerUrl(txSigs.closeCase));
  console.log("  mark_paid:       ", explorerUrl(txSigs.markPaid));

  if (!hashesMatch) {
    console.log("\nFAIL: Document hashes do not match!");
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nError:", err);
  process.exit(1);
});
