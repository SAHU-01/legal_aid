/**
 * Test script: generates a proof and verifies it locally.
 * Run from /circuits directory: node test_proof.js
 */
const snarkjs = require("snarkjs");
const { buildPoseidon } = require("circomlibjs");
const path = require("path");

const WASM = path.join(__dirname, "build/selective_disclosure_js/selective_disclosure.wasm");
const ZKEY = path.join(__dirname, "build/selective_disclosure_final.zkey");
const VK = path.join(__dirname, "build/verification_key.json");

async function main() {
  console.log("Building Poseidon hash...");
  const poseidon = await buildPoseidon();
  const F = poseidon.F;

  // Helper
  function poseidonHash(inputs) {
    return BigInt(F.toString(poseidon(inputs.map(x => x.toString()))));
  }

  // ─── Credential Fields ─────────────────────────────────────────
  const fieldValues = [
    BigInt("0x4445"),         // "DE" (jurisdiction)
    2n,                       // eligibility tier
    1777000000n,              // expiry (far future)
    BigInt("0x1234abcd"),     // applicant ID
    BigInt("0x434956494c"),   // "CIVIL" (case type)
    1714000000n,              // issued_at
  ];

  // Random salts
  const fieldSalts = [
    111n, 222n, 333n, 444n, 555n, 666n,
  ];

  // Issuer public key
  const issuerPubkey = [BigInt("12345678901234567890"), BigInt("98765432109876543210")];

  // ─── Compute Expected Values ───────────────────────────────────
  const issuerPubkeyHash = poseidonHash(issuerPubkey);
  console.log("Issuer pubkey hash:", issuerPubkeyHash.toString());

  // Compute commitments
  const commitments = [];
  for (let i = 0; i < 6; i++) {
    commitments.push(poseidonHash([fieldValues[i], fieldSalts[i], issuerPubkeyHash]));
  }
  // Pad to 8
  while (commitments.length < 8) commitments.push(0n);

  // Build Merkle tree
  let level = [...commitments];
  while (level.length > 1) {
    const next = [];
    for (let i = 0; i < level.length; i += 2) {
      next.push(poseidonHash([level[i], level[i + 1]]));
    }
    level = next;
  }
  const commitmentRoot = level[0];
  console.log("Commitment root:", commitmentRoot.toString());

  // ─── Disclosure Parameters ─────────────────────────────────────
  const disclosureIndex = 0;  // disclose jurisdiction
  const disclosedValue = fieldValues[0]; // "DE"
  const predicateIndex = 2;   // check expiry
  const predicateValue = 1700000000n; // must be > this (in the past)
  const predicateSatisfied = fieldValues[predicateIndex] > predicateValue ? 1n : 0n;

  console.log("Predicate satisfied:", predicateSatisfied.toString());

  // ─── Generate Proof ────────────────────────────────────────────
  const input = {
    commitmentRoot: commitmentRoot.toString(),
    disclosedValue: disclosedValue.toString(),
    disclosureIndex: disclosureIndex.toString(),
    predicateValue: predicateValue.toString(),
    predicateIndex: predicateIndex.toString(),
    predicateSatisfied: predicateSatisfied.toString(),
    issuerPubkeyHash: issuerPubkeyHash.toString(),
    fieldValues: fieldValues.map(v => v.toString()),
    fieldSalts: fieldSalts.map(s => s.toString()),
    issuerPubkey: issuerPubkey.map(p => p.toString()),
  };

  console.log("\nGenerating proof...");
  const startTime = Date.now();
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(input, WASM, ZKEY);
  const proofTime = Date.now() - startTime;
  console.log(`Proof generated in ${proofTime}ms`);

  // ─── Verify Proof ──────────────────────────────────────────────
  console.log("\nVerifying proof...");
  const vk = require(VK);
  const valid = await snarkjs.groth16.verify(vk, publicSignals, proof);
  console.log(`Verification result: ${valid ? "✅ VALID" : "❌ INVALID"}`);

  // ─── Show Proof Size ──────────────────────────────────────────
  console.log("\nProof components:");
  console.log(`  A (G1): [${proof.pi_a[0].slice(0, 20)}..., ${proof.pi_a[1].slice(0, 20)}...]`);
  console.log(`  B (G2): [[${proof.pi_b[0][0].slice(0, 16)}...], [${proof.pi_b[1][0].slice(0, 16)}...]]`);
  console.log(`  C (G1): [${proof.pi_c[0].slice(0, 20)}..., ${proof.pi_c[1].slice(0, 20)}...]`);
  console.log(`  Public signals: ${publicSignals.length}`);
  console.log(`  On-chain proof size: 256 bytes`);
  console.log(`  On-chain public inputs: ${publicSignals.length * 32} bytes`);
  console.log(`  Total on-chain data: ${256 + publicSignals.length * 32} bytes`);

  if (!valid) process.exit(1);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
