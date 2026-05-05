# Adduce — Issue. Prove. Settle.

A plug-in for government legal aid systems that digitizes the eligibility certificate on Solana. The court issues a cryptographic credential. The holder proves eligibility with a zero-knowledge proof. The lawyer settles payment in 400 milliseconds. No personal data exposed. No consortium required. No paper.

## Architecture: Three Pillars

The protocol is organized around one core lifecycle: **Issue → Hold → Prove → Settle → Revoke**. Every component serves this lifecycle.

### Credential Issuance & Lifecycle

The Berechtigungsschein (legal aid eligibility certificate) is the single artifact that crosses institutional boundaries. In the legacy system, it's a paper document issued by one authority, presented to another, and verified by phone. In Adduce, it becomes a cryptographically signed on-chain attestation with a full lifecycle:

**1. Issuance.** The court authority (Sozialamt or Agentur für Arbeit) calls the Solana Attestation Service (SAS) to create an on-chain credential. The SAS program writes an immutable PDA containing: the citizen's public key (nonce binding), the credential schema (jurisdiction + eligibility_tier + expiry_date), the issuer's signature, and an expiry timestamp. Simultaneously, a Poseidon commitment root of all 6 credential fields is computed and stored — this enables ZK selective disclosure later. No personal data is written to the ledger; only cryptographic commitments and public keys.

**2. Holding.** The credential lives on-chain as a Solana account owned by the SAS program. Unlike Hyperledger Aries where credentials are stored in a mobile wallet (off-chain), SAS credentials are publicly discoverable but privacy-preserving — the commitment root hides field values behind Poseidon hashes. Crucially, the credential survives issuing-server downtime: because the attestation PDA exists on the Solana ledger, verification works even if the municipal office that issued it goes offline permanently.

**3. Selective Disclosure (ZK Proof).** When the credential holder needs to prove eligibility — e.g., "my jurisdiction is DE and my credential isn't expired" — they generate a 256-byte Groth16 zero-knowledge proof off-chain. The custom Circom circuit proves knowledge of the private fields that hash to the on-chain commitment root, without revealing those fields to the verifier. The on-chain `verify_zk_disclosure` instruction checks the proof using Solana's native BN254 pairing (same curve as Light Protocol and Ethereum ZK rollups). The verifier learns only the proved statement — nothing else.

**4. Revocation.** If a citizen's eligibility changes (e.g., they gain employment), the issuing authority deletes the SAS attestation account. Revocation is instant and global — the credential ceases to exist on-chain. Every downstream instruction (`anchor_document`, `close_case`) re-checks credential liveness before proceeding. There is no window of abuse: the moment the account is deleted, all verification fails.

**Three Actors, One Flow:**
```
Court Authority          Citizen                    Lawyer
      |                     |                         |
      |-- Issues SAS ------>| (credential on-chain)   |
      |                     |                         |
      |-- Opens Case ------>|                         |
      |                     |                         |
      |                     |-- ZK proof of --------->| (jurisdiction + not expired)
      |                     |   eligibility           |
      |                     |                         |
      |                     |                         |-- Anchors Document
      |                     |                         |
      |-- Closes Case ----->|                         |
      |                     |                         |
      |                     |          x402 verifies proof + liveness
      |                     |                         |<-- USDC Payment
      |                     |                         |
      | (if eligibility changes mid-case)             |
      |-- Revokes credential (deletes PDA) --------->X (all verification fails)
```

### Supporting Infrastructure

**Case Management (Anchor).** An on-chain program manages the full lifecycle of a legal aid case: opening, credential linking, document submission, closure, and payment confirmation. Every state transition is a Solana transaction — an immutable audit trail. The program enforces role separation: authority opens cases, reviewer links credentials and closes cases, payer marks paid.

**Document Integrity (Light Protocol).** Case documents are hashed and stored using ZK-compressed state via Light Protocol at ~98.8% lower cost than standard on-chain storage. The hash proves document integrity without storing the document itself.

**Payment Gateway (x402).** When a case is closed, the payment endpoint verifies the lawyer's credential (via ZK proof or direct SAS check) before releasing USDC. Payment only flows when: credential is valid AND unrevoked, case is closed, and lawyer matches the case record.

**Automation Agent.** A polling agent bridges legacy systems to the blockchain — scans for closed cases, creates compressed audit logs, executes USDC transfers, and marks cases as paid without human intervention.

### Comparison with Hyperledger Fabric / IBM Blockchain

| Concern | IBM Hyperledger (Bavaria) | Adduce (Solana) |
|---------|--------------------------|-----------------|
| **Credential storage** | Off-chain wallet (Aries) | On-chain PDA (SAS) — survives issuer downtime |
| **Privacy mechanism** | Private Data Collections (access control) | ZK proofs (mathematical guarantee — GDPR by cryptography, not policy) |
| **Selective disclosure** | CL signatures via Aries agent (~500 bytes) | Groth16 circuit via alt_bn128 (**256 bytes**) |
| **Revocation** | Registry update + non-revocation proof | Account deletion — instant, global, no proof needed |
| **Verification** | Requires Indy ledger access + Aries agent | Single Solana RPC call or on-chain instruction |
| **Cross-border** | Requires inter-ministerial consortium | Native — any Solana node, any jurisdiction |
| **Infrastructure** | IBM Cloud + Kubernetes + Fabric peers + Ordering nodes | Public Solana validators (no private infrastructure) |
| **Cost per credential** | $0.10–1.00 (Indy fees + infra) | **$0.001–0.004** (Solana rent) |
| **Consortium requirement** | Yes (Fabric is permissioned) | No (public chain, permissioned at application layer) |

## Live on Devnet

| Resource | Address |
|----------|---------|
| Legal Aid Program | [`3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV`](https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet) |
| SAS Program | [`22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`](https://explorer.solana.com/address/22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG?cluster=devnet) |
| SAS Schema | [`7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid`](https://explorer.solana.com/address/7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid?cluster=devnet) |

## Quick Start

**Prerequisites:** Node 22+, Rust, Solana CLI, Anchor 0.30+

```bash
# 1. Clone and install
git clone <repo-url> && cd legal-aid-plugin
npm install

# 2. Configure environment
cp .env.example .env
# Edit .env — add your Helius API key

# 3. Build and deploy the Anchor program
anchor build
anchor deploy --provider.cluster devnet

# 4. Start the frontend
cd app && npm run dev

# 5. Open http://localhost:3000 and connect Phantom wallet (set to devnet)
```

## Run the E2E Demo

The full pipeline script runs every component end-to-end on devnet with no mocks:

```bash
npx ts-node scripts/e2e-full-pipeline.ts
```

This executes: credential issuance, case opening, document anchoring, compressed logging, case closure, USDC payment, and final verification — then outputs a full report with Solana Explorer links for every transaction.

## Tech Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Smart Contracts | Anchor 0.32 / Rust | On-chain case lifecycle, credential linking, ZK verification |
| ZK Circuits | Circom 2.2 / snarkjs / Groth16 | Selective disclosure & predicate proofs (BN254) |
| On-Chain Verifier | `sol_alt_bn128_group_op` syscall | Groth16 proof verification (~200k CU) |
| Identity | Solana Attestation Service (SAS) | Government-issued lawyer credentials |
| Compression | Light Protocol + Photon Indexer | ZK-compressed document logs at 98.8% cost savings |
| Payments | x402 Protocol v2 | Credential-gated USDC disbursement |
| Frontend | Next.js 16 / React 19 / Tailwind 4 | Lawyer dashboard with wallet integration |
| RPC | Helius | Devnet RPC with built-in Photon indexer |
| Wallet | Solana Wallet Adapter | Phantom, Solflare, and other Solana wallets |

## Project Structure

```
legal-aid-plugin/
  programs/legal-aid/         Anchor program (Rust)
    src/
      lib.rs                    7 instructions: initialize, open_case, link_credential, anchor_document, close_case, mark_paid, verify_zk_disclosure
      groth16.rs                On-chain Groth16 verifier (BN254 pairing via alt_bn128 syscall)
      vk.rs                     Auto-generated verification key (from trusted setup ceremony)
  circuits/                   ZK Selective Disclosure (Circom + snarkjs)
    selective_disclosure.circom Custom Groth16 circuit (6 fields, depth-3 Merkle, Poseidon hash)
    build.sh                    Compile circuit + Powers of Tau + phase 2 setup
    test_proof.js               Generate & verify test proof locally
    build/                      Compiled artifacts (WASM, R1CS, zkey, verification key)
  app/                        Next.js 16 frontend
    src/app/
      page.tsx                  Lawyer dashboard
      api/claim-payment/        x402 payment endpoint with SAS verification
  scripts/                    Automation and testing
    lib/
      privacy.ts                X25519+AES-256-GCM encryption, Merkle selective disclosure
      zk-prover.ts              Groth16 proof generation (snarkjs), Poseidon commitments, Solana formatting
      connection.ts             Helius RPC setup
    zk-disclosure-demo.ts       Full ZK pipeline: credential → proof → verify (replaces commitment-based disclosure)
    e2e-credential-pipeline.ts  Full 8-step lifecycle: open → credential → link → encrypt → anchor → close → paid
    selective-verify.ts         Merkle-based disclosure demo + Aries comparison
    encrypt-and-anchor.ts       X25519+AES-256-GCM document encryption + hash anchoring
    agent.ts                    Production workflow agent
  tests/                      Anchor integration tests
  target/idl/                 Generated IDL and TypeScript types
```

## Cost Efficiency

Using Light Protocol's ZK compression, document storage costs drop from ~1,566,960 lamports per case (standard PDA) to ~16,000 lamports (compressed state) — a 98.8% reduction. At 100,000 cases per year, this saves approximately $22,000 in on-chain storage costs.

## Scripts

| Script | Purpose |
|--------|---------|
| `zk-disclosure-demo.ts` | ZK selective disclosure pipeline: credential → Groth16 proof → on-chain verify |
| `e2e-full-pipeline.ts` | Complete 10-step end-to-end demo with verification and report generation |
| `selective-verify.ts` | Merkle-based selective disclosure demo + Hyperledger Aries comparison |
| `encrypt-and-anchor.ts` | X25519+AES-256-GCM document encryption + Solana hash anchoring |
| `agent.ts` | Production automation agent — polls for closed cases, compresses, pays, marks paid |
| `create-test-cases.ts` | Creates sample cases on devnet for agent testing |
| `create-schema.ts` | Deploys the SAS credential schema to devnet |
| `issue-credential.ts` | Issues a SAS Berechtigungsschein to a wallet |
| `verify-credential.ts` | Fetches and verifies a SAS credential on devnet |
| `revoke-credential.ts` | SAS credential revocation demo |
| `test-payment-with-credential.ts` | Integration test for SAS + x402 payment flow |
| `anchor-document-compressed.ts` | Anchors a document hash using Light Protocol compression |
| `cost-comparison.ts` | Compares standard PDA vs. compressed storage costs |
| `query-compressed.ts` | Queries and validates compressed state via Photon indexer |

## ZK Selective Disclosure

The protocol implements true zero-knowledge credential verification using Groth16 proofs, following Light Protocol's verifier pattern on the BN254 curve.

### How It Works

```
Credential Holder                           On-Chain Verifier
       |                                           |
       |-- Has: 6 private fields + salts           |
       |                                           |
       |   Runs Circom circuit (off-chain)         |
       |   → Generates 256-byte Groth16 proof      |
       |                                           |
       |-- Submits: proof + 7 public inputs ------>|
       |                                           |
       |              Verifier checks:             |
       |              • commitmentRoot matches PDA |
       |              • predicateSatisfied == 1     |
       |              • Groth16 pairing valid       |
       |                                           |
       |<-- Emits: ZkDisclosureVerified event -----|
```

### What the Verifier Learns vs. What Stays Private

| Verifier Learns | Stays Private (ZK) |
|----------------|-------------------|
| Disclosed field value (e.g., jurisdiction = "DE") | All other field values |
| Predicate result (e.g., "not expired" = true) | Exact expiry date |
| Credential issuer hash | Applicant identity |
| Commitment root matches on-chain state | All salts |

### Comparison with Hyperledger Aries AnonCreds

| Feature | Aries (CL Signatures) | Adduce (Groth16) |
|---------|----------------------|-----------------|
| Proof size | ~500 bytes | **256 bytes** |
| Selective disclosure | Native per-attribute | Circuit-based (Poseidon Merkle) |
| Predicate proofs | Native range proofs | GreaterThan(64) in circuit |
| On-chain verification | Not standard | Native via alt_bn128 syscall |
| Holder anonymity | Full (pseudonyms) | Wallet-linked (appropriate for legal aid) |
| Infrastructure | Aries agent + DIDComm + Indy ledger | Single Solana RPC call |
| Cost per verification | Indy ledger fees ($0.10-1.00) | ~$0.0001 (200k CU) |

### Building the Circuit

```bash
cd circuits
npm install          # installs circomlib + snarkjs
./build.sh           # compile → trusted setup → export VK
node test_proof.js   # generate + verify a test proof
```

## License
This project is source-available under a proprietary non-commercial
license. You may view, fork, and use the code for personal and
educational purposes. Commercial use requires written permission
from the author. See [LICENSE](./LICENSE) for details.
