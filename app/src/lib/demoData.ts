import type { PublicKey } from "@solana/web3.js";

// ── Types ──

export interface CaseAccount {
  publicKey: PublicKey;
  caseId: string;
  documentHash: number[];
  lawyer: PublicKey;
  issuer: PublicKey;
  status: string;
  createdAt: number;
  updatedAt: number;
  jurisdiction?: string;
}

export type FlowRole = "court" | "lawyer" | "protocol";
export type Role = "applicant" | "lawyer" | "operator";

// ── Constants ──

export const EXPLORER = "https://explorer.solana.com";
export const PROGRAM_ID = "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV";
export const REAL_LAWYER = "zYw8nVoNTnSR8phJHDkJoXMi3VbQUTvkzynMobRa9Pj";
export const REAL_AUTHORITY = "C35KAMuYGrkCf1nw5c4qQ1137pJT1zQnkbrCzrpm7wkU";

export const MOCK_IDENTITIES = {
  applicant: { name: "Max Mustermann", id: "BayernID: MAX3253" },
  lawyer: { name: "Rechtsanwalt Dieter Stein", id: "LawyerID: 123ABC" },
  operator: { name: "Sabine M\u00FCller", id: "OperatorID: ABC1234" },
} as const;

export const STATUS_STYLE: Record<string, string> = {
  Open: "bg-red-500/15 text-red-400",
  InProgress: "bg-blue-500/15 text-blue-400",
  Closed: "bg-yellow-500/15 text-yellow-400",
  Paid: "bg-emerald-500/15 text-emerald-400",
};

export const ROLE_COLORS: Record<FlowRole, { bg: string; text: string; label: string }> = {
  court: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Court" },
  lawyer: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Lawyer" },
  protocol: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Protocol" },
};

// ── Helpers ──

export function getStatusName(status: Record<string, unknown>): string {
  const key = Object.keys(status)[0];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

export function hashToHex(hash: number[]): string {
  return hash.map((b) => b.toString(16).padStart(2, "0")).join("");
}

export function isEmptyHash(hash: number[]): boolean {
  return hash.every((b) => b === 0);
}

export function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-CA");
}

export function inferJurisdiction(caseId: string): string {
  const match = caseId.match(/^(?:CASE|E2E)-([A-Z]{2})/);
  if (match) return match[1];
  if (caseId.startsWith("E2E-DEMO") || caseId.startsWith("BS-DE")) return "DE";
  return "\u2014";
}

// ── Demo Cases ──

export const DEMO_CASES: CaseAccount[] = [
  {
    publicKey: { toBase58: () => "23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9" } as unknown as PublicKey,
    caseId: "BS-DE-143/22",
    documentHash: [0x17,0x5b,0x1e,0x36,0xe8,0xc9,0x4b,0x94,0xe4,0x01,0x99,0x94,0xdf,0x95,0x13,0x85,0xb4,0x8f,0xd8,0x90,0x8f,0x8d,0x52,0x9a,0x7e,0x4b,0x2a,0x8d,0xa1,0xaf,0x23,0x51],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "Paid",
    createdAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: { toBase58: () => "ESoYhRmAMz2mfRPN8tAdB5GFnCfoeRBiqkDH3cSbPTWR" } as unknown as PublicKey,
    caseId: "CASE-DE-2847",
    documentHash: [0xf7,0xe8,0xd9,0xc0,0xb3,0x88,0xf4,0x62,0x15,0xcd,0x9a,0x37,0x4b,0x0e,0xd6,0x81,0xf5,0x29,0x73,0xae,0x04,0xbc,0x68,0x1f,0x93,0x47,0xda,0x50,0x2c,0xe6,0x8b,0x19],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "Closed",
    createdAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: { toBase58: () => "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV" } as unknown as PublicKey,
    caseId: "CASE-FR-9103",
    documentHash: [0xb1,0xc2,0xd3,0xe4,0x08,0xd1,0x6a,0xf3,0x4c,0x85,0xbe,0x23,0x76,0x59,0xa0,0x1d,0xe4,0x3f,0x8c,0xb7,0x60,0x12,0xd9,0x45,0xab,0x7e,0x01,0xc8,0x53,0xf6,0x34,0x9a],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "InProgress",
    createdAt: Math.floor(new Date("2026-04-25").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-25").getTime() / 1000),
    jurisdiction: "FR",
  },
  {
    publicKey: { toBase58: () => "C8B4AJp5U8UBw7fJCqvYiE7W26n15Aw3F35BLaVrgwu7" } as unknown as PublicKey,
    caseId: "CASE-BR-4521",
    documentHash: [0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "Open",
    createdAt: Math.floor(new Date("2026-04-22").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-22").getTime() / 1000),
    jurisdiction: "BR",
  },
];

// ── Sample Flow (complete case with real tx hashes) ──

export const SAMPLE_FLOW: Record<string, {
  title: string;
  reference: string;
  court: string;
  lawyer: string;
  client: string;
  assistance: string;
  steps: { label: string; tx: string; role: FlowRole; detail?: string }[];
}> = {
  "BS-DE-143/22": {
    title: "German Berechtigungsschein \u2014 Full Flow",
    reference: "123 UR II 143/22",
    court: "Amtsgericht Weiden i.d.OPf.",
    lawyer: "Rechtsanwalt Dieter Stein",
    client: "Max Mustermann",
    assistance: "Representation (Vertretung)",
    steps: [
      { label: "Applicant Files Petition", tx: "XvybzQRqQ2EbUPW4jPgwBcGp4tc76DxkAhupimMDYdjz6kER5TWL96jCQ2kyM5fCxLArED3YWWAnUzuky74k5LA", role: "court", detail: "Case opened on-chain" },
      { label: "Operator Reviews & Approves", tx: "uonEG3e45h7NRt2kWh9hr8cG3Bt36rwsdNedJr7yBZdnnrLbPZydANGaQzVo8eEsScKovy9fG5VDYeeTCG6xihq", role: "court", detail: "Eligibility verified" },
      { label: "BS Credential Issued", tx: "uonEG3e45h7NRt2kWh9hr8cG3Bt36rwsdNedJr7yBZdnnrLbPZydANGaQzVo8eEsScKovy9fG5VDYeeTCG6xihq", role: "court", detail: "PDA: C8B4AJp...rwu7" },
      { label: "Lawyer Anchors Documents", tx: "2HKRkJU2FEbV2xfizhwDbARr6PGLEyvQq11vojH4h3e4eQ899JzB16H16r7bzxWoouCTevh7BLHbMCuJxJWpkjjE", role: "lawyer", detail: "SHA-256 hash on-chain" },
      { label: "Operator Closes Case", tx: "5MJ7wZFhPkwqFvRjTseSFvve4JSsHs7bKvits46E2RHnpUEZXJ85bs5MSJ6FH8xu5BNWwU3ZiVp2jTqzK6sZ8ZqK", role: "court", detail: "Work review complete" },
      { label: "Payment Disbursed (85 USDC)", tx: "sVZAS7DAARA9zXGzozpSsMhBSZpYpHFpQ8qxPPw5q9bGwK2G47AnmSRYh5Vhmbmk4ctNjyfecPjZp8S4LGSFQBe", role: "protocol", detail: "USDC to lawyer wallet" },
      { label: "Case Marked Paid", tx: "4SPWnLkv4V7wqghbzqs8FoAgHRGho6K5erbUEUSkEdrJdwCHiLWYgLjDihbkqBeiJ9xqWpcc3QtCGWvmzq5Hupdg", role: "protocol", detail: "Terminal state" },
    ],
  },
};

// ── Lifecycle Steps (template for partial flows) ──

export const LIFECYCLE_STEPS: { label: string; role: FlowRole; detail: string }[] = [
  { label: "Applicant Files Petition", role: "court", detail: "Case opened on-chain" },
  { label: "Operator Reviews & Approves", role: "court", detail: "Eligibility verified" },
  { label: "BS Credential Issued", role: "court", detail: "SAS attestation created" },
  { label: "Lawyer Anchors Documents", role: "lawyer", detail: "SHA-256 hash on-chain" },
  { label: "Operator Closes Case", role: "court", detail: "Work review complete" },
  { label: "Payment Disbursed", role: "protocol", detail: "USDC to lawyer wallet" },
  { label: "Case Marked Paid", role: "protocol", detail: "Terminal state" },
];

export const CASE_PROGRESS: Record<string, { completedSteps: number; nextAction: string }> = {
  "CASE-DE-2847": { completedSteps: 5, nextAction: "Lawyer can now claim payment." },
  "CASE-FR-9103": { completedSteps: 4, nextAction: "Court operator reviews and closes the case." },
  "CASE-BR-4521": { completedSteps: 1, nextAction: "Court operator reviews the application." },
};

// ── ClaimPayment Demo Data ──

export const DEMO_CLOSED: CaseAccount[] = [
  {
    publicKey: { toBase58: () => "ESoYhRmAMz2mfRPN8tAdB5GFnCfoeRBiqkDH3cSbPTWR" } as unknown as PublicKey,
    caseId: "CASE-DE-2847",
    documentHash: [],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "Closed",
    createdAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
  },
];

export const DEMO_PAID: CaseAccount[] = [
  {
    publicKey: { toBase58: () => "23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9" } as unknown as PublicKey,
    caseId: "BS-DE-143/22",
    documentHash: [],
    lawyer: { toBase58: () => REAL_LAWYER } as unknown as PublicKey,
    issuer: { toBase58: () => REAL_AUTHORITY } as unknown as PublicKey,
    status: "Paid",
    createdAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
  },
];
