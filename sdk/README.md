# @adduce/sdk

Issue. Prove. Settle. Legal aid credentials on Solana.

## Install

```bash
npm install @adduce/sdk
```

## Quick Start

```typescript
import { AdduceClient, Keypair } from "@adduce/sdk";

const wallet = Keypair.fromSecretKey(/* your keypair */);
const adduce = new AdduceClient({ cluster: "devnet", wallet });

// Open a case (court authority)
const { casePda, lawyerCommitment } = await adduce.openCase({
  caseId: "CASE-DE-2025-001",
  lawyerPubkey: lawyerWallet.publicKey,
  applicant: citizenWallet.publicKey,
  authorizedAmount: 8500,
}, "DE");

// Store lawyerCommitment.salt securely: lawyer needs it later

// Link credential (reviewer)
await adduce.linkCredential({
  caseId: "CASE-DE-2025-001",
  credentialAddress: sasPda,
  commitmentRoot: poseidonRoot,
}, "DE");

// Anchor document (lawyer proves identity via salt)
await adduce.anchorDocument(
  { caseId: "CASE-DE-2025-001", documentHash: sha256Hash },
  lawyerCommitment.salt,
  credentialAddress
);

// Close case (reviewer)
await adduce.closeCase("CASE-DE-2025-001", credentialAddress, "DE");

// Mark paid (payer)
await adduce.markPaid({
  caseId: "CASE-DE-2025-001",
  disbursedAmount: 8500,
  paymentReference: "INV-2025-04-001",
}, "DE");
```

## All 14 Instructions

| Method | Role | What It Does |
|--------|------|-------------|
| `initialize()` | Authority | Create jurisdiction config |
| `openCase()` | Authority | Open case with lawyer commitment + authorized amount |
| `openCaseCustodial()` | Authority | Open case for citizen without wallet |
| `linkCredential()` | Reviewer | Bind SAS credential to case (5-point validation) |
| `anchorDocument()` | Lawyer | Anchor document hash (proves identity via salt) |
| `closeCase()` | Reviewer | Close case (credential liveness re-checked) |
| `markPaid()` | Payer | Record payment (amount validated, reference stored) |
| `reassignLawyer()` | Authority | Switch lawyer with audit trail |
| `updateCaseStatus()` | Reviewer | Non-linear: Stayed, Appealed, Withdrawn, Remanded |
| `reopenCase()` | Authority | Closed back to InProgress with reason |
| `verifyZkDisclosure()` | Anyone | Verify 256-byte Groth16 proof on-chain |
| `addDelegate()` | Authority | Add delegate reviewer (max 3) |
| `removeDelegate()` | Authority | Remove delegate |
| `fundOperations()` | Authority | Top up operations wallet |

## Read Operations

```typescript
const case = await adduce.getCase("CASE-DE-2025-001");
const config = await adduce.getConfig("DE");
const allCases = await adduce.getAllCases();
const closedCases = await adduce.getCasesByStatus("Closed");
```

## Utilities

```typescript
import {
  createLawyerCommitment,
  verifyLawyerCommitment,
  hashCitizenId,
  deriveConfigPda,
  deriveCasePda,
} from "@adduce/sdk";

// Generate lawyer commitment (court does this during openCase)
const { commitment, salt } = createLawyerCommitment(lawyerPubkey);

// Verify lawyer commitment (anyone can check)
const valid = verifyLawyerCommitment(lawyerPubkey, salt, commitment);

// Hash citizen ID for custodial cases
const idHash = hashCitizenId("DE-PERSONALAUSWEIS-L01234567");

// Derive PDA addresses
const [configPda] = deriveConfigPda("DE");
const [casePda] = deriveCasePda("CASE-DE-2025-001");
```

## Deployed Program

| Resource | Address |
|----------|---------|
| Program | `3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV` |
| SAS Program | `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG` |
| SAS Schema | `7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid` |
