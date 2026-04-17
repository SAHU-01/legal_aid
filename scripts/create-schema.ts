import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import {
  getCreateCredentialInstruction,
  getCreateSchemaInstruction,
  deriveCredentialPda,
  deriveSchemaPda,
} from "sas-lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

// --- Config ---
const DEVNET_RPC = "https://api.devnet.solana.com";
const CREDENTIAL_NAME = "legal-aid-credential";
const SCHEMA_NAME = "legal-aid-eligibility";
const SCHEMA_DESCRIPTION =
  "Schema for legal aid eligibility attestations: jurisdiction, tier, and expiry";

// Layout bytes from SAS compact layout mapping:
// 12 = String, 8 = i64
const SCHEMA_LAYOUT = new Uint8Array([12, 12, 8]); // jurisdiction(String), eligibility_tier(String), expiry_date(i64)
const FIELD_NAMES = ["jurisdiction", "eligibility_tier", "expiry_date"];

async function sendTx(rpc: any, txMessage: any) {
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const base64Tx = getBase64EncodedWireTransaction(signedTx);
  const sig = await rpc
    .sendTransaction(base64Tx, { encoding: "base64" })
    .send();
  console.log("  Confirming...");
  // Poll for confirmation
  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    const status = await rpc
      .getSignatureStatuses([sig])
      .send();
    const value = status.value[0];
    if (value && (value.confirmationStatus === "confirmed" || value.confirmationStatus === "finalized")) {
      confirmed = true;
      break;
    }
    await new Promise((r) => setTimeout(r, 2000));
  }
  if (!confirmed) {
    console.warn("  Warning: tx not confirmed within timeout");
  }
  return sig;
}

async function main() {
  // 1. Connect to devnet
  const rpc = createSolanaRpc(DEVNET_RPC);

  // 2. Load local keypair
  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey = new Uint8Array(
    JSON.parse(fs.readFileSync(keypairPath, "utf-8"))
  );
  const signer = await createKeyPairSignerFromBytes(secretKey);
  console.log("Authority:", signer.address);

  // 3. Derive credential PDA
  const [credentialAddress] = await deriveCredentialPda({
    authority: signer.address,
    name: CREDENTIAL_NAME,
  });
  console.log("Credential PDA:", credentialAddress);

  // 4. Create credential (issuer) — skip if already exists
  try {
    const createCredentialIx = getCreateCredentialInstruction({
      payer: signer,
      credential: credentialAddress,
      authority: signer,
      name: CREDENTIAL_NAME,
      signers: [signer.address],
    });

    const { value: blockhash1 } = await rpc.getLatestBlockhash().send();

    const credentialTxMsg = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash1, tx),
      (tx) => appendTransactionMessageInstruction(createCredentialIx, tx)
    );

    const credentialSig = await sendTx(rpc, credentialTxMsg);
    console.log("Credential created, tx:", credentialSig);
  } catch (e: any) {
    const msg = e.message || String(e);
    if (msg.includes("already in use") || msg.includes("0x0")) {
      console.log("Credential already exists, skipping creation");
    } else {
      console.log("Credential creation warning (may already exist):", msg);
    }
  }

  // 5. Derive schema PDA
  const [schemaAddress] = await deriveSchemaPda({
    credential: credentialAddress,
    name: SCHEMA_NAME,
    version: 1,
  });
  console.log("Schema PDA:", schemaAddress);

  // 6. Create schema
  const createSchemaIx = getCreateSchemaInstruction({
    payer: signer,
    authority: signer,
    credential: credentialAddress,
    schema: schemaAddress,
    name: SCHEMA_NAME,
    description: SCHEMA_DESCRIPTION,
    layout: SCHEMA_LAYOUT,
    fieldNames: FIELD_NAMES,
  });

  const { value: blockhash2 } = await rpc.getLatestBlockhash().send();

  const schemaTxMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash2, tx),
    (tx) => appendTransactionMessageInstruction(createSchemaIx, tx)
  );

  const signature = await sendTx(rpc, schemaTxMsg);
  console.log("Schema created!");
  console.log("  Schema address:", schemaAddress);
  console.log("  Tx signature:", signature);

  // 7. Save schema address
  const outputPath = path.join(__dirname, "schema-address.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        schemaAddress,
        credentialAddress,
        schemaName: SCHEMA_NAME,
        fieldNames: FIELD_NAMES,
        layout: Array.from(SCHEMA_LAYOUT),
        txSignature: String(signature),
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("Schema address saved to:", outputPath);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
