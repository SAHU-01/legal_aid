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

> "We built a plug-in — not a replacement — that connects to existing court information systems and automates three things:
>
> **One**, digital credentialing. Courts issue a verifiable credential to each lawyer's wallet. No more paper Berechtigungsscheine.
>
> **Two**, tamper-proof document anchoring. Every case document is hashed and recorded. Anyone can verify nothing was altered.
>
> **Three**, instant payment. The moment a case is closed, the lawyer gets paid in USDC. Not in 6 months — in 400 milliseconds."

### 3. Live Demo — Credential (2 min)

**Show the dashboard with wallet connected.**

> "This is the lawyer's portal. At the top you can see their digital credential — a Berechtigungsschein issued by the court."

**Point to the credential section.**

> "It shows the jurisdiction — Germany — the eligibility tier, and the expiry date. This credential lives on the lawyer's wallet. It was issued by the court authority and is cryptographically verifiable by anyone, instantly."

**Click the attestation explorer link.**

> "Here it is on Solana Explorer. This is not a simulation — this is a real on-chain record. The court issued this, and no one can forge or alter it."

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

### 6. Cost Argument (1 min)

**Switch to the demo report (terminal or text file).**

> "Let me show you the cost side."

**Point to the COST ANALYSIS section.**

> "Storing a case record the traditional on-chain way costs about 1.5 million lamports — roughly 23 cents per case. Using Light Protocol's ZK compression, we bring that down to under half a cent.
>
> That's a 98.8% reduction in infrastructure cost.
>
> At government scale — say 100,000 legal aid cases per year in a single jurisdiction — that's over $22,000 saved on storage alone. And this is just the on-chain cost. The real savings come from eliminating manual processing, paper handling, and payment delays."

### 7. Interoperability (1 min)

> "I want to emphasize: this is a plug-in, not a replacement. No government system needs to change.
>
> The automation agent we built connects to existing court databases — SAP, SQL, whatever the ministry uses. It reads case data, issues credentials, and triggers payments automatically.
>
> The SAS credential is an open standard on Solana. Any court can issue credentials. Any law firm can verify them. Any auditor can check the chain of custody.
>
> And because we're using stablecoins — USDC — there's no cryptocurrency volatility. Lawyers receive the exact euro-equivalent amount they're owed."

### 8. Q&A

Have these tabs ready:

| Question | Show |
|----------|------|
| "Is this real?" | Explorer tab with program address: [`3f1y...KJRNV`](https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet) |
| "How do we know the credential is valid?" | Explorer tab with SAS attestation PDA |
| "What if someone tampers with a document?" | Show the document hash in the case detail — explain SHA-256 |
| "What about GDPR / data privacy?" | "No personal data is stored on-chain. Only hashes and public keys. The actual documents stay in the court's existing systems." |
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
