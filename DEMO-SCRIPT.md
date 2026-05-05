# Legal Aid Protocol — 10-Minute Demo Script

A step-by-step script for presenting this MVP to a government stakeholder or NGO.

---

## Setup (before the meeting)

1. **Run the full pipeline** to generate fresh on-chain data:
   ```bash
   npx ts-node scripts/e2e-full-pipeline.ts
   ```
2. **Open the demo report** — `scripts/output/demo-report.txt` has all tx links.
3. **Open Solana Explorer** in a browser tab — <https://explorer.solana.com/?cluster=devnet>
4. **Start the dashboard**:
   ```bash
   cd app && npm run dev
   ```
   Open <http://localhost:3000> in the browser.
5. **Connect Phantom wallet** (set to Devnet) with an SAS credential already issued.
6. **Have a closed case ready** — run `scripts/create-test-cases.ts` if you need one.

> Tip: Pre-load explorer tabs for the program, a credential PDA, and a case PDA so you can switch quickly during Q&A.

---

## Demo Flow

### 1. The Problem (1 min)

> "Legal aid payments in Germany and across Europe take 6 to 12 months to reach lawyers. The process is paper-based — courts issue physical certificates, lawyers submit stacks of documents, and payment offices process claims manually.
>
> The result: lawyers stop accepting legal aid cases because they can't afford to wait. Citizens who can't pay for private counsel lose access to justice entirely.
>
> This is not a technology problem in the traditional sense. The courts work. The law works. The bottleneck is the plumbing between them — identity verification, document tracking, and payment processing."

### 2. The Solution (1 min)

> "We built a plug-in — not a replacement — that connects to existing court information systems and digitizes exactly one artifact: the Berechtigungsschein.
>
> **Issuance.** The court authority cryptographically signs an on-chain attestation binding the citizen to their eligibility tier and jurisdiction. A commitment root hashes all credential fields — no personal data ever touches the ledger. The credential survives issuing-server failure because it lives on the Solana ledger, not on any ministry's server.
>
> **Verification.** When eligibility needs to be proved, the holder generates a zero-knowledge proof: 'jurisdiction is DE, credential isn't expired' — without revealing tier, dates, or identity. 256 bytes. Verified on-chain in one transaction. The verifier learns nothing else.
>
> **Settlement.** Case closed, proof valid, credential unrevoked — USDC transfers to the lawyer in 400 milliseconds. If eligibility changes mid-case, the credential is deleted on-chain and all downstream verification fails instantly. No window of abuse."

### 3. Live Demo — Credential Issuance & Lifecycle (2 min)

**Show the dashboard with wallet connected.**

> "This is the lawyer's portal. At the top you can see the linked credential — a digital Berechtigungsschein issued by the court authority."

**Point to the credential section.**

> "Three things to notice here. First: jurisdiction, eligibility tier, and expiry date. These are the fields encoded in the SAS attestation — the same data that used to be on a paper certificate.
>
> Second: the credential is an on-chain account, owned by the SAS program. Even if the court's local server goes down, this credential remains verifiable by anyone on the network. That's credential longevity — something paper and even Hyperledger Aries can't guarantee without the issuing agent being online.
>
> Third: the commitment root. This is a Poseidon hash of all credential fields plus random salts. It enables zero-knowledge proofs later — the holder can prove facts about these fields without revealing them."

**Click the attestation explorer link.**

> "Here it is on Solana Explorer. This is a real PDA owned by the SAS program at address 22zo... You can see the raw bytes: the citizen's pubkey as nonce, the schema reference, the issuer's signature, the expiry timestamp. All on-chain, all immutable, all verifiable without calling anyone.
>
> If the court needs to revoke this — say the citizen gains employment — they delete this account. Instant. Global. Every system that checks this credential will immediately see it's gone. No revocation registry delays, no stale paper certificates floating around."

### 4. Live Demo — Case Lifecycle (2 min)

**Scroll to the case list.**

> "Each legal aid case is tracked on-chain with a clear lifecycle: Open, In Progress, Closed, Paid. You can see the status badges here."

**Click on a case row to expand it.**

> "Every case has a document hash — this is a SHA-256 fingerprint of the case documents. If anyone changes a single character in the original document, this hash won't match. It's tamper-proof by design."

**Click the PDA explorer link.**

> "Again, real on-chain data. You can see the case ID, the assigned lawyer, the issuing court, and the current status — all publicly auditable."

> "For government auditors, this means you can verify any case, any time, without requesting files from anyone."

### 5. Live Demo — Payment (2 min)

**Scroll to the Claim Payment section. Show a closed case.**

> "This case has been closed by the court authority. The lawyer can now claim their payment."

**Click "Claim Payment", then "Confirm & Claim" in the modal.**

> "Three things just happened:
>
> First, the system verified the lawyer's SAS credential — confirming they are authorized to practice legal aid in this jurisdiction.
>
> Second, it confirmed the case was legitimately closed by the court.
>
> Third, it transferred 50 USDC directly to the lawyer's wallet."

**Point to the success toast with the explorer link. Click it.**

> "Here's the payment transaction on Solana Explorer. You can see the exact amount, the sender, the recipient.
>
> This took 400 milliseconds. Not 6 months. Not 3 months. Under one second."

### 6. Live Demo — ZK Selective Disclosure (2 min)

**Switch to terminal. Run the ZK demo:**

```bash
npx ts-node scripts/zk-disclosure-demo.ts
```

> "Remember that commitment root we stored during issuance? This is where it pays off.
>
> The credential has six fields: jurisdiction, eligibility tier, expiry date, applicant ID, case type, issued-at. During issuance, we hashed all of them into a single Poseidon Merkle root and stored it on-chain. Now, the holder can prove statements about those fields without revealing them.
>
> Watch: the holder generates a Groth16 proof — 'my jurisdiction is DE AND my credential expires after today.' The circuit verifies that the holder knows field values that hash to the on-chain commitment root, that the disclosed field matches the public input, and that the predicate holds. All in zero knowledge."

**Point to the Privacy Analysis table in the output.**

> "Look at what the verifier learns versus what stays private. Jurisdiction: revealed. 'Not expired': proved. Everything else — tier, applicant identity, exact dates, salts — cryptographically hidden. This is not access-control privacy like Hyperledger Fabric's Private Data Collections. This is mathematical privacy. Even with unlimited compute, the verifier cannot extract the hidden fields from the proof.
>
> The proof is 256 bytes. Smaller than an Aries AnonCreds proof. Verified on-chain in a single Solana transaction for $0.0001. No DIDComm agent infrastructure. No Indy ledger. No consortium. Just math."

### 7. Cost Argument (1 min)

**Switch to the demo report (terminal or text file).**

> "Let me show you the cost side."

**Point to the COST ANALYSIS section.**

> "Storing a case record the traditional on-chain way costs about 1.5 million lamports — roughly 23 cents per case. Using Light Protocol's ZK compression, we bring that down to under half a cent.
>
> That's a 98.8% reduction in infrastructure cost.
>
> At government scale — say 100,000 legal aid cases per year in a single jurisdiction — that's over $22,000 saved on storage alone. And this is just the on-chain cost. The real savings come from eliminating manual processing, paper handling, and payment delays."

### 8. Interoperability (1 min)

> "I want to emphasize: this is a plug-in, not a replacement. No government system needs to change.
>
> The automation agent we built connects to existing court databases — SAP, SQL, whatever the ministry uses. It reads case data, issues credentials, and triggers payments automatically.
>
> The SAS credential is an open standard on Solana. Any court can issue credentials. Any law firm can verify them. Any auditor can check the chain of custody.
>
> And because we're using stablecoins — USDC — there's no cryptocurrency volatility. Lawyers receive the exact euro-equivalent amount they're owed."

### 9. Q&A

Have these tabs ready:

| Question | Show |
|----------|------|
| "Is this real?" | Explorer tab with program address: [`3f1y...KJRNV`](https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet) |
| "How do we know the credential is valid?" | Explorer tab with SAS attestation PDA |
| "What if someone tampers with a document?" | Show the document hash in the case detail — explain SHA-256 |
| "What about GDPR / data privacy?" | "No personal data is stored on-chain. Only hashes and public keys. The ZK proofs let us verify credentials without revealing personal data — mathematical privacy, not policy privacy." |
| "How is this different from Hyperledger?" | "Same zero-knowledge guarantees as Aries AnonCreds, but verified on-chain in a single transaction. No DIDComm agents, no Indy ledger. 256-byte proof, $0.0001 to verify." |
| "What's the ZK proof doing?" | "It proves 'I have a valid credential with jurisdiction=DE that isn't expired' without revealing tier, applicant ID, or exact dates. Groth16 — same math as Ethereum ZK rollups." |
| "What does it cost to deploy?" | Point to the cost analysis — infrastructure costs are negligible at scale |
| "Can this work with our existing systems?" | "Yes — the agent polls your database and writes to the chain. Your systems don't need to know about Solana." |
| "What's the timeline to production?" | "The protocol layer is complete. Integration with a specific court system is a 2-3 month project — mostly mapping data fields and setting up credential issuance workflows." |

---

## Key Numbers to Remember

- **6-12 months** — current payment delay in legal aid
- **400ms** — payment time with this protocol
- **98.8%** — cost reduction via ZK compression
- **$22,000+** — annual savings at 100,000 cases
- **50 USDC** — standard legal aid disbursement per case
- **0 personal data** — stored on-chain (GDPR compliant by design)
- **256 bytes** — ZK proof size (smaller than Hyperledger Aries ~500 bytes)
- **200k CU** — on-chain verification cost (~$0.0001)
- **7,883 constraints** — circuit complexity (Groth16 over BN254)
