/**
 * Privacy primitives for Adduce — Solana-native alternative to
 * Hyperledger Fabric's Private Data Collections + Aries selective disclosure.
 *
 * Stack:
 *   - X25519 ECDH key agreement  (@noble/curves — already installed)
 *   - AES-256-GCM encryption     (Node crypto — zero deps)
 *   - SHA-256 field commitments   (@noble/hashes — already installed)
 *   - Merkle tree selective disclosure (pure TypeScript)
 *
 * No additional npm packages required.
 */

import { x25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import { bytesToHex, hexToBytes } from "@noble/hashes/utils";
import { createCipheriv, createDecipheriv, randomBytes } from "crypto";

// ─── Key Derivation ──────────────────────────────────────────────────

/**
 * Derive an X25519 encryption keypair from a Solana Ed25519 secret key.
 * Uses the first 32 bytes (private scalar) hashed to produce a
 * deterministic X25519 private key. Same wallet → same encryption key.
 */
export function deriveEncryptionKeypair(ed25519SecretKey: Uint8Array): {
  publicKey: Uint8Array;
  secretKey: Uint8Array;
} {
  // Ed25519 secret key is 64 bytes: [32-byte seed | 32-byte public key]
  const seed = ed25519SecretKey.slice(0, 32);
  // Hash to get a clean X25519 scalar (clamping happens inside x25519)
  const secretKey = sha256(Buffer.concat([seed, Buffer.from("adduce-encryption-v1")]));
  const publicKey = x25519.getPublicKey(secretKey);
  return { publicKey, secretKey };
}

// ─── Document Encryption (X25519 + AES-256-GCM) ─────────────────────

export interface EncryptedEnvelope {
  /** AES-256-GCM ciphertext (hex) */
  ciphertext: string;
  /** 12-byte nonce (hex) */
  nonce: string;
  /** 16-byte auth tag (hex) */
  tag: string;
  /** Sender's ephemeral X25519 public key (hex) — needed for decryption */
  senderEncPubkey: string;
  /** SHA-256 of the ORIGINAL plaintext (hex) — anchored on-chain */
  plaintextHash: string;
  /** SHA-256 of the ciphertext (hex) — for storage integrity */
  ciphertextHash: string;
}

/**
 * Encrypt a document for a specific recipient's wallet.
 *
 * Flow:
 *   1. Derive X25519 keys from both parties' Ed25519 keys
 *   2. X25519 ECDH → shared secret
 *   3. SHA-256(shared secret) → AES-256-GCM key
 *   4. Encrypt document
 *   5. Return envelope with both plaintext hash (for on-chain anchor)
 *      and ciphertext hash (for storage integrity)
 *
 * recipientEncPublicKey: The recipient's X25519 public key (from deriveEncryptionKeypair).
 *   In production, recipients publish their X25519 pubkey on-chain alongside their wallet.
 */
export function encryptDocument(
  document: Buffer,
  recipientEncPublicKey: Uint8Array,
  senderEd25519SecretKey: Uint8Array,
): EncryptedEnvelope {
  const sender = deriveEncryptionKeypair(senderEd25519SecretKey);

  // ECDH shared secret: sender_private x recipient_public
  // Recipient computes the same via: recipient_private x sender_public
  const rawShared = x25519.getSharedSecret(sender.secretKey, recipientEncPublicKey);
  const aesKey = sha256(rawShared); // 32 bytes → AES-256

  // AES-256-GCM
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", aesKey, nonce);
  const ciphertext = Buffer.concat([cipher.update(document), cipher.final()]);
  const tag = cipher.getAuthTag();

  // Hashes
  const plaintextHash = bytesToHex(sha256(document));
  const ciphertextHash = bytesToHex(sha256(ciphertext));

  return {
    ciphertext: ciphertext.toString("hex"),
    nonce: nonce.toString("hex"),
    tag: tag.toString("hex"),
    senderEncPubkey: bytesToHex(sender.publicKey),
    plaintextHash,
    ciphertextHash,
  };
}

/**
 * Decrypt an envelope using the recipient's Ed25519 secret key.
 */
export function decryptDocument(
  envelope: EncryptedEnvelope,
  recipientEd25519SecretKey: Uint8Array,
): Buffer {
  const recipient = deriveEncryptionKeypair(recipientEd25519SecretKey);
  const senderEncPubkey = hexToBytes(envelope.senderEncPubkey);

  // Recreate shared secret
  const rawShared = x25519.getSharedSecret(recipient.secretKey, senderEncPubkey);
  const aesKey = sha256(rawShared);

  // Decrypt
  const decipher = createDecipheriv(
    "aes-256-gcm",
    aesKey,
    Buffer.from(envelope.nonce, "hex"),
  );
  decipher.setAuthTag(Buffer.from(envelope.tag, "hex"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(envelope.ciphertext, "hex")),
    decipher.final(),
  ]);

  // Verify integrity
  const hash = bytesToHex(sha256(plaintext));
  if (hash !== envelope.plaintextHash) {
    throw new Error("Integrity check failed: decrypted hash does not match");
  }

  return plaintext;
}

// ─── Selective Disclosure (Merkle Tree) ──────────────────────────────

export interface FieldCommitment {
  fieldName: string;
  /** SHA-256(fieldName || ":" || fieldValue || ":" || salt) */
  commitment: string;
  salt: string;
}

export interface MerkleProof {
  /** The leaf hash being proved */
  leaf: string;
  /** Sibling hashes along the path to root */
  siblings: string[];
  /** Direction at each level: 0 = leaf is left, 1 = leaf is right */
  directions: number[];
}

/**
 * Create field-level commitments for credential attributes.
 * Each field gets its own salted hash — the verifier only sees
 * commitments until the holder chooses to reveal specific fields.
 */
export function createFieldCommitments(
  fields: Record<string, string>,
): { commitments: FieldCommitment[]; merkleRoot: string } {
  const commitments: FieldCommitment[] = [];

  for (const [fieldName, fieldValue] of Object.entries(fields)) {
    const salt = randomBytes(16).toString("hex");
    const preimage = `${fieldName}:${fieldValue}:${salt}`;
    const commitment = bytesToHex(sha256(Buffer.from(preimage)));
    commitments.push({ fieldName, commitment, salt });
  }

  const merkleRoot = computeMerkleRoot(commitments.map((c) => c.commitment));

  return { commitments, merkleRoot };
}

/**
 * Generate a Merkle proof that a specific field is part of the committed set.
 */
export function generateMerkleProof(
  allCommitments: string[],
  targetIndex: number,
): MerkleProof {
  const leaves = [...allCommitments];
  // Pad to power of 2
  while (leaves.length & (leaves.length - 1)) {
    leaves.push(bytesToHex(sha256(Buffer.from("EMPTY_LEAF"))));
  }

  let currentLevel = leaves;
  const siblings: string[] = [];
  const directions: number[] = [];
  let idx = targetIndex;

  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    const siblingIdx = idx % 2 === 0 ? idx + 1 : idx - 1;

    if (siblingIdx < currentLevel.length) {
      siblings.push(currentLevel[siblingIdx]);
      directions.push(idx % 2 === 0 ? 0 : 1);
    }

    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = currentLevel[i + 1] || left;
      nextLevel.push(bytesToHex(sha256(Buffer.from(left + right))));
    }

    currentLevel = nextLevel;
    idx = Math.floor(idx / 2);
  }

  return {
    leaf: allCommitments[targetIndex],
    siblings,
    directions,
  };
}

/**
 * Verify a Merkle proof against a known root.
 */
export function verifyMerkleProof(
  proof: MerkleProof,
  merkleRoot: string,
): boolean {
  let current = proof.leaf;

  for (let i = 0; i < proof.siblings.length; i++) {
    const sibling = proof.siblings[i];
    const combined =
      proof.directions[i] === 0
        ? current + sibling  // current is left
        : sibling + current; // current is right
    current = bytesToHex(sha256(Buffer.from(combined)));
  }

  return current === merkleRoot;
}

/**
 * Verify that a disclosed field value matches a commitment.
 */
export function verifyFieldDisclosure(
  fieldName: string,
  fieldValue: string,
  salt: string,
  expectedCommitment: string,
): boolean {
  const preimage = `${fieldName}:${fieldValue}:${salt}`;
  const computed = bytesToHex(sha256(Buffer.from(preimage)));
  return computed === expectedCommitment;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function computeMerkleRoot(leaves: string[]): string {
  if (leaves.length === 0) return bytesToHex(sha256(Buffer.from("EMPTY")));

  let level = [...leaves];
  // Pad to power of 2
  while (level.length & (level.length - 1)) {
    level.push(bytesToHex(sha256(Buffer.from("EMPTY_LEAF"))));
  }

  while (level.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < level.length; i += 2) {
      const left = level[i];
      const right = level[i + 1] || left;
      nextLevel.push(bytesToHex(sha256(Buffer.from(left + right))));
    }
    level = nextLevel;
  }

  return level[0];
}
