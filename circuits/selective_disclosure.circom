pragma circom 2.1.6;

include "node_modules/circomlib/circuits/poseidon.circom";
include "node_modules/circomlib/circuits/comparators.circom";
include "node_modules/circomlib/circuits/mux1.circom";

/**
 * Selective Disclosure Circuit for Legal Aid Credentials
 *
 * Proves:
 *   1. "I know N credential fields that hash to the on-chain commitment root"
 *   2. "Field at index `disclosureIndex` has value `disclosedValue`" (selective reveal)
 *   3. "Field at index `predicateIndex` satisfies a comparison predicate" (range proof)
 *
 * Uses Poseidon hash (snark-friendly) instead of SHA-256.
 * Merkle tree depth = 3 (supports up to 8 credential fields).
 *
 * Public Inputs:
 *   - commitmentRoot: Poseidon Merkle root of all field commitments (stored on-chain)
 *   - disclosedValue: The value being selectively disclosed
 *   - disclosureIndex: Which field index is being disclosed
 *   - predicateValue: Threshold for range predicate (e.g., expiry > now)
 *   - predicateIndex: Which field the predicate applies to
 *   - predicateSatisfied: 1 if predicate holds, 0 otherwise (verifier checks this == 1)
 *   - issuerPubkeyHash: Poseidon hash of the issuer's public key (binding)
 *
 * Private Inputs:
 *   - fieldValues[N_FIELDS]: All credential field values (as field elements)
 *   - fieldSalts[N_FIELDS]: Random salts for each field commitment
 *   - issuerPubkey[2]: Issuer's public key (x, y coordinates or two field elements)
 */

template SelectiveDisclosure(N_FIELDS, TREE_DEPTH) {
    // ─── Public Inputs ──────────────────────────────────────────────
    signal input commitmentRoot;
    signal input disclosedValue;
    signal input disclosureIndex;
    signal input predicateValue;
    signal input predicateIndex;
    signal input predicateSatisfied;
    signal input issuerPubkeyHash;

    // ─── Private Inputs ─────────────────────────────────────────────
    signal input fieldValues[N_FIELDS];
    signal input fieldSalts[N_FIELDS];
    signal input issuerPubkey[2]; // x, y of issuer key

    // ─── Step 1: Verify issuer binding ──────────────────────────────
    // Hash the issuer pubkey and check it matches the public input
    component issuerHasher = Poseidon(2);
    issuerHasher.inputs[0] <== issuerPubkey[0];
    issuerHasher.inputs[1] <== issuerPubkey[1];
    issuerHasher.out === issuerPubkeyHash;

    // ─── Step 2: Compute field commitments ──────────────────────────
    // commitment_i = Poseidon(fieldValue_i, salt_i, issuerPubkeyHash)
    component fieldHashers[N_FIELDS];
    signal commitments[N_FIELDS];

    for (var i = 0; i < N_FIELDS; i++) {
        fieldHashers[i] = Poseidon(3);
        fieldHashers[i].inputs[0] <== fieldValues[i];
        fieldHashers[i].inputs[1] <== fieldSalts[i];
        fieldHashers[i].inputs[2] <== issuerPubkeyHash;
        commitments[i] <== fieldHashers[i].out;
    }

    // ─── Step 3: Build Merkle tree and verify root ──────────────────
    // Pad commitments to 2^TREE_DEPTH leaves (unused leaves = 0)
    var NUM_LEAVES = 1 << TREE_DEPTH; // 2^TREE_DEPTH
    signal leaves[NUM_LEAVES];

    for (var i = 0; i < NUM_LEAVES; i++) {
        if (i < N_FIELDS) {
            leaves[i] <== commitments[i];
        } else {
            leaves[i] <== 0; // padding
        }
    }

    // Compute Merkle tree bottom-up
    // Level 0 = leaves, Level TREE_DEPTH = root
    signal tree[TREE_DEPTH + 1][NUM_LEAVES];

    // Set leaves
    for (var i = 0; i < NUM_LEAVES; i++) {
        tree[0][i] <== leaves[i];
    }

    // Hash pairs up the tree
    component hashNodes[TREE_DEPTH][NUM_LEAVES / 2];
    for (var level = 0; level < TREE_DEPTH; level++) {
        var nodesAtLevel = NUM_LEAVES >> (level + 1);
        for (var i = 0; i < nodesAtLevel; i++) {
            hashNodes[level][i] = Poseidon(2);
            hashNodes[level][i].inputs[0] <== tree[level][2*i];
            hashNodes[level][i].inputs[1] <== tree[level][2*i + 1];
            tree[level + 1][i] <== hashNodes[level][i].out;
        }
        // Zero-fill unused slots at this level
        for (var i = nodesAtLevel; i < NUM_LEAVES; i++) {
            tree[level + 1][i] <== 0;
        }
    }

    // Verify computed root matches public input
    tree[TREE_DEPTH][0] === commitmentRoot;

    // ─── Step 4: Selective disclosure ───────────────────────────────
    // Prove that fieldValues[disclosureIndex] == disclosedValue
    // For each field i: if i == disclosureIndex, then fieldValues[i] must equal disclosedValue.
    // Constraint: IsEqual(disclosureIndex, i) * (fieldValues[i] - disclosedValue) == 0
    component disclosureEq[N_FIELDS];
    signal disclosureMatch[N_FIELDS];

    for (var i = 0; i < N_FIELDS; i++) {
        disclosureEq[i] = IsEqual();
        disclosureEq[i].in[0] <== disclosureIndex;
        disclosureEq[i].in[1] <== i;
        disclosureMatch[i] <== disclosureEq[i].out * (fieldValues[i] - disclosedValue);
        disclosureMatch[i] === 0;
    }

    // ─── Step 5: Predicate proof (range check) ──────────────────────
    // Prove that fieldValues[predicateIndex] > predicateValue
    // (e.g., expiry_date > current_timestamp)

    // Select the predicate field value
    component predEq[N_FIELDS];
    signal predSelected[N_FIELDS];
    signal predicateFieldValue;

    var predSum = 0;
    for (var i = 0; i < N_FIELDS; i++) {
        predEq[i] = IsEqual();
        predEq[i].in[0] <== predicateIndex;
        predEq[i].in[1] <== i;
        predSelected[i] <== predEq[i].out * fieldValues[i];
        predSum += predSelected[i];
    }
    // Note: we use an intermediate signal to avoid non-quadratic
    signal predFieldVal;
    predFieldVal <== predSum;

    // Greater-than comparison: predicateFieldValue > predicateValue
    component greaterThan = GreaterThan(64); // 64-bit comparison (enough for timestamps)
    greaterThan.in[0] <== predFieldVal;
    greaterThan.in[1] <== predicateValue;

    // Constrain: predicateSatisfied must equal the comparison result
    predicateSatisfied === greaterThan.out;
}

// ─── Main Component ─────────────────────────────────────────────────
// 6 credential fields, Merkle tree depth 3 (supports up to 8 fields)
// Fields: jurisdiction, eligibility_tier, expiry_date, applicant_id, case_type, issued_at
component main {public [commitmentRoot, disclosedValue, disclosureIndex, predicateValue, predicateIndex, predicateSatisfied, issuerPubkeyHash]} = SelectiveDisclosure(6, 3);
