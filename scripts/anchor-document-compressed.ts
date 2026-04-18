import "dotenv/config";
import { createHash } from "crypto";
import fs from "fs";
import path from "path";
import {
  Keypair,
  ComputeBudgetProgram,
  TransactionMessage,
  VersionedTransaction,
  PublicKey,
} from "@solana/web3.js";
import {
  createRpc,
  LightSystemProgram,
  compress,
  buildAndSignTx,
  sendAndConfirmTx,
  confirmConfig,
} from "@lightprotocol/stateless.js";
import { HELIUS_RPC_URL, payer } from "./lib/connection";

// ── Document metadata ──────────────────────────────────────────────

const CASE_ID = "CASE-001";
const DOCUMENT_CONTENT = "test legal document day 3";
const documentHash = createHash("sha256")
  .update(DOCUMENT_CONTENT)
  .digest("hex");
const lawyerKeypair = Keypair.generate();
const timestamp = Math.floor(Date.now() / 1000);

const documentMetadata = {
  case_id: CASE_ID,
  document_hash: documentHash,
  lawyer: lawyerKeypair.publicKey.toBase58(),
  timestamp,
  status: "ANCHORED",
};

console.log("=== Legal Document Compressed Anchor ===");
console.log("Case ID:       ", CASE_ID);
console.log("Document hash: ", documentHash);
console.log("Lawyer pubkey: ", lawyerKeypair.publicKey.toBase58());
console.log("Timestamp:     ", timestamp);
console.log();

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  const heliusUrl = HELIUS_RPC_URL;

  // createRpc takes (rpcEndpoint, compressionEndpoint, proverEndpoint)
  // Helius serves all three from the same URL
  const rpc = createRpc(heliusUrl, heliusUrl, heliusUrl);

  console.log("Payer:", payer.publicKey.toBase58());
  const balance = await rpc.getBalance(payer.publicKey);
  console.log("Balance:", balance / 1e9, "SOL");

  if (balance < 0.01 * 1e9) {
    throw new Error("Insufficient balance — need at least 0.01 SOL on devnet");
  }

  // ── 1. Compress SOL into a compressed account ────────────────────
  //   This creates a compressed account on the state Merkle tree.
  //   We compress a small amount (10_000 lamports) to the payer address.
  const compressLamports = 10_000;

  console.log(
    `\nCompressing ${compressLamports} lamports into compressed account...`
  );

  const compressTxSig = await compress(
    rpc,
    payer,
    compressLamports,
    payer.publicKey
  );

  console.log("Compress tx:", compressTxSig);

  // ── 2. Anchor document hash via Memo in a second tx ──────────────
  //   We include the document metadata as a Memo instruction so the
  //   data is permanently recorded on-chain in the transaction log.
  const MEMO_PROGRAM_ID = new PublicKey(
    "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"
  );

  const memoData = Buffer.from(JSON.stringify(documentMetadata), "utf-8");

  const memoIx = {
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
    data: memoData,
  };

  const { blockhash } = await rpc.getLatestBlockhash();
  const memoTx = buildAndSignTx(
    [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }),
      memoIx,
    ],
    payer,
    blockhash
  );

  const memoTxSig = await sendAndConfirmTx(rpc, memoTx, confirmConfig);
  console.log("Memo tx:    ", memoTxSig);

  // ── 3. Query compressed accounts owned by payer ──────────────────
  console.log("\nQuerying compressed accounts for payer...");
  const compressedAccounts = await rpc.getCompressedAccountsByOwner(
    payer.publicKey
  );

  console.log(
    `Found ${compressedAccounts.items.length} compressed account(s)`
  );

  const latestAccount =
    compressedAccounts.items[compressedAccounts.items.length - 1];

  // ── 4. Save results ──────────────────────────────────────────────
  const result = {
    case_id: CASE_ID,
    document_hash: documentHash,
    lawyer: lawyerKeypair.publicKey.toBase58(),
    timestamp,
    status: "ANCHORED",
    compression: {
      compress_tx_signature: compressTxSig,
      memo_tx_signature: memoTxSig,
      compressed_account_hash: latestAccount?.hash ?? null,
      compressed_account_lamports:
        latestAccount?.lamports?.toString() ?? null,
      total_compressed_accounts: compressedAccounts.items.length,
    },
    network: "devnet",
    rpc_endpoint: heliusUrl.replace(/api-key=.*/, "api-key=***"),
  };

  const outPath = path.join(__dirname, "compressed-anchor-info.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`\nSaved to ${outPath}`);
  console.log("\n=== Done ===");
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
