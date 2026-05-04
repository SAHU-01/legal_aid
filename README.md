# Legal Aid Protocol — Solana Devnet MVP

A modular plug-in for government legal aid systems that handles identity credentialing, document anchoring, and payment disbursement on Solana. The protocol replaces paper-based Berechtigungsscheine (legal aid certificates) with verifiable on-chain credentials, automates case lifecycle management through smart contracts, and disburses lawyer payments with cryptographic proof of eligibility — all while remaining interoperable with legacy government databases through a bridging automation agent.

## Architecture

The protocol is organized into five layers, each handling a distinct responsibility:

### 1. Identity Layer (SAS)
Government authorities issue digital credentials to verified lawyers using the Solana Attestation Service. Each credential encodes the lawyer's jurisdiction, eligibility tier, and expiry date. These credentials are checked automatically before any payment is released — no credential, no payment.

### 2. Case Management (Anchor)
An on-chain program manages the full lifecycle of a legal aid case: opening, document submission, closure, and payment confirmation. Every state transition is recorded as a Solana transaction, creating an immutable audit trail.

### 3. Document Integrity (Light Protocol)
Case documents are hashed and stored using ZK-compressed state via Light Protocol. This provides the same tamper-proof guarantees as standard on-chain storage at ~98.8% lower cost — critical when scaling to hundreds of thousands of cases per year.

### 4. Payment Gateway (x402)
When a case is closed, the payment endpoint verifies the lawyer's SAS credential before releasing USDC. The x402 protocol standardizes the payment-for-service flow: the API returns a 402 with payment requirements, the client pays, and the server verifies both the credential and the on-chain transfer.

### 5. Automation Agent
A polling agent bridges legacy systems to the blockchain. It continuously scans for closed cases on devnet, creates compressed audit logs, executes USDC transfers to lawyers, verifies credentials, and marks cases as paid — all without human intervention.

### Flow

```
Court Authority                    Lawyer                      System
      |                              |                           |
      |-- Issues SAS Credential ---->|                           |
      |                              |                           |
      |-- Opens Case (on-chain) ---->|                           |
      |                              |                           |
      |                              |-- Anchors Document ------>|
      |                              |   (SHA-256 hash)          |
      |                              |                           |
      |-- Closes Case -------------->|                           |
      |                              |                           |
      |                              |   Credential verified --->|
      |                              |<-- USDC Payment ---------|
      |                              |                           |
      |-- Marks Paid (on-chain) ---->|                           |
```

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
| Smart Contracts | Anchor 0.32 / Rust | On-chain case lifecycle and state management |
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
    src/lib.rs                  Case lifecycle: initialize, open_case, link_credential, anchor_document, close_case, mark_paid
  app/                        Next.js 16 frontend
    src/app/
      page.tsx                  Lawyer dashboard
      api/claim-payment/        x402 payment endpoint with SAS verification
  scripts/                    Automation and testing
    lib/                        Shared utilities (connection, USDC, case scanner, privacy)
    lib/privacy.ts              X25519+AES-256-GCM encryption, Merkle selective disclosure
    e2e-credential-pipeline.ts  Full 8-step lifecycle: open → credential → link → encrypt → anchor → close → paid
    upload-to-arweave.ts        Encrypted document upload to Arweave via Irys
    revoke-credential.ts        SAS credential revocation demo
    agent.ts                    Production workflow agent
  tests/                      Anchor integration tests
  target/idl/                 Generated IDL and TypeScript types
```

## Cost Efficiency

Using Light Protocol's ZK compression, document storage costs drop from ~1,566,960 lamports per case (standard PDA) to ~16,000 lamports (compressed state) — a 98.8% reduction. At 100,000 cases per year, this saves approximately $22,000 in on-chain storage costs.

## Scripts

| Script | Purpose |
|--------|---------|
| `e2e-full-pipeline.ts` | Complete 10-step end-to-end demo with verification and report generation |
| `agent.ts` | Production automation agent — polls for closed cases, compresses, pays, marks paid |
| `create-test-cases.ts` | Creates sample cases on devnet for agent testing |
| `create-schema.ts` | Deploys the SAS credential schema to devnet |
| `issue-credential.ts` | Issues a SAS Berechtigungsschein to a wallet |
| `verify-credential.ts` | Fetches and verifies a SAS credential on devnet |
| `test-payment-with-credential.ts` | Integration test for SAS + x402 payment flow |
| `test-x402-flow.ts` | End-to-end test of the x402 payment gateway |
| `anchor-document-compressed.ts` | Anchors a document hash using Light Protocol compression |
| `cost-comparison.ts` | Compares standard PDA vs. compressed storage costs |
| `query-compressed.ts` | Queries and validates compressed state via Photon indexer |
| `full-flow-day3.ts` | Full workflow including compression, credentials, and payment |
| `verify-agent-run.ts` | Verifies the automation agent processed cases correctly |

## License
This project is source-available under a proprietary non-commercial
license. You may view, fork, and use the code for personal and
educational purposes. Commercial use requires written permission
from the author. See [LICENSE](./LICENSE) for details.
