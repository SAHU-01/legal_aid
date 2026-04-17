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
} from "@solana/kit";
import {
  getCreateAttestationInstruction,
  deriveAttestationPda,
  fetchSchema,
  serializeAttestationData,
} from "sas-lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEVNET_RPC = "https://api.devnet.solana.com";

async function sendTx(rpc: any, txMessage: any) {
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const base64Tx = getBase64EncodedWireTransaction(signedTx);
  const sig = await rpc
    .sendTransaction(base64Tx, { encoding: "base64" })
    .send();
  console.log("  Confirming...");
  let confirmed = false;
  for (let i = 0; i < 30; i++) {
    const status = await rpc.getSignatureStatuses([sig]).send();
    const value = status.value[0];
    if (
      value &&
      (value.confirmationStatus === "confirmed" ||
        value.confirmationStatus === "finalized")
    ) {
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
  // 1. Read schema info
  const schemaInfoPath = path.join(__dirname, "schema-address.json");
  const schemaInfo = JSON.parse(fs.readFileSync(schemaInfoPath, "utf-8"));
  const { schemaAddress, credentialAddress } = schemaInfo;
  console.log("Schema address:", schemaAddress);
  console.log("Credential address:", credentialAddress);

  // 2. Connect to devnet, load issuer keypair
  const rpc = createSolanaRpc(DEVNET_RPC);

  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey = new Uint8Array(
    JSON.parse(fs.readFileSync(keypairPath, "utf-8"))
  );
  const issuer = await createKeyPairSignerFromBytes(secretKey);
  console.log("Issuer (authority):", issuer.address);

  // 3. Generate a fresh keypair to simulate the citizen
  const citizen = await generateKeyPairSigner();
  console.log("Citizen pubkey:", citizen.address);

  // 4. Fetch the on-chain schema to get layout for data serialization
  const schema = await fetchSchema(rpc, schemaAddress);
  console.log("Schema fetched:", schemaInfo.schemaName);

  // 5. Serialize attestation data
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const attestationData = serializeAttestationData(schema.data, {
    jurisdiction: "DE",
    eligibility_tier: "TIER_1",
    expiry_date: BigInt(oneYearFromNow),
  });

  // 6. Use citizen's address as the nonce (associates attestation with their wallet)
  const nonce = citizen.address;

  // 7. Derive attestation PDA
  const [attestationAddress] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce,
  });
  console.log("Attestation PDA:", attestationAddress);

  // 8. Build and send createAttestation tx
  const createAttestationIx = getCreateAttestationInstruction({
    payer: issuer,
    authority: issuer,
    credential: credentialAddress,
    schema: schemaAddress,
    attestation: attestationAddress,
    nonce,
    data: attestationData,
    expiry: BigInt(oneYearFromNow),
  });

  const { value: blockhash } = await rpc.getLatestBlockhash().send();

  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(issuer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(createAttestationIx, tx)
  );

  const signature = await sendTx(rpc, txMsg);

  console.log("\nAttestation issued!");
  console.log("  Citizen pubkey:", citizen.address);
  console.log("  Attestation PDA:", attestationAddress);
  console.log("  Tx signature:", signature);
  console.log("  Expiry:", new Date(oneYearFromNow * 1000).toISOString());

  // 9. Save credential info
  const outputPath = path.join(__dirname, "credential-info.json");
  fs.writeFileSync(
    outputPath,
    JSON.stringify(
      {
        citizenPubkey: citizen.address,
        attestationAddress,
        schemaAddress,
        credentialAddress,
        jurisdiction: "DE",
        eligibilityTier: "TIER_1",
        expiryDate: oneYearFromNow,
        txSignature: String(signature),
        createdAt: new Date().toISOString(),
      },
      null,
      2
    )
  );
  console.log("Credential info saved to:", outputPath);
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
