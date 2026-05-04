/**
 * Encrypted Document Upload to Arweave via Irys — Adduce Privacy Layer
 *
 * Complete off-chain storage pipeline:
 *   1. Encrypt document (X25519 + AES-256-GCM)
 *   2. Upload encrypted blob to Arweave via Irys (pay with SOL)
 *   3. Get permanent Arweave URL (content-addressable)
 *   4. Anchor plaintext hash + Arweave URL on Solana
 *   5. Lawyer fetches encrypted doc from Arweave, decrypts with wallet
 *
 * This replaces Fabric's Private Data Collections with:
 *   - Arweave for permanent, decentralized, censorship-resistant storage
 *   - X25519+AES-256-GCM for per-document encryption
 *   - Solana for hash anchoring + integrity verification
 *   - Minimal infrastructure: no peers, no sideDBs, no channels
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import { Keypair, PublicKey, ComputeBudgetProgram } from "@solana/web3.js";
import {
  createRpc,
  buildAndSignTx,
  sendAndConfirmTx,
  confirmConfig,
} from "@lightprotocol/stateless.js";
import { Uploader } from "@irys/upload";
import { Solana } from "@irys/upload-solana";
import { HELIUS_RPC_URL, payer } from "./lib/connection";
import {
  encryptDocument,
  decryptDocument,
  deriveEncryptionKeypair,
} from "./lib/privacy";

// ── Sample document ─────────────────────────────────────────────────

const SAMPLE_DOCUMENT = `
ABRECHNUNGSVORDRUCK — Legal Aid Fee Settlement
Amtsgericht Weiden i.d.OPf.
Aktenzeichen: 123 UR II 143/22

Rechtsanwalt: Dieter Stein, Kanzlei Stein & Partner
Mandant: Max Mustermann

Leistungen:
1. Erstberatung (§ 34 RVG)                    85,00 EUR
2. Vertretung im Widerspruchsverfahren        150,00 EUR
3. Schriftverkehr mit Vermieter                45,00 EUR
4. Akteneinsicht                               20,00 EUR
5. Vergleichsverhandlung                       100,00 EUR

Gesamtbetrag: 400,00 EUR
Abzüglich Eigenanteil (15 EUR): 385,00 EUR
Auszahlungsbetrag Staatskasse: 385,00 EUR

Bankverbindung: DE89 3704 0044 0532 0130 00

Datum: 2026-05-02
Unterschrift: _______________
`.trim();

const CASE_ID = "BS-DE-143/22";

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ADDUCE — Encrypted Document Upload to Arweave             ║");
  console.log("║  Permanent decentralized storage via Irys                  ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  const lawyerKeypair = Keypair.generate();
  const lawyerEncKeys = deriveEncryptionKeypair(lawyerKeypair.secretKey);

  console.log("Parties:");
  console.log("  Court Operator:", payer.publicKey.toBase58().slice(0, 16) + "...");
  console.log("  Lawyer:        ", lawyerKeypair.publicKey.toBase58().slice(0, 16) + "...");
  console.log("  Case:          ", CASE_ID);
  console.log();

  // ── Step 1: Encrypt ───────────────────────────────────────────────

  console.log("1. ENCRYPTING DOCUMENT");
  const docBuffer = Buffer.from(SAMPLE_DOCUMENT, "utf-8");
  const envelope = encryptDocument(docBuffer, lawyerEncKeys.publicKey, payer.secretKey);

  console.log("   Plaintext hash:  ", envelope.plaintextHash.slice(0, 24) + "...");
  console.log("   Ciphertext size: ", (envelope.ciphertext.length / 2), "bytes");
  console.log("   Encryption: X25519-ECDH + AES-256-GCM");
  console.log();

  // ── Step 2: Upload to Arweave via Irys ────────────────────────────

  console.log("2. UPLOADING TO ARWEAVE VIA IRYS");
  console.log("   Payment: SOL (from operator wallet)");

  // Initialize Irys with Solana devnet
  const irys = await Uploader(Solana).withWallet(
    Buffer.from(payer.secretKey),
  ).withRpc(
    HELIUS_RPC_URL,
  ).devnet();

  // Check balance
  const irysBalance = await irys.getBalance();
  console.log("   Irys balance:", irys.utils.fromAtomic(irysBalance).toString(), "SOL");

  // Fund if needed
  const envelopeJson = JSON.stringify(envelope);
  const uploadSize = Buffer.byteLength(envelopeJson);
  const price = await irys.getPrice(uploadSize);
  console.log("   Upload size: ", uploadSize, "bytes");
  console.log("   Cost:        ", irys.utils.fromAtomic(price).toString(), "SOL");

  if (irysBalance < price) {
    console.log("   Funding Irys node...");
    const fundAmount = price + price; // 2x for safety
    const fundTx = await irys.fund(fundAmount);
    console.log("   Fund tx:", fundTx.id);
  }

  // Upload encrypted envelope
  console.log("   Uploading encrypted document...");
  const tags = [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "Adduce" },
    { name: "App-Version", value: "1.0" },
    { name: "Case-ID", value: CASE_ID },
    { name: "Plaintext-Hash", value: envelope.plaintextHash },
    { name: "Encryption", value: "x25519-aes256gcm" },
    { name: "Recipient", value: lawyerKeypair.publicKey.toBase58() },
  ];

  const receipt = await irys.upload(envelopeJson, { tags });
  const arweaveUrl = `https://gateway.irys.xyz/${receipt.id}`;

  console.log("   Arweave TX ID:", receipt.id);
  console.log("   Arweave URL:  ", arweaveUrl);
  console.log("   Status: Permanently stored on Arweave.\n");

  // ── Step 3: Anchor on Solana ──────────────────────────────────────

  console.log("3. ANCHORING ON SOLANA");
  const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

  const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

  const anchorPayload = {
    protocol: "adduce-v1",
    type: "encrypted_document_arweave",
    case_id: CASE_ID,
    plaintext_hash: envelope.plaintextHash,
    ciphertext_hash: envelope.ciphertextHash,
    arweave_tx: receipt.id,
    arweave_url: arweaveUrl,
    recipient: lawyerKeypair.publicKey.toBase58(),
    encryption: "x25519-aes256gcm",
    timestamp: Math.floor(Date.now() / 1000),
  };

  const memoIx = {
    programId: MEMO_PROGRAM_ID,
    keys: [{ pubkey: payer.publicKey, isSigner: true, isWritable: true }],
    data: Buffer.from(JSON.stringify(anchorPayload), "utf-8"),
  };

  const { blockhash } = await rpc.getLatestBlockhash();
  const tx = buildAndSignTx(
    [ComputeBudgetProgram.setComputeUnitLimit({ units: 200_000 }), memoIx],
    payer,
    blockhash,
  );

  const sig = await sendAndConfirmTx(rpc, tx, confirmConfig);
  console.log("   Solana tx:  ", sig);
  console.log("   Explorer:    https://explorer.solana.com/tx/" + sig + "?cluster=devnet");
  console.log("   On-chain: plaintext hash + Arweave URL anchored.\n");

  // ── Step 4: Verify retrieval + decryption ─────────────────────────

  console.log("4. VERIFYING RETRIEVAL + DECRYPTION");
  console.log("   Fetching encrypted document from Arweave...");

  const response = await fetch(arweaveUrl);
  const fetchedEnvelope = await response.json();

  console.log("   Fetched from:", arweaveUrl);
  console.log("   Ciphertext hash matches:", fetchedEnvelope.ciphertextHash === envelope.ciphertextHash ? "PASS" : "FAIL");

  const decrypted = decryptDocument(fetchedEnvelope, lawyerKeypair.secretKey);
  const matches = decrypted.toString("utf-8") === SAMPLE_DOCUMENT;

  console.log("   Decryption:      ", matches ? "SUCCESS" : "FAILED");
  console.log("   Integrity check: ", matches ? "PASSED" : "FAILED");
  console.log("   Document preview:");
  console.log("   " + decrypted.toString("utf-8").split("\n").slice(0, 3).join("\n   "));
  console.log("   ...\n");

  // ── Summary ───────────────────────────────────────────────────────

  console.log("5. STORAGE ARCHITECTURE");
  console.log("   ┌────────────────────────┬──────────────────────┬──────────────────────┐");
  console.log("   │ Layer                  │ Fabric PDC           │ Adduce/Solana         │");
  console.log("   ├────────────────────────┼──────────────────────┼──────────────────────┤");
  console.log("   │ Encryption             │ Channel TLS          │ X25519+AES-256-GCM   │");
  console.log("   │ Storage                │ Peer sideDB (local)  │ Arweave (permanent)  │");
  console.log("   │ Availability           │ Peer must be online  │ Always (decentralized)│");
  console.log("   │ Durability             │ Peer backup policy   │ Permanent (200+ yrs) │");
  console.log("   │ Cost                   │ Infrastructure       │ One-time upload fee  │");
  console.log("   │ Integrity anchor       │ Hash on ledger       │ Hash on Solana       │");
  console.log("   │ Cross-jurisdiction     │ Same channel only    │ Any Arweave gateway  │");
  console.log("   └────────────────────────┴──────────────────────┴──────────────────────┘\n");

  // Save report
  const report = {
    case_id: CASE_ID,
    encryption: { algorithm: "X25519-ECDH + AES-256-GCM", plaintextHash: envelope.plaintextHash },
    arweave: { txId: receipt.id, url: arweaveUrl, sizeBytes: uploadSize },
    solana: { txSignature: String(sig), explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet` },
    verification: { retrievalSuccess: true, decryptionSuccess: matches, integrityPassed: matches },
    timestamp: new Date().toISOString(),
  };

  const outDir = path.join(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "arweave-upload-report.json"), JSON.stringify(report, null, 2));
  console.log("Report saved: scripts/output/arweave-upload-report.json");
  console.log("\nDone.");
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
