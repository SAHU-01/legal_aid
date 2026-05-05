//! On-chain Groth16 proof verification using Solana's alt_bn128 syscalls.
//!
//! This module provides BN254 curve operations and a Groth16 verifier
//! compatible with snarkjs-generated proofs. Uses the same approach as
//! Light Protocol's verifier program.
//!
//! Proof format: 256 bytes (A: G1, B: G2, C: G1)
//! Public inputs: 32 bytes each (BN254 scalar field elements)

use anchor_lang::prelude::*;

/// G1 point on BN254 (64 bytes: 32-byte x, 32-byte y)
#[derive(Clone, Debug)]
pub struct G1Point {
    pub x: [u8; 32],
    pub y: [u8; 32],
}

/// G2 point on BN254 (128 bytes: two 32-byte x coords, two 32-byte y coords)
#[derive(Clone, Debug)]
pub struct G2Point {
    pub x: [[u8; 32]; 2],
    pub y: [[u8; 32]; 2],
}

/// Groth16 proof (256 bytes total)
#[derive(Clone, Debug)]
pub struct Groth16Proof {
    pub a: G1Point,  // 64 bytes
    pub b: G2Point,  // 128 bytes
    pub c: G1Point,  // 64 bytes
}

/// Verification key for the selective disclosure circuit
#[derive(Clone)]
pub struct VerificationKey {
    pub alpha: G1Point,
    pub beta: G2Point,
    pub gamma: G2Point,
    pub delta: G2Point,
    pub ic: &'static [G1Point], // One per public input + 1
}

/// BN254 field modulus (for input validation)
const BN254_MODULUS: [u8; 32] = [
    0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
    0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
    0x97, 0x81, 0x6a, 0x91, 0x68, 0x71, 0xca, 0x8d,
    0x3c, 0x20, 0x8c, 0x16, 0xd8, 0x7c, 0xfd, 0x47,
];

/// alt_bn128 operation codes for the Solana syscall
const ALT_BN128_ADD: u64 = 0;
const ALT_BN128_MUL: u64 = 1;
const ALT_BN128_PAIRING: u64 = 2;

/// Negate a G1 point (flip y coordinate: y' = p - y)
fn negate_g1(point: &G1Point) -> G1Point {
    // BN254 base field prime p
    let p: [u8; 32] = [
        0x30, 0x64, 0x4e, 0x72, 0xe1, 0x31, 0xa0, 0x29,
        0xb8, 0x50, 0x45, 0xb6, 0x81, 0x81, 0x58, 0x5d,
        0x28, 0x33, 0xe8, 0x48, 0x79, 0xb9, 0x70, 0x91,
        0x43, 0xe1, 0xf5, 0x93, 0xf0, 0x00, 0x00, 0x01,
    ];

    // Subtract y from p (p - y)
    let mut neg_y = [0u8; 32];
    let mut borrow: u16 = 0;
    for i in (0..32).rev() {
        let diff = (p[i] as u16) - (point.y[i] as u16) - borrow;
        neg_y[i] = diff as u8;
        borrow = if diff > 255 { 1 } else { 0 };
    }

    G1Point {
        x: point.x,
        y: neg_y,
    }
}

/// Perform G1 scalar multiplication using alt_bn128 syscall
/// Input: 96 bytes (32 x, 32 y, 32 scalar)
/// Output: 64 bytes (32 x, 32 y)
fn g1_mul(point: &G1Point, scalar: &[u8; 32]) -> Result<G1Point> {
    let mut input = [0u8; 96];
    input[0..32].copy_from_slice(&point.x);
    input[32..64].copy_from_slice(&point.y);
    input[64..96].copy_from_slice(scalar);

    let result = sol_alt_bn128(ALT_BN128_MUL, &input)?;

    let mut x = [0u8; 32];
    let mut y = [0u8; 32];
    x.copy_from_slice(&result[0..32]);
    y.copy_from_slice(&result[32..64]);

    Ok(G1Point { x, y })
}

/// Perform G1 point addition using alt_bn128 syscall
/// Input: 128 bytes (64 point1, 64 point2)
/// Output: 64 bytes (result point)
fn g1_add(p1: &G1Point, p2: &G1Point) -> Result<G1Point> {
    let mut input = [0u8; 128];
    input[0..32].copy_from_slice(&p1.x);
    input[32..64].copy_from_slice(&p1.y);
    input[64..96].copy_from_slice(&p2.x);
    input[96..128].copy_from_slice(&p2.y);

    let result = sol_alt_bn128(ALT_BN128_ADD, &input)?;

    let mut x = [0u8; 32];
    let mut y = [0u8; 32];
    x.copy_from_slice(&result[0..32]);
    y.copy_from_slice(&result[32..64]);

    Ok(G1Point { x, y })
}

/// Verify a Groth16 proof against a verification key and public inputs.
///
/// Implements the pairing check:
///   e(A, B) == e(alpha, beta) * e(vk_x, gamma) * e(C, delta)
///
/// Where vk_x = IC[0] + sum(IC[i+1] * public_input[i])
///
/// Returns true if the proof is valid.
pub fn verify_proof(
    vk: &VerificationKey,
    proof: &Groth16Proof,
    public_inputs: &[[u8; 32]],
) -> Result<bool> {
    // Validate number of public inputs
    if public_inputs.len() + 1 != vk.ic.len() {
        msg!("Invalid number of public inputs: expected {}, got {}",
             vk.ic.len() - 1, public_inputs.len());
        return Ok(false);
    }

    // Validate public inputs are in the scalar field
    for (i, input) in public_inputs.iter().enumerate() {
        if !is_valid_scalar(input) {
            msg!("Public input {} is not a valid scalar field element", i);
            return Ok(false);
        }
    }

    // Compute vk_x = IC[0] + IC[1]*input[0] + IC[2]*input[1] + ...
    let mut vk_x = G1Point {
        x: vk.ic[0].x,
        y: vk.ic[0].y,
    };

    for (i, input) in public_inputs.iter().enumerate() {
        let term = g1_mul(&vk.ic[i + 1], input)?;
        vk_x = g1_add(&vk_x, &term)?;
    }

    // Pairing check: e(-A, B) * e(alpha, beta) * e(vk_x, gamma) * e(C, delta) == 1
    // Solana's pairing syscall checks if the product of pairings equals 1
    // Input format: pairs of (G1, G2) points, each 192 bytes
    // 4 pairs = 768 bytes

    let neg_a = negate_g1(&proof.a);

    let mut pairing_input = [0u8; 768];
    let mut offset = 0;

    // Pair 1: (-A, B)
    pairing_input[offset..offset + 32].copy_from_slice(&neg_a.x);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&neg_a.y);
    offset += 32;
    // G2 point: x = (x[1], x[0]), y = (y[1], y[0]) — reversed for alt_bn128
    pairing_input[offset..offset + 32].copy_from_slice(&proof.b.x[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&proof.b.x[0]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&proof.b.y[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&proof.b.y[0]);
    offset += 32;

    // Pair 2: (alpha, beta)
    pairing_input[offset..offset + 32].copy_from_slice(&vk.alpha.x);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.alpha.y);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.beta.x[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.beta.x[0]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.beta.y[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.beta.y[0]);
    offset += 32;

    // Pair 3: (vk_x, gamma)
    pairing_input[offset..offset + 32].copy_from_slice(&vk_x.x);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk_x.y);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.gamma.x[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.gamma.x[0]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.gamma.y[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.gamma.y[0]);
    offset += 32;

    // Pair 4: (C, delta)
    pairing_input[offset..offset + 32].copy_from_slice(&proof.c.x);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&proof.c.y);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.delta.x[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.delta.x[0]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.delta.y[1]);
    offset += 32;
    pairing_input[offset..offset + 32].copy_from_slice(&vk.delta.y[0]);

    // Execute pairing check — returns 1 (true) if valid, 0 if invalid
    let result = sol_alt_bn128(ALT_BN128_PAIRING, &pairing_input)?;

    // The pairing result is a single 32-byte value: 1 = success, 0 = failure
    Ok(result[31] == 1)
}

/// Check if a 32-byte value is a valid BN254 scalar field element (< modulus)
fn is_valid_scalar(value: &[u8; 32]) -> bool {
    for i in 0..32 {
        if value[i] < BN254_MODULUS[i] {
            return true;
        }
        if value[i] > BN254_MODULUS[i] {
            return false;
        }
    }
    false // equal to modulus is not valid
}

/// Wrapper around Solana's alt_bn128 syscall.
/// Uses the raw `sol_alt_bn128_group_op` syscall available since Solana v1.16.
///
/// Operations:
///   0 = ADD (128 bytes input → 64 bytes output)
///   1 = MUL (96 bytes input → 64 bytes output)
///   2 = PAIRING (N*192 bytes input → 32 bytes output)
fn sol_alt_bn128(op: u64, input: &[u8]) -> Result<Vec<u8>> {
    // Determine output size based on operation
    let output_size = match op {
        ALT_BN128_ADD | ALT_BN128_MUL => 64,
        ALT_BN128_PAIRING => 32,
        _ => return Err(error!(crate::LegalAidError::ZkProofVerificationFailed)),
    };

    let mut result = vec![0u8; output_size];

    #[cfg(target_os = "solana")]
    {
        let ret = unsafe {
            solana_define_syscall::definitions::sol_alt_bn128_group_op(
                op,
                input.as_ptr(),
                input.len() as u64,
                result.as_mut_ptr(),
            )
        };
        if ret != 0 {
            msg!("alt_bn128 syscall failed with error code: {}", ret);
            return Err(error!(crate::LegalAidError::ZkProofVerificationFailed));
        }
    }

    #[cfg(not(target_os = "solana"))]
    {
        // Off-chain: return zeros (tests should mock this)
        let _ = (op, input);
        msg!("alt_bn128 syscall not available off-chain");
    }

    Ok(result)
}

/// Parse a Groth16 proof from raw bytes (256 bytes)
/// Format: [A.x(32) | A.y(32) | B.x1(32) | B.x0(32) | B.y1(32) | B.y0(32) | C.x(32) | C.y(32)]
pub fn parse_proof(data: &[u8; 256]) -> Groth16Proof {
    let mut a_x = [0u8; 32];
    let mut a_y = [0u8; 32];
    let mut b_x0 = [0u8; 32];
    let mut b_x1 = [0u8; 32];
    let mut b_y0 = [0u8; 32];
    let mut b_y1 = [0u8; 32];
    let mut c_x = [0u8; 32];
    let mut c_y = [0u8; 32];

    a_x.copy_from_slice(&data[0..32]);
    a_y.copy_from_slice(&data[32..64]);
    b_x0.copy_from_slice(&data[64..96]);
    b_x1.copy_from_slice(&data[96..128]);
    b_y0.copy_from_slice(&data[128..160]);
    b_y1.copy_from_slice(&data[160..192]);
    c_x.copy_from_slice(&data[192..224]);
    c_y.copy_from_slice(&data[224..256]);

    Groth16Proof {
        a: G1Point { x: a_x, y: a_y },
        b: G2Point {
            x: [b_x0, b_x1],
            y: [b_y0, b_y1],
        },
        c: G1Point { x: c_x, y: c_y },
    }
}
