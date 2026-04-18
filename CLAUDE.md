# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture
- Monorepo: Anchor workspace (Rust programs) + Next.js 16 frontend + API routes
- Chain: Solana Devnet
- Identity: Solana Attestation Service (SAS)
- Storage: Light Protocol (ZK Compression) + Photon indexer
- Payments: x402 Protocol v2 (solana CAIP-2 chain ID)
- Automation: Solana Agent Kit (SendAI)

## Directory Structure
- `/programs/legal-aid/` — Anchor program (Rust, crate name `legal_aid`)
- `/app/` — Next.js 16 App Router frontend (npm workspace)
- `/scripts/` — Agent scripts, SAS issuer, test runners
- `/tests/` — Anchor integration tests (ts-mocha)

## Dev Commands
- `anchor build` — compile Solana program
- `anchor test` — run integration tests (requires devnet validator or local)
- `anchor deploy --provider.cluster devnet` — deploy to devnet
- `npm run dev` — Next.js frontend dev server (runs in `/app` workspace)
- `npm run build` — build Next.js frontend
- `nvm use 22` — required before any npm/node commands (Node >=17 required by Anchor SDK)

## Key Constraints
- All transactions must execute on Devnet (no simulations)
- Use Anchor 0.30+ with `declare_id!`
- x402 uses `PAYMENT-SIGNATURE` HTTP header pattern
- Light Protocol compressed PDAs, not standard PDAs for document hashes
- SAS credential schema: jurisdiction, eligibility_tier, expiry_date
- Anchor.toml is configured for devnet cluster and npm package manager
- Root `package.json` uses npm workspaces with `app` as the only workspace

## Light Protocol / Helius RPC
- Light Protocol requires Helius RPC — standard devnet RPC won't work for compressed accounts
- Set `HELIUS_RPC_URL` in `.env` (e.g. `https://devnet.helius-rpc.com/?api-key=...`)
- Photon indexer is built into the Helius endpoint (no separate service needed)
- Shared connection helper: `scripts/lib/connection.ts`

## Dependency Pinning (Solana SBF Toolchain)
The Solana SBF compiler ships Cargo 1.84 which does not support Rust edition 2024.
When `anchor build` fails on `edition2024` errors, pin the offending crate:
```
cargo update <crate>@<bad-version> --precise <older-version>
```
Current pins in `Cargo.lock`: `proc-macro-crate` 3.3.0, `indexmap` 2.7.1, `unicode-segmentation` 1.12.0.
