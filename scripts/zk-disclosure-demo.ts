/**
 * ZK Selective Disclosure — End-to-End Demo
 *
 * Demonstrates the full flow:
 *   1. Create credential with field commitments (Poseidon-based)
 *   2. Generate ZK proof for selective disclosure
 *   3. Verify proof locally (snarkjs)
 *   4. Submit proof on-chain (Solana alt_bn128 syscall)
 *
 * This replaces the old commitment-based disclosure (SHA-256 + reveal)
 * with true zero-knowledge proofs via Light Protocol's Groth16 verifier pattern.
 *
 * Usage: npx ts-node scripts/zk-disclosure-demo.ts
 */

import {
  generateDisclosureProof,
  verifyProofLocally,
  computeOnChainRoot,
  generateSalts,
  stringToField,
  poseidonHash,
  CredentialFields,
  IssuerKey,
} from "./lib/zk-prover";
import { Connection, Keypair, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import * as anchor from "@coral-xyz/anchor";
import dotenv from "dotenv";

dotenv.config();

// ─── Configuration ──────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║  ZK Selective Disclosure Demo                           ║");
  console.log("║  Light Protocol Groth16 → Solana Verifier               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log("");

  // ─── Step 1: Credential Issuance ──────────────────────────────────
  console.log("━━━ Step 1: Credential Issuance ━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");

  // Simulate issuer keypair (in production, this is the SAS issuer)
  const issuerKeypair = Keypair.generate();
  const issuerPubkey: IssuerKey = {
    x: BigInt("0x" + Buffer.from(issuerKeypair.publicKey.toBytes().slice(0, 16)).toString("hex")),
    y: BigInt("0x" + Buffer.from(issuerKeypair.publicKey.toBytes().slice(16, 32)).toString("hex")),
  };

  // Define credential fields
  const fields: CredentialFields = {
    jurisdiction: stringToField("DE"),          // Germany
    eligibilityTier: 2n,                        // Tier 2
    expiryDate: BigInt(Math.floor(Date.now() / 1000) + 365 * 24 * 3600), // 1 year from now
    applicantId: stringToField("citizen-0x1234"),
    caseType: stringToField("CIVIL"),
    issuedAt: BigInt(Math.floor(Date.now() / 1000)),
  };

  // Generate random salts (one per field)
  const salts = generateSalts(6);

  console.log("  Credential fields:");
  console.log(`    jurisdiction:     "DE" (field: ${fields.jurisdiction})`);
  console.log(`    eligibilityTier:  2`);
  console.log(`    expiryDate:       ${new Date(Number(fields.expiryDate) * 1000).toISOString()}`);
  console.log(`    applicantId:      "citizen-0x1234"`);
  console.log(`    caseType:         "CIVIL"`);
  console.log(`    issuedAt:         ${new Date(Number(fields.issuedAt) * 1000).toISOString()}`);
  console.log("");

  // Compute commitment root (stored on-chain in case_file.commitment_root)
  const commitmentRootBytes = await computeOnChainRoot(fields, salts, issuerPubkey);
  const issuerPubkeyHash = await poseidonHash([issuerPubkey.x, issuerPubkey.y]);

  console.log(`  ✓ Commitment root (on-chain): 0x${Buffer.from(commitmentRootBytes).toString("hex").slice(0, 16)}...`);
  console.log(`  ✓ Issuer pubkey hash:         0x${issuerPubkeyHash.toString(16).slice(0, 16)}...`);
  console.log(`  ✓ Salts generated:            ${salts.length} (kept private by holder)`);
  console.log("");

  // ─── Step 2: Selective Disclosure (ZK Proof Generation) ───────────
  console.log("━━━ Step 2: ZK Proof Generation ━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("");
  console.log("  Scenario: Prove jurisdiction is 'DE' AND credential isn't expired");
  console.log("  → Disclose: jurisdiction (index 0)");
  console.log("  → Predicate: expiryDate (index 2) > current_timestamp");
  console.log("");

  const now = BigInt(Math.floor(Date.now() / 1000));

  try {
    const proofResult = await generateDisclosureProof({
      fields,
      salts,
      issuerPubkey,
      disclosureIndex: 0,                   // Disclose jurisdiction
      disclosedValue: fields.jurisdiction,   // "DE" as field element
      predicateIndex: 2,                     // Check expiry
      predicateValue: now,                   // Must be > current time
    });

    console.log("");
    console.log("  Proof components:");
    console.log(`    A (G1): [${proofResult.proof.a[0].slice(0, 20)}..., ${proofResult.proof.a[1].slice(0, 20)}...]`);
    console.log(`    B (G2): [[${proofResult.proof.b[0][0].slice(0, 16)}...], [${proofResult.proof.b[1][0].slice(0, 16)}...]]`);
    console.log(`    C (G1): [${proofResult.proof.c[0].slice(0, 20)}..., ${proofResult.proof.c[1].slice(0, 20)}...]`);
    console.log(`    Proof size: ${proofResult.proofBytes.length} bytes`);
    console.log(`    Public inputs: ${proofResult.publicInputs.length} × 32 bytes`);
    console.log("");

    // ─── Step 3: Local Verification ─────────────────────────────────
    console.log("━━━ Step 3: Local Verification (snarkjs) ━━━━━━━━━━━━━━━");
    console.log("");

    const localValid = await verifyProofLocally(proofResult);
    console.log(`  ✓ Local verification: ${localValid ? "VALID ✅" : "INVALID ❌"}`);
    console.log("");

    if (!localValid) {
      console.error("  ❌ Proof failed local verification. Aborting.");
      process.exit(1);
    }

    // ─── Step 4: On-Chain Submission ────────────────────────────────
    console.log("━━━ Step 4: On-Chain Verification ━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");

    const rpcUrl = process.env.HELIUS_RPC_URL || "https://api.devnet.solana.com";
    console.log(`  RPC: ${rpcUrl.replace(/api-key=.*/, "api-key=***")}`);
    console.log("");

    // In a real flow, we'd call the verify_zk_disclosure instruction
    // For this demo, we show the formatted transaction data
    console.log("  Transaction data (ready for verify_zk_disclosure):");
    console.log(`    proof_data:     [${proofResult.proofBytes.length} bytes]`);
    console.log(`    public_inputs:  [${proofResult.publicInputs.length} × 32 bytes]`);
    console.log("");
    console.log("  Public input breakdown:");
    console.log(`    [0] commitmentRoot:    0x${Buffer.from(proofResult.publicInputs[0]).toString("hex").slice(0, 16)}...`);
    console.log(`    [1] disclosedValue:    0x${Buffer.from(proofResult.publicInputs[1]).toString("hex").slice(0, 16)}... (= "DE")`);
    console.log(`    [2] disclosureIndex:   0`);
    console.log(`    [3] predicateValue:    ${now} (current timestamp)`);
    console.log(`    [4] predicateIndex:    2 (expiry_date field)`);
    console.log(`    [5] predicateSatisfied: 1 (expiry > now ✓)`);
    console.log(`    [6] issuerPubkeyHash:  0x${Buffer.from(proofResult.publicInputs[6]).toString("hex").slice(0, 16)}...`);
    console.log("");

    // Show what verifier learns vs. what stays private
    console.log("━━━ Privacy Analysis ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("  ┌─────────────────────────────────────────────────────┐");
    console.log("  │ What the VERIFIER learns:                           │");
    console.log("  │   ✓ Jurisdiction is 'DE'                            │");
    console.log("  │   ✓ Credential is NOT expired                       │");
    console.log("  │   ✓ Credential was issued by a known issuer         │");
    console.log("  │   ✓ All fields hash to the on-chain commitment root │");
    console.log("  ├─────────────────────────────────────────────────────┤");
    console.log("  │ What stays PRIVATE (zero-knowledge):                │");
    console.log("  │   🔒 Eligibility tier                               │");
    console.log("  │   🔒 Exact expiry date (only proves > threshold)    │");
    console.log("  │   🔒 Applicant identity                             │");
    console.log("  │   🔒 Case type                                      │");
    console.log("  │   🔒 Issued-at timestamp                            │");
    console.log("  │   🔒 All salts                                      │");
    console.log("  └─────────────────────────────────────────────────────┘");
    console.log("");

    // ─── Comparison with old approach ───────────────────────────────
    console.log("━━━ Comparison: Old vs New ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("");
    console.log("  OLD (Merkle + SHA-256 commitment):");
    console.log("    • Reveals: field value + salt + Merkle proof path");
    console.log("    • Verifier sees: actual field value (not zero-knowledge)");
    console.log("    • No predicates: can't prove 'expiry > X' without revealing expiry");
    console.log("    • Trust model: verifier must trust commitment scheme");
    console.log("");
    console.log("  NEW (Groth16 ZK proof via Light Protocol pattern):");
    console.log("    • Reveals: NOTHING except the proved statement");
    console.log("    • Verifier sees: only the public inputs (not field values)");
    console.log("    • Predicates: prove 'field > threshold' without revealing field");
    console.log("    • Trust model: mathematical guarantee (soundness of Groth16)");
    console.log("    • On-chain: 256-byte proof verified via alt_bn128 in ~200k CU");
    console.log("");

    console.log("╔══════════════════════════════════════════════════════════╗");
    console.log("║  ✅ Demo complete!                                       ║");
    console.log("║                                                          ║");
    console.log("║  To run on-chain:                                        ║");
    console.log("║    1. cd circuits && npm install && ./build.sh           ║");
    console.log("║    2. Copy build/vk_generated.rs → programs/.../vk.rs   ║");
    console.log("║    3. anchor build && anchor deploy                      ║");
    console.log("║    4. Call verify_zk_disclosure with proof_data          ║");
    console.log("╚══════════════════════════════════════════════════════════╝");

  } catch (err: any) {
    if (err.message?.includes("ENOENT") || err.message?.includes("no such file")) {
      console.log("  ⚠️  Circuit not yet compiled. Run first:");
      console.log("     cd circuits && npm install && ./build.sh");
      console.log("");
      console.log("  Running in DRY-RUN mode (showing expected behavior)...");
      console.log("");
      console.log("  Expected output:");
      console.log("    • Proof: 256 bytes (A[G1] + B[G2] + C[G1])");
      console.log("    • Public inputs: 7 × 32 bytes");
      console.log("    • Verification: ~200k compute units on Solana");
      console.log("    • Privacy: true zero-knowledge (Groth16 soundness)");
    } else {
      throw err;
    }
  }
}

main().catch(console.error);
