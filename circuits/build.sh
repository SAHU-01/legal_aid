#!/bin/bash
set -e

# ─── ZK Circuit Build & Trusted Setup ───────────────────────────────
# Compiles the selective disclosure circuit, runs Powers of Tau,
# generates proving/verification keys, and exports Solana-compatible VK.

CIRCUIT_NAME="selective_disclosure"
BUILD_DIR="./build"
PTAU_SIZE=14  # 2^14 = 16384 constraints (sufficient for our circuit)

echo "╔══════════════════════════════════════════════════════════╗"
echo "║  Adduce ZK Circuit Builder                              ║"
echo "║  Light Protocol Groth16 → Solana Verifier               ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ─── Prerequisites ───────────────────────────────────────────────────
if ! command -v circom &> /dev/null; then
    echo "❌ circom not found. Install: https://docs.circom.io/getting-started/installation/"
    echo "   curl --proto '=https' --tlsv1.2 https://sh.rustup.rs -sSf | sh"
    echo "   git clone https://github.com/iden3/circom.git && cd circom && cargo build --release"
    echo "   cargo install --path circom"
    exit 1
fi

if ! command -v snarkjs &> /dev/null; then
    echo "⚠️  snarkjs not in PATH, using npx..."
    SNARKJS="npx snarkjs"
else
    SNARKJS="snarkjs"
fi

# ─── Install circomlib ───────────────────────────────────────────────
if [ ! -d "node_modules/circomlib" ]; then
    echo "📦 Installing circomlib..."
    npm install
fi

# ─── Compile Circuit ─────────────────────────────────────────────────
mkdir -p $BUILD_DIR

echo ""
echo "🔧 [1/6] Compiling circuit..."
circom $CIRCUIT_NAME.circom \
    --r1cs \
    --wasm \
    --sym \
    --output $BUILD_DIR

echo "   ✓ R1CS: $BUILD_DIR/$CIRCUIT_NAME.r1cs"
echo "   ✓ WASM: $BUILD_DIR/${CIRCUIT_NAME}_js/${CIRCUIT_NAME}.wasm"
echo "   ✓ Symbols: $BUILD_DIR/$CIRCUIT_NAME.sym"

# Print circuit info
echo ""
echo "📊 Circuit info:"
$SNARKJS r1cs info $BUILD_DIR/$CIRCUIT_NAME.r1cs

# ─── Powers of Tau (Phase 1) ─────────────────────────────────────────
echo ""
echo "🏗️  [2/6] Powers of Tau ceremony (phase 1)..."

if [ ! -f "$BUILD_DIR/pot${PTAU_SIZE}_final.ptau" ]; then
    # Start ceremony
    $SNARKJS powersoftau new bn128 $PTAU_SIZE $BUILD_DIR/pot${PTAU_SIZE}_0000.ptau -v

    # Contribute entropy (in production, use multiple parties)
    $SNARKJS powersoftau contribute $BUILD_DIR/pot${PTAU_SIZE}_0000.ptau \
        $BUILD_DIR/pot${PTAU_SIZE}_0001.ptau \
        --name="Adduce Legal Aid contribution" -v -e="$(head -c 64 /dev/urandom | base64)"

    # Finalize phase 1
    $SNARKJS powersoftau prepare phase2 $BUILD_DIR/pot${PTAU_SIZE}_0001.ptau \
        $BUILD_DIR/pot${PTAU_SIZE}_final.ptau -v

    echo "   ✓ Phase 1 complete: $BUILD_DIR/pot${PTAU_SIZE}_final.ptau"
else
    echo "   ✓ Using existing ptau: $BUILD_DIR/pot${PTAU_SIZE}_final.ptau"
fi

# ─── Circuit-specific Setup (Phase 2) ────────────────────────────────
echo ""
echo "🔐 [3/6] Circuit-specific setup (phase 2)..."

$SNARKJS groth16 setup $BUILD_DIR/$CIRCUIT_NAME.r1cs \
    $BUILD_DIR/pot${PTAU_SIZE}_final.ptau \
    $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey

# Contribute to phase 2
$SNARKJS zkey contribute $BUILD_DIR/${CIRCUIT_NAME}_0000.zkey \
    $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
    --name="Adduce phase2 contribution" -v -e="$(head -c 64 /dev/urandom | base64)"

echo "   ✓ Final zkey: $BUILD_DIR/${CIRCUIT_NAME}_final.zkey"

# ─── Export Verification Key ─────────────────────────────────────────
echo ""
echo "📤 [4/6] Exporting verification key..."

$SNARKJS zkey export verificationkey $BUILD_DIR/${CIRCUIT_NAME}_final.zkey \
    $BUILD_DIR/verification_key.json

echo "   ✓ Verification key: $BUILD_DIR/verification_key.json"

# ─── Export Solana Verifier ──────────────────────────────────────────
echo ""
echo "⚡ [5/6] Generating Solana-compatible verification key..."

# Extract the key components for on-chain use
node -e "
const vk = require('./$BUILD_DIR/verification_key.json');
const fs = require('fs');

// Convert verification key to format needed by groth16-solana
// BN254 curve points as byte arrays
const solanaVk = {
    // Alpha point (G1): [x, y]
    alpha: {
        x: BigInt(vk.vk_alpha_1[0]).toString(16).padStart(64, '0'),
        y: BigInt(vk.vk_alpha_1[1]).toString(16).padStart(64, '0'),
    },
    // Beta point (G2): [[x0, x1], [y0, y1]]
    beta: {
        x: [
            BigInt(vk.vk_beta_2[0][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_beta_2[0][1]).toString(16).padStart(64, '0'),
        ],
        y: [
            BigInt(vk.vk_beta_2[1][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_beta_2[1][1]).toString(16).padStart(64, '0'),
        ],
    },
    // Gamma point (G2)
    gamma: {
        x: [
            BigInt(vk.vk_gamma_2[0][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_gamma_2[0][1]).toString(16).padStart(64, '0'),
        ],
        y: [
            BigInt(vk.vk_gamma_2[1][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_gamma_2[1][1]).toString(16).padStart(64, '0'),
        ],
    },
    // Delta point (G2)
    delta: {
        x: [
            BigInt(vk.vk_delta_2[0][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_delta_2[0][1]).toString(16).padStart(64, '0'),
        ],
        y: [
            BigInt(vk.vk_delta_2[1][0]).toString(16).padStart(64, '0'),
            BigInt(vk.vk_delta_2[1][1]).toString(16).padStart(64, '0'),
        ],
    },
    // IC points (G1) — one per public input + 1
    ic: vk.IC.map(p => ({
        x: BigInt(p[0]).toString(16).padStart(64, '0'),
        y: BigInt(p[1]).toString(16).padStart(64, '0'),
    })),
    nPublicInputs: vk.nPublic,
};

fs.writeFileSync(
    './$BUILD_DIR/solana_vk.json',
    JSON.stringify(solanaVk, null, 2)
);

// Also export as Rust byte arrays for embedding in the program
let rustCode = '// Auto-generated verification key for selective_disclosure circuit\n';
rustCode += '// DO NOT EDIT — regenerate with: cd circuits && ./build.sh\n\n';
rustCode += 'use crate::groth16::G1Point;\nuse crate::groth16::G2Point;\n\n';

// Helper to convert hex to Rust byte array
function hexToRustBytes(hex) {
    const bytes = [];
    for (let i = 0; i < hex.length; i += 2) {
        bytes.push('0x' + hex.slice(i, i + 2));
    }
    return '[' + bytes.join(', ') + ']';
}

rustCode += 'pub const VK_ALPHA: G1Point = G1Point {\n';
rustCode += '    x: ' + hexToRustBytes(solanaVk.alpha.x) + ',\n';
rustCode += '    y: ' + hexToRustBytes(solanaVk.alpha.y) + ',\n';
rustCode += '};\n\n';

rustCode += 'pub const VK_BETA: G2Point = G2Point {\n';
rustCode += '    x: [' + hexToRustBytes(solanaVk.beta.x[0]) + ', ' + hexToRustBytes(solanaVk.beta.x[1]) + '],\n';
rustCode += '    y: [' + hexToRustBytes(solanaVk.beta.y[0]) + ', ' + hexToRustBytes(solanaVk.beta.y[1]) + '],\n';
rustCode += '};\n\n';

rustCode += 'pub const VK_GAMMA: G2Point = G2Point {\n';
rustCode += '    x: [' + hexToRustBytes(solanaVk.gamma.x[0]) + ', ' + hexToRustBytes(solanaVk.gamma.x[1]) + '],\n';
rustCode += '    y: [' + hexToRustBytes(solanaVk.gamma.y[0]) + ', ' + hexToRustBytes(solanaVk.gamma.y[1]) + '],\n';
rustCode += '};\n\n';

rustCode += 'pub const VK_DELTA: G2Point = G2Point {\n';
rustCode += '    x: [' + hexToRustBytes(solanaVk.delta.x[0]) + ', ' + hexToRustBytes(solanaVk.delta.x[1]) + '],\n';
rustCode += '    y: [' + hexToRustBytes(solanaVk.delta.y[0]) + ', ' + hexToRustBytes(solanaVk.delta.y[1]) + '],\n';
rustCode += '};\n\n';

rustCode += 'pub const VK_IC: [G1Point; ' + solanaVk.ic.length + '] = [\n';
for (const ic of solanaVk.ic) {
    rustCode += '    G1Point { x: ' + hexToRustBytes(ic.x) + ', y: ' + hexToRustBytes(ic.y) + ' },\n';
}
rustCode += '];\n\n';

rustCode += 'pub const N_PUBLIC_INPUTS: usize = ' + solanaVk.nPublicInputs + ';\n';

fs.writeFileSync('./$BUILD_DIR/vk_generated.rs', rustCode);

console.log('   ✓ Solana VK: $BUILD_DIR/solana_vk.json');
console.log('   ✓ Rust VK:   $BUILD_DIR/vk_generated.rs');
console.log('   ✓ Public inputs: ' + solanaVk.nPublicInputs);
console.log('   ✓ IC points: ' + solanaVk.ic.length);
"

# ─── Verify Setup ───────────────────────────────────────────────────
echo ""
echo "✅ [6/6] Verifying setup..."
$SNARKJS zkey verify $BUILD_DIR/$CIRCUIT_NAME.r1cs \
    $BUILD_DIR/pot${PTAU_SIZE}_final.ptau \
    $BUILD_DIR/${CIRCUIT_NAME}_final.zkey

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║  ✅ Build complete!                                      ║"
echo "║                                                          ║"
echo "║  Artifacts:                                              ║"
echo "║    • Circuit WASM: build/${CIRCUIT_NAME}_js/             ║"
echo "║    • Proving key:  build/${CIRCUIT_NAME}_final.zkey      ║"
echo "║    • Verify key:   build/verification_key.json           ║"
echo "║    • Solana VK:    build/solana_vk.json                  ║"
echo "║    • Rust VK:      build/vk_generated.rs                 ║"
echo "║                                                          ║"
echo "║  Next: copy build/vk_generated.rs to program/src/        ║"
echo "╚══════════════════════════════════════════════════════════╝"
