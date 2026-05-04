/**
 * Credential Revocation — Adduce Privacy Layer
 *
 * Demonstrates what Fabric does with chaincode-based auto-revocation,
 * rebuilt on Solana using SAS closeAttestation:
 *
 *   1. Issue a SAS credential to a citizen
 *   2. Verify it exists on-chain
 *   3. Revoke it (closeAttestation — closes the PDA, reclaims rent)
 *   4. Verify it no longer exists — subsequent verification fails
 *
 * Fabric equivalent: chaincode triggers revocation when applicant status changes.
 * Solana: authority signs closeAttestation. Instant. No consortium propagation delay.
 */

import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  generateKeyPairSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
  address,
} from "@solana/kit";
import {
  getCreateAttestationInstruction,
  getCloseAttestationInstruction,
  deriveAttestationPda,
  fetchSchema,
  fetchMaybeAttestation,
  serializeAttestationData,
} from "sas-lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEVNET_RPC = "https://api.devnet.solana.com";

async function sendTx(rpc: any, txMessage: any): Promise<string> {
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const base64Tx = getBase64EncodedWireTransaction(signedTx);
  const sig = await rpc.sendTransaction(base64Tx, { encoding: "base64" }).send();
  for (let i = 0; i < 30; i++) {
    const status = await rpc.getSignatureStatuses([sig]).send();
    const value = status.value[0];
    if (value && (value.confirmationStatus === "confirmed" || value.confirmationStatus === "finalized")) break;
    await new Promise((r) => setTimeout(r, 2000));
  }
  return String(sig);
}

async function main() {
  console.log("╔══════════════════════════════════════════════════════════════╗");
  console.log("║  ADDUCE — Credential Revocation                            ║");
  console.log("║  Solana alternative to Fabric chaincode revocation          ║");
  console.log("╚══════════════════════════════════════════════════════════════╝\n");

  // Load schema info
  const schemaInfoPath = path.join(__dirname, "schema-address.json");
  const schemaInfo = JSON.parse(fs.readFileSync(schemaInfoPath, "utf-8"));
  const { schemaAddress, credentialAddress } = schemaInfo;

  const rpc = createSolanaRpc(DEVNET_RPC);
  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey = new Uint8Array(JSON.parse(fs.readFileSync(keypairPath, "utf-8")));
  const issuer = await createKeyPairSignerFromBytes(secretKey);

  console.log("Issuer:", issuer.address);
  console.log("Schema:", schemaAddress);
  console.log("Credential:", credentialAddress);

  // ── Step 1: Issue a credential ────────────────────────────────────

  console.log("\n1. ISSUING CREDENTIAL");
  const citizen = await generateKeyPairSigner();
  console.log("   Citizen:", citizen.address);

  const schema = await fetchSchema(rpc, address(schemaAddress));
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const attestationData = serializeAttestationData(schema.data, {
    jurisdiction: "DE",
    eligibility_tier: "TIER_1",
    expiry_date: BigInt(oneYearFromNow),
  });

  const [attestationAddress] = await deriveAttestationPda({
    credential: address(credentialAddress),
    schema: address(schemaAddress),
    nonce: citizen.address,
  });

  const createIx = getCreateAttestationInstruction({
    payer: issuer,
    authority: issuer,
    credential: address(credentialAddress),
    schema: address(schemaAddress),
    attestation: attestationAddress,
    nonce: citizen.address,
    data: attestationData,
    expiry: BigInt(oneYearFromNow),
  });

  let { value: blockhash } = await rpc.getLatestBlockhash().send();
  let txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(issuer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(createIx, tx),
  );

  const issueSig = await sendTx(rpc, txMsg);
  console.log("   Tx:", issueSig);
  console.log("   PDA:", attestationAddress);
  console.log("   Explorer: https://explorer.solana.com/tx/" + issueSig + "?cluster=devnet");

  // ── Step 2: Verify credential exists ──────────────────────────────

  console.log("\n2. VERIFYING CREDENTIAL EXISTS");
  const before = await fetchMaybeAttestation(rpc, attestationAddress);
  console.log("   Exists:", before.exists);
  if (before.exists) {
    console.log("   Data length:", before.data.data.length, "bytes");
    console.log("   Status: ACTIVE");
  }

  // ── Step 3: Revoke (close attestation) ────────────────────────────

  console.log("\n3. REVOKING CREDENTIAL (closeAttestation)");
  console.log("   Scenario: Applicant got a job, no longer eligible for legal aid.");

  const closeIx = getCloseAttestationInstruction({
    payer: issuer,
    authority: issuer,
    credential: address(credentialAddress),
    schema: address(schemaAddress),
    attestation: attestationAddress,
  });

  ({ value: blockhash } = await rpc.getLatestBlockhash().send());
  txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(issuer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(closeIx, tx),
  );

  const revokeSig = await sendTx(rpc, txMsg);
  console.log("   Tx:", revokeSig);
  console.log("   Explorer: https://explorer.solana.com/tx/" + revokeSig + "?cluster=devnet");
  console.log("   Status: REVOKED (PDA closed, rent reclaimed)");

  // ── Step 4: Verify credential is gone ─────────────────────────────

  console.log("\n4. VERIFYING CREDENTIAL IS REVOKED");
  // Small delay for RPC to catch up
  await new Promise((r) => setTimeout(r, 3000));
  const after = await fetchMaybeAttestation(rpc, attestationAddress);
  console.log("   Exists:", after.exists);
  console.log("   Verification would fail:", !after.exists ? "YES (correct)" : "NO (error!)");

  // ── Comparison ────────────────────────────────────────────────────

  console.log("\n5. COMPARISON WITH FABRIC");
  console.log("   ┌──────────────────────┬──────────────────────┬──────────────────────┐");
  console.log("   │ Feature              │ Fabric               │ Adduce/Solana         │");
  console.log("   ├──────────────────────┼──────────────────────┼──────────────────────┤");
  console.log("   │ Revocation trigger   │ Chaincode event      │ Authority signs tx    │");
  console.log("   │ Propagation          │ All peers (seconds)  │ Instant (~400ms)      │");
  console.log("   │ Verification after   │ Query channel        │ Single RPC call       │");
  console.log("   │ Rent recovery        │ No (data persists)   │ Yes (SOL reclaimed)   │");
  console.log("   │ Cross-jurisdiction   │ Same channel only    │ Any RPC endpoint      │");
  console.log("   └──────────────────────┴──────────────────────┴──────────────────────┘\n");

  // Save report
  const report = {
    issuance: { tx: issueSig, citizen: String(citizen.address), attestation: String(attestationAddress) },
    revocation: { tx: revokeSig, credentialExistsAfter: after.exists },
    timestamp: new Date().toISOString(),
  };
  const outDir = path.join(__dirname, "output");
  fs.mkdirSync(outDir, { recursive: true });
  fs.writeFileSync(path.join(outDir, "revocation-report.json"), JSON.stringify(report, null, 2));
  console.log("Report saved: scripts/output/revocation-report.json");
  console.log("\nDone.");
}

main().catch((err) => { console.error("Error:", err); process.exit(1); });
