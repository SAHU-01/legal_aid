/**
 * ZK Selective Disclosure Prover
 *
 * Generates Groth16 proofs for the selective_disclosure circuit using snarkjs.
 * Proofs are formatted for on-chain verification via Solana's alt_bn128 syscall.
 *
 * Architecture:
 *   Circom circuit (Poseidon-based) → snarkjs witness → Groth16 proof → Solana TX
 *
 * This replaces the commitment-based disclosure in privacy.ts with true ZKPs:
 *   OLD: Reveal field value + salt + Merkle proof (verifier sees the value)
 *   NEW: Prove statement about field without revealing it (true zero-knowledge)
 */

import * as snarkjs from "snarkjs";
import { buildPoseidon } from "circomlibjs";
import { readFileSync } from "fs";
import { join } from "path";

// ─── Types ────────────────��─────────────────────────────────────────

export interface CredentialFields {
  /** Jurisdiction code as field element (e.g., hash of "DE") */
  jurisdiction: bigint;
  /** Eligibility tier (1, 2, 3) */
  eligibilityTier: bigint;
  /** Expiry timestamp (unix seconds) */
  expiryDate: bigint;
  /** Applicant ID (first 31 bytes of pubkey as bigint) */
  applicantId: bigint;
  /** Case type code */
  caseType: bigint;
  /** Issued-at timestamp */
  issuedAt: bigint;
}

export interface IssuerKey {
  x: bigint;
  y: bigint;
}

export interface ZkDisclosureInput {
  /** All 6 credential fields */
  fields: CredentialFields;
  /** Random salts for each field (one per field) */
  salts: bigint[];
  /** Issuer's public key (x, y) */
  issuerPubkey: IssuerKey;
  /** Index of field to disclose (0-5) */
  disclosureIndex: number;
  /** Value being disclosed (must match fields[disclosureIndex]) */
  disclosedValue: bigint;
  /** Index of field for predicate check (0-5) */
  predicateIndex: number;
  /** Threshold for predicate: fields[predicateIndex] > predicateValue */
  predicateValue: bigint;
}

export interface ZkProofResult {
  /** Raw proof bytes (256 bytes) for on-chain verification */
  proofBytes: Uint8Array;
  /** Public inputs (7 x 32 bytes) for on-chain verification */
  publicInputs: Uint8Array[];
  /** Human-readable proof components */
  proof: {
    a: [string, string];
    b: [[string, string], [string, string]];
    c: [string, string];
  };
  /** Public signals from the circuit */
  publicSignals: string[];
  /** Commitment root (matches on-chain) */
  commitmentRoot: bigint;
}

// ─── Circuit Paths ──────────────────────────────────────────────────

const CIRCUITS_DIR = join(__dirname, "../../circuits");
const BUILD_DIR = join(CIRCUITS_DIR, "build");
const WASM_PATH = join(BUILD_DIR, "selective_disclosure_js/selective_disclosure.wasm");
const ZKEY_PATH = join(BUILD_DIR, "selective_disclosure_final.zkey");
const VK_PATH = join(BUILD_DIR, "verification_key.json");

// ─── Poseidon Hash ──────────────────────────────────────────────────

let poseidonInstance: any = null;

async function getPoseidon() {
  if (!poseidonInstance) {
    poseidonInstance = await buildPoseidon();
  }
  return poseidonInstance;
}

/**
 * Compute Poseidon hash (matches the circom circuit's Poseidon)
 */
export async function poseidonHash(inputs: bigint[]): Promise<bigint> {
  const poseidon = await getPoseidon();
  const hash = poseidon(inputs.map((x) => x.toString()));
  return BigInt(poseidon.F.toString(hash));
}

// ─── Commitment & Merkle Tree ─────────────��─────────────────────────

/**
 * Compute a field commitment: Poseidon(value, salt, issuerPubkeyHash)
 * This matches the circuit's constraint.
 */
export async function computeFieldCommitment(
  value: bigint,
  salt: bigint,
  issuerPubkeyHash: bigint,
): Promise<bigint> {
  return poseidonHash([value, salt, issuerPubkeyHash]);
}

/**
 * Compute the Poseidon Merkle root for the credential commitments.
 * Tree depth = 3, padded to 8 leaves.
 */
export async function computeCommitmentRoot(
  fields: CredentialFields,
  salts: bigint[],
  issuerPubkey: IssuerKey,
): Promise<bigint> {
  const issuerHash = await poseidonHash([issuerPubkey.x, issuerPubkey.y]);

  const fieldValues = [
    fields.jurisdiction,
    fields.eligibilityTier,
    fields.expiryDate,
    fields.applicantId,
    fields.caseType,
    fields.issuedAt,
  ];

  // Compute leaf commitments
  const leaves: bigint[] = [];
  for (let i = 0; i < 6; i++) {
    leaves.push(await computeFieldCommitment(fieldValues[i], salts[i], issuerHash));
  }
  // Pad to 8 (2^3)
  while (leaves.length < 8) {
    leaves.push(0n);
  }

  // Build Merkle tree bottom-up using Poseidon(left, right)
  let level = leaves;
  while (level.length > 1) {
    const nextLevel: bigint[] = [];
    for (let i = 0; i < level.length; i += 2) {
      nextLevel.push(await poseidonHash([level[i], level[i + 1]]));
    }
    level = nextLevel;
  }

  return level[0];
}

// ─── Proof Generation ─────────────────��─────────────────────────────

/**
 * Generate a Groth16 proof for selective credential disclosure.
 *
 * @param input - Credential fields, salts, issuer key, and disclosure parameters
 * @returns Proof formatted for Solana on-chain verification
 */
export async function generateDisclosureProof(
  input: ZkDisclosureInput,
): Promise<ZkProofResult> {
  const issuerPubkeyHash = await poseidonHash([input.issuerPubkey.x, input.issuerPubkey.y]);

  const fieldValues = [
    input.fields.jurisdiction,
    input.fields.eligibilityTier,
    input.fields.expiryDate,
    input.fields.applicantId,
    input.fields.caseType,
    input.fields.issuedAt,
  ];

  // Compute commitment root (for verification)
  const commitmentRoot = await computeCommitmentRoot(
    input.fields,
    input.salts,
    input.issuerPubkey,
  );

  // Determine if predicate is satisfied
  const predicateFieldValue = fieldValues[input.predicateIndex];
  const predicateSatisfied = predicateFieldValue > input.predicateValue ? 1n : 0n;

  // Build circuit witness input
  const circuitInput = {
    // Public inputs
    commitmentRoot: commitmentRoot.toString(),
    disclosedValue: input.disclosedValue.toString(),
    disclosureIndex: input.disclosureIndex.toString(),
    predicateValue: input.predicateValue.toString(),
    predicateIndex: input.predicateIndex.toString(),
    predicateSatisfied: predicateSatisfied.toString(),
    issuerPubkeyHash: issuerPubkeyHash.toString(),
    // Private inputs
    fieldValues: fieldValues.map((v) => v.toString()),
    fieldSalts: input.salts.map((s) => s.toString()),
    issuerPubkey: [input.issuerPubkey.x.toString(), input.issuerPubkey.y.toString()],
  };

  console.log("🔐 Generating ZK proof...");
  console.log(`   Circuit: selective_disclosure (6 fields, depth 3)`);
  console.log(`   Disclosing: field[${input.disclosureIndex}] = ${input.disclosedValue}`);
  console.log(`   Predicate: field[${input.predicateIndex}] > ${input.predicateValue} → ${predicateSatisfied === 1n}`);

  // Generate the proof using snarkjs
  const { proof, publicSignals } = await snarkjs.groth16.fullProve(
    circuitInput,
    WASM_PATH,
    ZKEY_PATH,
  );

  console.log("   ✓ Proof generated");

  // Format proof for Solana (256 bytes)
  const proofBytes = formatProofForSolana(proof);

  // Format public inputs (7 x 32 bytes, big-endian)
  const publicInputs = publicSignals.map((signal: string) => {
    return bigintToBytes32(BigInt(signal));
  });

  return {
    proofBytes,
    publicInputs,
    proof: {
      a: [proof.pi_a[0], proof.pi_a[1]],
      b: [
        [proof.pi_b[0][0], proof.pi_b[0][1]],
        [proof.pi_b[1][0], proof.pi_b[1][1]],
      ],
      c: [proof.pi_c[0], proof.pi_c[1]],
    },
    publicSignals,
    commitmentRoot,
  };
}

/**
 * Verify a proof locally (for testing before submitting on-chain)
 */
export async function verifyProofLocally(
  proof: ZkProofResult,
): Promise<boolean> {
  const vk = JSON.parse(readFileSync(VK_PATH, "utf-8"));

  const snarkProof = {
    pi_a: [...proof.proof.a, "1"],
    pi_b: [...proof.proof.b, [["1", "0"], ["0", "1"]]],
    pi_c: [...proof.proof.c, "1"],
    protocol: "groth16",
    curve: "bn128",
  };

  return snarkjs.groth16.verify(vk, proof.publicSignals, snarkProof);
}

// ─── Solana Formatting ──────────────────────────────────────────────

/**
 * Format a snarkjs Groth16 proof into 256 bytes for Solana's alt_bn128 verifier.
 *
 * Layout:
 *   [0..32]    A.x (big-endian)
 *   [32..64]   A.y (big-endian)
 *   [64..96]   B.x[0] (big-endian)
 *   [96..128]  B.x[1] (big-endian)
 *   [128..160] B.y[0] (big-endian)
 *   [160..192] B.y[1] (big-endian)
 *   [192..224] C.x (big-endian)
 *   [224..256] C.y (big-endian)
 */
function formatProofForSolana(proof: any): Uint8Array {
  const result = new Uint8Array(256);

  // A point (G1)
  result.set(bigintToBytes32(BigInt(proof.pi_a[0])), 0);
  result.set(bigintToBytes32(BigInt(proof.pi_a[1])), 32);

  // B point (G2) — note: snarkjs uses [[x0, x1], [y0, y1]] ordering
  result.set(bigintToBytes32(BigInt(proof.pi_b[0][0])), 64);
  result.set(bigintToBytes32(BigInt(proof.pi_b[0][1])), 96);
  result.set(bigintToBytes32(BigInt(proof.pi_b[1][0])), 128);
  result.set(bigintToBytes32(BigInt(proof.pi_b[1][1])), 160);

  // C point (G1)
  result.set(bigintToBytes32(BigInt(proof.pi_c[0])), 192);
  result.set(bigintToBytes32(BigInt(proof.pi_c[1])), 224);

  return result;
}

/**
 * Convert a bigint to a 32-byte big-endian Uint8Array
 */
function bigintToBytes32(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/**
 * Convert a 32-byte big-endian Uint8Array back to bigint
 */
export function bytes32ToBigint(bytes: Uint8Array): bigint {
  let hex = "0x";
  for (const b of bytes) {
    hex += b.toString(16).padStart(2, "0");
  }
  return BigInt(hex);
}

// ─── Utility: Generate Random Salts ─────────────────────────────────

/**
 * Generate random salts for credential fields.
 * Uses crypto.randomBytes for security.
 */
export function generateSalts(count: number): bigint[] {
  const { randomBytes } = require("crypto");
  const salts: bigint[] = [];
  for (let i = 0; i < count; i++) {
    // Generate 31 bytes (to stay within BN254 scalar field)
    const buf = randomBytes(31);
    salts.push(BigInt("0x" + buf.toString("hex")));
  }
  return salts;
}

// ─── Utility: Encode String as Field Element ────────────────────────

/**
 * Encode a short string (max 31 bytes) as a BN254 field element.
 * Used for jurisdiction codes, tier names, etc.
 */
export function stringToField(s: string): bigint {
  const buf = Buffer.from(s, "utf-8");
  if (buf.length > 31) {
    throw new Error(`String too long for field element (max 31 bytes): "${s}"`);
  }
  return BigInt("0x" + buf.toString("hex"));
}

/**
 * Decode a field element back to a string.
 */
export function fieldToString(field: bigint): string {
  const hex = field.toString(16);
  // Pad to even length
  const padded = hex.length % 2 === 0 ? hex : "0" + hex;
  return Buffer.from(padded, "hex").toString("utf-8").replace(/\0/g, "");
}

// ─── Utility: Compute On-Chain Commitment Root ──────────────────────

/**
 * Compute the commitment root that should be stored on-chain.
 * Call this during credential issuance, store result in case_file.commitment_root.
 */
export async function computeOnChainRoot(
  fields: CredentialFields,
  salts: bigint[],
  issuerPubkey: IssuerKey,
): Promise<Uint8Array> {
  const root = await computeCommitmentRoot(fields, salts, issuerPubkey);
  return bigintToBytes32(root);
}
