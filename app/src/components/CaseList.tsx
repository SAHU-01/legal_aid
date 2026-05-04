"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import idl from "../lib/legal_aid.json";
import CaseFlowGraph from "./CaseFlowGraph";

interface CaseAccount {
  publicKey: PublicKey;
  caseId: string;
  documentHash: number[];
  lawyer: PublicKey;
  issuer: PublicKey;
  applicant?: PublicKey;
  status: string;
  createdAt: number;
  updatedAt: number;
  credentialPubkey?: PublicKey;
  commitmentRoot?: number[];
  jurisdiction?: string;
}

function getStatusName(status: Record<string, unknown>): string {
  const key = Object.keys(status)[0];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function hashToHex(hash: number[]): string {
  return hash.map((b) => b.toString(16).padStart(2, "0")).join("");
}

function isEmptyHash(hash: number[]): boolean {
  return hash.every((b) => b === 0);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-CA");
}

const STATUS_STYLE: Record<string, string> = {
  Open: "bg-red-500/15 text-red-400",
  InProgress: "bg-blue-500/15 text-blue-400",
  Closed: "bg-yellow-500/15 text-yellow-400",
  Paid: "bg-emerald-500/15 text-emerald-400",
};

const EXPLORER = "https://explorer.solana.com";

// Real devnet addresses from executed sample cases
const REAL_LAWYER = "zYw8nVoNTnSR8phJHDkJoXMi3VbQUTvkzynMobRa9Pj";
const REAL_AUTHORITY = "C35KAMuYGrkCf1nw5c4qQ1137pJT1zQnkbrCzrpm7wkU";

const DEMO_CASES: CaseAccount[] = [
  {
    publicKey: {
      toBase58: () => "23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9",
    } as unknown as PublicKey,
    caseId: "BS-DE-143/22",
    documentHash: [
      0x17, 0x5b, 0x1e, 0x36, 0xe8, 0xc9, 0x4b, 0x94, 0xe4, 0x01, 0x99,
      0x94, 0xdf, 0x95, 0x13, 0x85, 0xb4, 0x8f, 0xd8, 0x90, 0x8f, 0x8d,
      0x52, 0x9a, 0x7e, 0x4b, 0x2a, 0x8d, 0xa1, 0xaf, 0x23, 0x51,
    ],
    lawyer: {
      toBase58: () => REAL_LAWYER,
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => REAL_AUTHORITY,
    } as unknown as PublicKey,
    status: "Paid",
    createdAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-05-02").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: {
      toBase58: () => "ESoYhRmAMz2mfRPN8tAdB5GFnCfoeRBiqkDH3cSbPTWR",
    } as unknown as PublicKey,
    caseId: "CASE-DE-2847",
    documentHash: [
      0xf7, 0xe8, 0xd9, 0xc0, 0xb3, 0x88, 0xf4, 0x62, 0x15, 0xcd, 0x9a,
      0x37, 0x4b, 0x0e, 0xd6, 0x81, 0xf5, 0x29, 0x73, 0xae, 0x04, 0xbc,
      0x68, 0x1f, 0x93, 0x47, 0xda, 0x50, 0x2c, 0xe6, 0x8b, 0x19,
    ],
    lawyer: {
      toBase58: () => REAL_LAWYER,
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => REAL_AUTHORITY,
    } as unknown as PublicKey,
    status: "Closed",
    createdAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-28").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: {
      toBase58: () => "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV",
    } as unknown as PublicKey,
    caseId: "CASE-FR-9103",
    documentHash: [
      0xb1, 0xc2, 0xd3, 0xe4, 0x08, 0xd1, 0x6a, 0xf3, 0x4c, 0x85, 0xbe,
      0x23, 0x76, 0x59, 0xa0, 0x1d, 0xe4, 0x3f, 0x8c, 0xb7, 0x60, 0x12,
      0xd9, 0x45, 0xab, 0x7e, 0x01, 0xc8, 0x53, 0xf6, 0x34, 0x9a,
    ],
    lawyer: {
      toBase58: () => REAL_LAWYER,
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => REAL_AUTHORITY,
    } as unknown as PublicKey,
    status: "InProgress",
    createdAt: Math.floor(new Date("2026-04-25").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-25").getTime() / 1000),
    jurisdiction: "FR",
  },
  {
    publicKey: {
      toBase58: () => "C8B4AJp5U8UBw7fJCqvYiE7W26n15Aw3F35BLaVrgwu7",
    } as unknown as PublicKey,
    caseId: "CASE-BR-4521",
    documentHash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    lawyer: {
      toBase58: () => REAL_LAWYER,
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => REAL_AUTHORITY,
    } as unknown as PublicKey,
    status: "Open",
    createdAt: Math.floor(new Date("2026-04-22").getTime() / 1000),
    updatedAt: Math.floor(new Date("2026-04-22").getTime() / 1000),
    jurisdiction: "BR",
  },
];

type FlowRole = "court" | "lawyer" | "protocol";

const ROLE_COLORS: Record<FlowRole, { bg: string; text: string; label: string }> = {
  court: { bg: "bg-emerald-500/15", text: "text-emerald-400", label: "Court" },
  lawyer: { bg: "bg-blue-500/15", text: "text-blue-400", label: "Lawyer" },
  protocol: { bg: "bg-purple-500/15", text: "text-purple-400", label: "Protocol" },
};

// Real transaction data from the German Berechtigungsschein sample case
const SAMPLE_FLOW: Record<string, {
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
      {
        label: "Applicant Files Petition",
        tx: "XvybzQRqQ2EbUPW4jPgwBcGp4tc76DxkAhupimMDYdjz6kER5TWL96jCQ2kyM5fCxLArED3YWWAnUzuky74k5LA",
        role: "court",
        detail: "Case opened on-chain",
      },
      {
        label: "Operator Reviews & Approves",
        tx: "uonEG3e45h7NRt2kWh9hr8cG3Bt36rwsdNedJr7yBZdnnrLbPZydANGaQzVo8eEsScKovy9fG5VDYeeTCG6xihq",
        role: "court",
        detail: "Eligibility verified",
      },
      {
        label: "BS Credential Issued",
        tx: "uonEG3e45h7NRt2kWh9hr8cG3Bt36rwsdNedJr7yBZdnnrLbPZydANGaQzVo8eEsScKovy9fG5VDYeeTCG6xihq",
        role: "court",
        detail: "PDA: C8B4AJp...rwu7",
      },
      {
        label: "Lawyer Anchors Documents",
        tx: "2HKRkJU2FEbV2xfizhwDbARr6PGLEyvQq11vojH4h3e4eQ899JzB16H16r7bzxWoouCTevh7BLHbMCuJxJWpkjjE",
        role: "lawyer",
        detail: "SHA-256 hash on-chain",
      },
      {
        label: "Operator Closes Case",
        tx: "5MJ7wZFhPkwqFvRjTseSFvve4JSsHs7bKvits46E2RHnpUEZXJ85bs5MSJ6FH8xu5BNWwU3ZiVp2jTqzK6sZ8ZqK",
        role: "court",
        detail: "Work review complete",
      },
      {
        label: "Payment Disbursed (85 USDC)",
        tx: "sVZAS7DAARA9zXGzozpSsMhBSZpYpHFpQ8qxPPw5q9bGwK2G47AnmSRYh5Vhmbmk4ctNjyfecPjZp8S4LGSFQBe",
        role: "protocol",
        detail: "USDC to lawyer wallet",
      },
      {
        label: "Case Marked Paid",
        tx: "4SPWnLkv4V7wqghbzqs8FoAgHRGho6K5erbUEUSkEdrJdwCHiLWYgLjDihbkqBeiJ9xqWpcc3QtCGWvmzq5Hupdg",
        role: "protocol",
        detail: "Terminal state",
      },
    ],
  },
};

// Shared step template — same lifecycle, different completion levels
const LIFECYCLE_STEPS: { label: string; role: FlowRole; detail: string }[] = [
  { label: "Applicant Files Petition", role: "court", detail: "Case opened on-chain" },
  { label: "Operator Reviews & Approves", role: "court", detail: "Eligibility verified" },
  { label: "BS Credential Issued", role: "court", detail: "SAS attestation created" },
  { label: "Lawyer Anchors Documents", role: "lawyer", detail: "SHA-256 hash on-chain" },
  { label: "Operator Closes Case", role: "court", detail: "Work review complete" },
  { label: "Payment Disbursed", role: "protocol", detail: "USDC to lawyer wallet" },
  { label: "Case Marked Paid", role: "protocol", detail: "Terminal state" },
];

// How far each non-primary case has progressed (number of completed steps)
const CASE_PROGRESS: Record<string, { completedSteps: number; nextAction: string }> = {
  "CASE-DE-2847": {
    completedSteps: 5, // Through "Operator Closes Case" — waiting for payment
    nextAction: "Lawyer can now claim payment via the Payments tab.",
  },
  "CASE-FR-9103": {
    completedSteps: 4, // Through "Lawyer Anchors Documents" — waiting for court to close
    nextAction: "Court operator reviews the submitted documents and closes the case.",
  },
  "CASE-BR-4521": {
    completedSteps: 1, // Only "Applicant Files Petition" — waiting for review
    nextAction: "Court operator needs to review the application and approve eligibility.",
  },
};

function inferJurisdiction(caseId: string): string {
  const match = caseId.match(/^(?:CASE|E2E)-([A-Z]{2})/);
  if (match) return match[1];
  if (caseId.startsWith("E2E-DEMO")) return "DE";
  return "\u2014";
}

export default function CaseList({
  refreshKey = 0,
  demoMode = false,
  autoExpandId,
  statusFilter,
}: {
  refreshKey?: number;
  demoMode?: boolean;
  autoExpandId?: string;
  statusFilter?: string | null;
}) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [cases, setCases] = useState<CaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const program = useMemo(() => {
    if (!wallet) return null;
    const provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
    });
    return new Program(idl as never, provider);
  }, [connection, wallet]);

  useEffect(() => {
    if (autoExpandId) setExpandedId(autoExpandId);
  }, [autoExpandId]);

  // Auto-expand the first matching case when filter changes or cases load
  useEffect(() => {
    if (autoExpandId) return; // autoExpandId takes priority
    const list = statusFilter ? cases.filter((c) => c.status === statusFilter) : cases;
    if (list.length > 0 && demoMode) setExpandedId(list[0].caseId);
  }, [statusFilter, cases, demoMode, autoExpandId]);

  const fetchCases = useCallback(async () => {
    if (!program || !wallet) return;
    setLoading(true);
    setError(null);
    try {
      const all = await (program.account as any).caseFile.all();
      const mine = all
        .filter((a: any) =>
          (a.account.lawyer as PublicKey).equals(wallet.publicKey),
        )
        .map((a: any) => ({
          publicKey: a.publicKey as PublicKey,
          caseId: a.account.caseId as string,
          documentHash: Array.from(a.account.documentHash as number[]),
          lawyer: a.account.lawyer as PublicKey,
          issuer: a.account.issuer as PublicKey,
          status: getStatusName(a.account.status),
          createdAt: Number(a.account.createdAt),
          updatedAt: Number(a.account.updatedAt),
        }))
        .sort((a: CaseAccount, b: CaseAccount) => b.createdAt - a.createdAt);
      setCases(mine);
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to fetch cases";
      console.error("Failed to fetch cases:", err);
      setError(msg);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  useEffect(() => {
    if (demoMode) {
      setCases(DEMO_CASES);
      setLoading(false);
      return;
    }
    fetchCases();
  }, [fetchCases, refreshKey, demoMode]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        Loading cases&hellip;
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchCases}
          className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
        >
          Retry
        </button>
      </div>
    );
  }

  const filteredCases = statusFilter
    ? cases.filter((c) => c.status === statusFilter)
    : cases;

  if (filteredCases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-500">
          {statusFilter ? `No ${statusFilter} cases found.` : "No cases assigned to your wallet."}
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Cases will appear here once a court authority opens one for you.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      {/* Table */}
      <table className="w-full border-collapse">
        {/* Header */}
        <thead>
          <tr className="border-b border-zinc-800 text-left text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500 bg-zinc-900/50">
            <th className="py-4 px-6 font-bold">Case ID</th>
            <th className="py-4 px-4 font-bold">Status</th>
            <th className="hidden py-4 px-4 font-bold md:table-cell">
              Jurisdiction
            </th>
            <th className="hidden py-4 px-4 font-bold sm:table-cell">
              Document Hash
            </th>
            <th className="py-4 px-4 font-bold">Date</th>
            <th className="py-4 px-4 font-bold"></th>
          </tr>
        </thead>
        <tbody>
          {filteredCases.map((c) => {
            const hex = hashToHex(c.documentHash);
            const empty = isEmptyHash(c.documentHash);
            const expanded = expandedId === c.caseId;
            const explorerUrl = `${EXPLORER}/address/${c.publicKey.toBase58()}?cluster=devnet`;
            const jurisdiction =
              c.jurisdiction ?? inferJurisdiction(c.caseId);
            const flow = SAMPLE_FLOW[c.caseId];

            return (
              <tr
                key={c.caseId}
                className={`border-b border-zinc-800/50 transition-colors ${expanded ? "bg-zinc-800/20" : "hover:bg-zinc-800/10"}`}
              >
                <td colSpan={6} className="p-0">
                  {/* Row content as a flex container for better control */}
                  <div
                    onClick={() =>
                      setExpandedId(expanded ? null : c.caseId)
                    }
                    className="flex cursor-pointer items-center py-4 px-6"
                  >
                    <div className="flex-1 min-w-0">
                      <a
                        href={explorerUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono text-sm font-bold text-zinc-200 hover:text-blue-400 truncate"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {c.caseId}
                      </a>
                    </div>
                    <div className="px-4" style={{ minWidth: 120 }}>
                      <span
                        className={`inline-block rounded-md px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${STATUS_STYLE[c.status] ?? ""}`}
                      >
                        {c.status === "InProgress" ? "In Progress" : c.status}
                      </span>
                    </div>
                    <div className="hidden px-4 text-sm font-medium text-zinc-400 md:block" style={{ minWidth: 80 }}>
                      {jurisdiction}
                    </div>
                    <div className="hidden px-4 font-mono text-xs text-zinc-500 sm:block" style={{ minWidth: 120 }}>
                      {empty ? "\u2014" : `${hex.slice(0, 8)}\u2026`}
                    </div>
                    <div className="px-4 text-sm font-medium text-zinc-400" style={{ minWidth: 120 }}>
                      {formatDate(c.createdAt)}
                    </div>
                    <div className="px-4 text-zinc-600">
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        style={{
                          transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                          transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </div>
                  </div>

                  {/* Expanded flow detail */}
                  {expanded && (
                    <div className="border-t border-zinc-800/80 bg-black/20 px-6 pb-8 pt-6">
                      {flow ? (
                        <>
                          <CaseFlowGraph
                            steps={flow.steps}
                            meta={{
                              title: flow.title,
                              reference: flow.reference,
                              court: flow.court,
                              lawyer: flow.lawyer,
                              client: flow.client,
                              assistance: flow.assistance,
                            }}
                          />
                          <div className="mt-6 flex flex-wrap gap-3 border-t border-zinc-800/50 pt-6">
                            <a
                              href={`${EXPLORER}/address/23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 shadow-sm"
                            >
                              VIEW CASE ON EXPLORER {"\u2197"}
                            </a>
                            <a
                              href={`${EXPLORER}/address/C8B4AJp5U8UBw7fJCqvYiE7W26n15Aw3F35BLaVrgwu7?cluster=devnet`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-2 text-xs font-bold text-zinc-400 transition-all hover:border-zinc-500 hover:text-zinc-200 shadow-sm"
                            >
                              VIEW CREDENTIAL {"\u2197"}
                            </a>
                            <a
                              href="/docs#live-case"
                              className="rounded-lg border border-emerald-800/50 bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 transition-all hover:bg-emerald-500/20 shadow-sm"
                            >
                              FULL DOCUMENTATION
                            </a>
                          </div>
                        </>
                      ) : CASE_PROGRESS[c.caseId] ? (
                        <>
                          <CaseFlowGraph
                            steps={LIFECYCLE_STEPS.map((s) => ({ ...s, tx: "" }))}
                            meta={{
                              title: `Case ${c.caseId} \u2014 ${jurisdiction} Jurisdiction`,
                              reference: c.caseId,
                              court: "Assigned Court",
                              lawyer: c.lawyer.toBase58().slice(0, 8) + "...",
                              client: "Applicant",
                              assistance: "Legal Aid",
                            }}
                            completedSteps={CASE_PROGRESS[c.caseId].completedSteps}
                          />
                          <div className="mt-4 rounded-xl border border-zinc-800 bg-zinc-800/30 px-4 py-3 text-xs shadow-inner">
                            <div className="flex items-center gap-3">
                              <span className={`inline-block rounded-md px-2 py-0.5 font-bold uppercase tracking-wider ${STATUS_STYLE[c.status] ?? ""}`} style={{ fontSize: "9px" }}>
                                {c.status}
                              </span>
                              <span className="text-zinc-400 font-medium">Next: {CASE_PROGRESS[c.caseId].nextAction}</span>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-xs text-zinc-500 py-2">
                          <a href={explorerUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400/70 hover:text-blue-400 font-bold uppercase tracking-wider">
                            View on Solana Explorer {"\u2197"}
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
