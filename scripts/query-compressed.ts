import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import { createRpc, createBN254 } from "@lightprotocol/stateless.js";
import { HELIUS_RPC_URL, payer } from "./lib/connection";

// ── Expected value ─────────────────────────────────────────────────

const DOCUMENT_CONTENT = "test legal document day 3";
const expectedHash = createHash("sha256")
  .update(DOCUMENT_CONTENT)
  .digest("hex");

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const infoPath = path.join(__dirname, "compressed-anchor-info.json");
  const info = JSON.parse(fs.readFileSync(infoPath, "utf-8"));

  console.log("=== Query Compressed Document Anchor ===\n");
  console.log("Reading:", infoPath);

  const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

  // ── 1. Query compressed account via Photon indexer ───────────────

  const accountHash = info.compression.compressed_account_hash;
  console.log("\n--- Compressed Account (Photon) ---");
  console.log("Hash:", accountHash);

  const hashBn = createBN254(accountHash, "hex");
  const account = await rpc.getCompressedAccount(undefined, hashBn);

  if (!account) {
    console.log("\nFAIL: Compressed account not found on-chain");
    process.exit(1);
  }

  console.log("Owner:  ", account.owner.toBase58());
  console.log("Lamports:", account.lamports.toString());
  console.log("Tree:   ", account.treeInfo.tree.toString());
  console.log("Leaf:   ", account.leafIndex);

  // ── 2. Fetch memo tx to recover document metadata ────────────────

  const memoSig = info.compression.memo_tx_signature;
  console.log("\n--- Memo Transaction ---");
  console.log("Signature:", memoSig);

  const txInfo = await rpc.getTransaction(memoSig, {
    maxSupportedTransactionVersion: 0,
  });

  if (!txInfo?.meta?.logMessages) {
    console.log("\nFAIL: Could not fetch memo transaction");
    process.exit(1);
  }

  // Extract the memo payload from the log line:
  //   "Program log: Memo (len NNN): \"<json>\""
  const memoLine = txInfo.meta.logMessages.find((l: string) =>
    l.includes("Memo (len")
  );

  if (!memoLine) {
    console.log("\nFAIL: No Memo log found in transaction");
    process.exit(1);
  }

  // Parse JSON from the memo log — format: ...Memo (len N): "<escaped-json>"
  const jsonMatch = memoLine.match(/Memo \(len \d+\): (.+)$/);
  if (!jsonMatch) {
    console.log("\nFAIL: Could not parse Memo log:", memoLine);
    process.exit(1);
  }

  // The payload is a JSON-encoded string wrapping JSON, so parse twice:
  // first strips the outer quotes + escaping, second parses the actual object
  const metadata = JSON.parse(JSON.parse(jsonMatch[1]));

  // ── 3. Print deserialized document fields ────────────────────────

  console.log("\n--- Document Metadata (on-chain) ---");
  console.log("case_id:      ", metadata.case_id);
  console.log("document_hash:", metadata.document_hash);
  console.log("lawyer:       ", metadata.lawyer);
  console.log("timestamp:    ", metadata.timestamp);
  console.log("status:       ", metadata.status);

  // ── 4. Verify document hash ──────────────────────────────────────

  console.log("\n--- Verification ---");
  console.log("Expected hash:", expectedHash);
  console.log("On-chain hash:", metadata.document_hash);

  const pass = metadata.document_hash === expectedHash;

  // Also verify the compressed account owner matches the payer
  const ownerMatch = account.owner.toBase58() === payer.publicKey.toBase58();
  console.log("Owner match:  ", ownerMatch);

  console.log(
    "\n=============================",
    `\n  ${pass && ownerMatch ? "PASS" : "FAIL"}`,
    "\n============================="
  );

  if (!pass || !ownerMatch) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
