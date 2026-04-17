import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
} from "@solana/kit";
import {
  fetchMaybeAttestation,
  fetchSchema,
  deserializeAttestationData,
} from "sas-lib";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";

const DEVNET_RPC = "https://api.devnet.solana.com";

interface VerificationResult {
  label: string;
  pass: boolean;
  detail: string;
}

async function main() {
  // 1. Read credential info
  const credInfoPath = path.join(__dirname, "credential-info.json");
  const credInfo = JSON.parse(fs.readFileSync(credInfoPath, "utf-8"));
  const {
    citizenPubkey,
    attestationAddress,
    schemaAddress,
    credentialAddress,
  } = credInfo;

  console.log("=== SAS Credential Verification ===\n");
  console.log("Citizen pubkey:      ", citizenPubkey);
  console.log("Attestation address: ", attestationAddress);
  console.log("Schema address:      ", schemaAddress);
  console.log("Credential address:  ", credentialAddress);
  console.log();

  // 2. Connect to devnet, load issuer keypair for expected-key check
  const rpc = createSolanaRpc(DEVNET_RPC);

  const keypairPath = path.join(os.homedir(), ".config", "solana", "id.json");
  const secretKey = new Uint8Array(
    JSON.parse(fs.readFileSync(keypairPath, "utf-8"))
  );
  const issuer = await createKeyPairSignerFromBytes(secretKey);
  const expectedIssuer = issuer.address;

  // 3. Fetch attestation account
  const results: VerificationResult[] = [];

  const maybeAttestation = await fetchMaybeAttestation(
    rpc,
    attestationAddress
  );

  // Check: attestation exists (not revoked/closed)
  if (!maybeAttestation.exists) {
    results.push({
      label: "Attestation exists",
      pass: false,
      detail: "Account not found — may have been revoked (closed)",
    });
    printReport(results);
    return;
  }

  results.push({
    label: "Attestation exists",
    pass: true,
    detail: "Account found on-chain",
  });

  const attestation = maybeAttestation.data;

  // Check: issuer matches expected government key
  const issuerMatch = attestation.signer === expectedIssuer;
  results.push({
    label: "Issuer matches",
    pass: issuerMatch,
    detail: issuerMatch
      ? `Signer: ${attestation.signer}`
      : `Expected ${expectedIssuer}, got ${attestation.signer}`,
  });

  // Check: credential and schema match
  results.push({
    label: "Credential matches",
    pass: attestation.credential === credentialAddress,
    detail: `Credential: ${attestation.credential}`,
  });
  results.push({
    label: "Schema matches",
    pass: attestation.schema === schemaAddress,
    detail: `Schema: ${attestation.schema}`,
  });

  // Check: nonce matches citizen pubkey
  results.push({
    label: "Nonce matches citizen",
    pass: attestation.nonce === citizenPubkey,
    detail: `Nonce: ${attestation.nonce}`,
  });

  // 4. Fetch schema and deserialize attestation data
  const schema = await fetchSchema(rpc, schemaAddress);
  const decoded = deserializeAttestationData<{
    jurisdiction: string;
    eligibility_tier: string;
    expiry_date: bigint;
  }>(schema.data, Uint8Array.from(attestation.data));

  console.log("--- Decoded attestation data ---");
  console.log("  jurisdiction:     ", decoded.jurisdiction);
  console.log("  eligibility_tier: ", decoded.eligibility_tier);
  console.log(
    "  expiry_date:      ",
    Number(decoded.expiry_date),
    `(${new Date(Number(decoded.expiry_date) * 1000).toISOString()})`
  );
  console.log();

  // Check: jurisdiction == "DE"
  results.push({
    label: 'Jurisdiction is "DE"',
    pass: decoded.jurisdiction === "DE",
    detail: `jurisdiction: "${decoded.jurisdiction}"`,
  });

  // Check: expiry_date is in the future
  const now = Math.floor(Date.now() / 1000);
  const expiryTs = Number(decoded.expiry_date);
  const notExpired = expiryTs > now;
  results.push({
    label: "Not expired",
    pass: notExpired,
    detail: notExpired
      ? `Expires ${new Date(expiryTs * 1000).toISOString()} (${Math.floor((expiryTs - now) / 86400)} days remaining)`
      : `Expired at ${new Date(expiryTs * 1000).toISOString()}`,
  });

  // Check: on-chain expiry field matches
  const onChainExpiry = Number(attestation.expiry);
  results.push({
    label: "On-chain expiry consistent",
    pass: onChainExpiry === expiryTs,
    detail: `Instruction expiry: ${onChainExpiry}, data expiry: ${expiryTs}`,
  });

  printReport(results);
}

function printReport(results: VerificationResult[]) {
  console.log("=== Verification Report ===\n");
  const allPass = results.every((r) => r.pass);

  for (const r of results) {
    const icon = r.pass ? "PASS" : "FAIL";
    console.log(`  [${icon}] ${r.label}`);
    console.log(`         ${r.detail}`);
  }

  console.log();
  if (allPass) {
    console.log("RESULT: ALL CHECKS PASSED");
  } else {
    const failed = results.filter((r) => !r.pass).length;
    console.log(`RESULT: ${failed} CHECK(S) FAILED`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
