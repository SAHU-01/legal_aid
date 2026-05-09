/**
 * Document Integrity Proof Anchoring via Arweave/Irys — Adduce Privacy Layer
 *
 * Corrected architecture:
 *   1. Encrypt document (X25519 + AES-256-GCM)
 *   2. Store encrypted envelope on government-certified infrastructure (NOT Arweave)
 *   3. Upload ONLY integrity proof (hashes + timestamps) to Arweave via Irys
 *   4. Anchor plaintext hash + Arweave proof URL on Solana
 *
 * Why NOT upload encrypted documents to Arweave:
 *   - GDPR Article 17: Arweave is permanent, cannot comply with right to erasure
 *   - Harvest-now-decrypt-later: X25519 is not quantum-resistant
 *   - Procurement: Arweave has no BSI C5 / SecNumCloud certification
 *
 * Arweave's role: permanent proof-of-existence (hashes only)
 * Document storage: government infrastructure (deletable per retention policy)
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

  // ── Step 2: Store encrypted envelope on government infrastructure ──

  console.log("2. STORING ENCRYPTED DOCUMENT (GOVERNMENT INFRASTRUCTURE)");
  const outDir = path.join(__dirname, "output", "gov-storage");
  fs.mkdirSync(outDir, { recursive: true });
  const envelopePath = path.join(outDir, `${CASE_ID}-envelope.json`);
  fs.writeFileSync(envelopePath, JSON.stringify(envelope, null, 2));
  console.log("   Stored at:", envelopePath);
  console.log("   Note: In production, this goes to BundesCloud / GovCloud / national DMS");
  console.log("   Encrypted envelope is DELETABLE per retention policy.\n");

  // ── Step 3: Upload PROOF ONLY to Arweave via Irys ─────────────────

  console.log("3. ANCHORING INTEGRITY PROOF ON ARWEAVE VIA IRYS");
  console.log("   Uploading ONLY hashes — NOT the encrypted document");
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

  // Build proof payload — hashes only, no document content
  const proofPayload = JSON.stringify({
    protocol: "adduce-v1",
    type: "integrity_proof",
    case_id: CASE_ID,
    plaintext_hash: envelope.plaintextHash,
    ciphertext_hash: envelope.ciphertextHash,
    encryption: "x25519-aes256gcm",
    timestamp: Math.floor(Date.now() / 1000),
  });

  const uploadSize = Buffer.byteLength(proofPayload);
  const price = await irys.getPrice(uploadSize);
  console.log("   Proof size:  ", uploadSize, "bytes");
  console.log("   Cost:        ", irys.utils.fromAtomic(price).toString(), "SOL");

  if (irysBalance < price) {
    console.log("   Funding Irys node...");
    const fundAmount = price + price; // 2x for safety
    const fundTx = await irys.fund(fundAmount);
    console.log("   Fund tx:", fundTx.id);
  }

  // Upload proof only — no encrypted document, no PII
  console.log("   Uploading integrity proof (hashes only)...");
  const tags = [
    { name: "Content-Type", value: "application/json" },
    { name: "App-Name", value: "Adduce" },
    { name: "App-Version", value: "1.0" },
    { name: "Type", value: "integrity-proof" },
    { name: "Case-ID", value: CASE_ID },
    { name: "Plaintext-Hash", value: envelope.plaintextHash },
  ];

  const receipt = await irys.upload(proofPayload, { tags });
  const arweaveUrl = `https://gateway.irys.xyz/${receipt.id}`;

  console.log("   Arweave TX ID:", receipt.id);
  console.log("   Arweave URL:  ", arweaveUrl);
  console.log("   Content: Hashes + timestamp ONLY (no encrypted document)");
  console.log("   Status: Permanent proof-of-existence anchored.\n");

  // ── Step 4: Anchor on Solana ──────────────────────────────────────

  console.log("4. ANCHORING ON SOLANA");
  const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

  const MEMO_PROGRAM_ID = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

  const anchorPayload = {
    protocol: "adduce-v1",
    type: "integrity_proof_anchor",
    case_id: CASE_ID,
    plaintext_hash: envelope.plaintextHash,
    ciphertext_hash: envelope.ciphertextHash,
    arweave_proof_tx: receipt.id,
    arweave_proof_url: arweaveUrl,
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

  // ── Step 5: Verify decryption from gov storage + proof from Arweave

  console.log("5. VERIFYING DECRYPTION (GOV STORAGE) + PROOF (ARWEAVE)");

  // Lawyer retrieves encrypted document from government infrastructure
  console.log("   Reading encrypted document from government storage...");
  const storedEnvelope = JSON.parse(fs.readFileSync(envelopePath, "utf-8"));
  console.log("   Source:", envelopePath);

  const decrypted = decryptDocument(storedEnvelope, lawyerKeypair.secretKey);
  const matches = decrypted.toString("utf-8") === SAMPLE_DOCUMENT;

  console.log("   Decryption:      ", matches ? "SUCCESS" : "FAILED");
  console.log("   Integrity check: ", matches ? "PASSED" : "FAILED");

  // Verify proof from Arweave matches document hash
  console.log("   Fetching integrity proof from Arweave...");
  const response = await fetch(arweaveUrl);
  const proof = await response.json();
  const proofMatches = proof.plaintext_hash === envelope.plaintextHash;
  console.log("   Arweave proof hash matches document: ", proofMatches ? "PASS" : "FAIL");
  console.log("   Document preview:");
  console.log("   " + decrypted.toString("utf-8").split("\n").slice(0, 3).join("\n   "));
  console.log("   ...\n");

  // ── Summary ───────────────────────────────────────────────────────

  console.log("6. CORRECTED STORAGE ARCHITECTURE");
  console.log("   ┌────────────────────────┬──────────────────────────────────────────┐");
  console.log("   │ Component              │ Where + Why                              │");
  console.log("   ├────────────────────────┼──────────────────────────────────────────┤");
  console.log("   │ Encrypted documents    │ Gov infrastructure (deletable, certified)│");
  console.log("   │ Integrity proofs       │ Arweave via Irys (permanent, $0.004)    │");
  console.log("   │ Document hashes        │ Solana (on-chain, tamper-proof)          │");
  console.log("   │ Audit logs             │ Light Protocol (compressed, permanent)   │");
  console.log("   │ Credentials            │ SAS attestation PDA (revocable)          │");
  console.log("   ├────────────────────────┼──────────────────────────────────────────┤");
  console.log("   │ NOT on Arweave         │ Encrypted docs, PII, ciphertext blobs   │");
  console.log("   │ NOT on Solana          │ Personal data, document content          │");
  console.log("   └────────────────────────┴──────────────────────────────────────────┘\n");

  // Save report
  const report = {
    case_id: CASE_ID,
    encryption: { algorithm: "X25519-ECDH + AES-256-GCM", plaintextHash: envelope.plaintextHash },
    govStorage: { path: envelopePath, deletable: true },
    arweaveProof: { txId: receipt.id, url: arweaveUrl, type: "integrity_proof", sizeBytes: uploadSize },
    solana: { txSignature: String(sig), explorer: `https://explorer.solana.com/tx/${sig}?cluster=devnet` },
    verification: { decryptionSuccess: matches, integrityPassed: matches, proofMatches },
    timestamp: new Date().toISOString(),
  };

  const reportDir = path.join(__dirname, "output");
  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(path.join(reportDir, "arweave-upload-report.json"), JSON.stringify(report, null, 2));
  console.log("Report saved: scripts/output/arweave-upload-report.json");
  console.log("\nDone.");
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
