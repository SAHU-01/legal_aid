"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import idl from "../lib/legal_aid.json";

interface CaseAccount {
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

const DEMO_CASES: CaseAccount[] = [
  {
    publicKey: {
      toBase58: () => "DemoCase1111111111111111111111111111111111111",
    } as unknown as PublicKey,
    caseId: "E2E-DEMO-1748",
    documentHash: [
      0xa3, 0xb2, 0xc1, 0xd4, 0x3a, 0xf2, 0x8b, 0x01, 0xcc, 0x44, 0x91,
      0xde, 0x7f, 0xa3, 0x12, 0x5e, 0xb8, 0x90, 0x3c, 0xd7, 0x1a, 0x4f,
      0x66, 0x2b, 0x9d, 0x05, 0xe8, 0x73, 0xca, 0x1b, 0x40, 0xf9,
    ],
    lawyer: {
      toBase58: () => "DemoLawyer1111111111111111111111111111111111",
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => "DemoCourt11111111111111111111111111111111111",
    } as unknown as PublicKey,
    status: "Paid",
    createdAt: Math.floor(new Date("2025-05-01").getTime() / 1000),
    updatedAt: Math.floor(new Date("2025-05-01").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: {
      toBase58: () => "DemoCase2222222222222222222222222222222222222",
    } as unknown as PublicKey,
    caseId: "CASE-DE-2847",
    documentHash: [
      0xf7, 0xe8, 0xd9, 0xc0, 0xb3, 0x88, 0xf4, 0x62, 0x15, 0xcd, 0x9a,
      0x37, 0x4b, 0x0e, 0xd6, 0x81, 0xf5, 0x29, 0x73, 0xae, 0x04, 0xbc,
      0x68, 0x1f, 0x93, 0x47, 0xda, 0x50, 0x2c, 0xe6, 0x8b, 0x19,
    ],
    lawyer: {
      toBase58: () => "DemoLawyer1111111111111111111111111111111111",
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => "DemoCourt11111111111111111111111111111111111",
    } as unknown as PublicKey,
    status: "Closed",
    createdAt: Math.floor(new Date("2025-04-28").getTime() / 1000),
    updatedAt: Math.floor(new Date("2025-04-28").getTime() / 1000),
    jurisdiction: "DE",
  },
  {
    publicKey: {
      toBase58: () => "DemoCase4444444444444444444444444444444444444",
    } as unknown as PublicKey,
    caseId: "CASE-FR-9103",
    documentHash: [
      0xb1, 0xc2, 0xd3, 0xe4, 0x08, 0xd1, 0x6a, 0xf3, 0x4c, 0x85, 0xbe,
      0x23, 0x76, 0x59, 0xa0, 0x1d, 0xe4, 0x3f, 0x8c, 0xb7, 0x60, 0x12,
      0xd9, 0x45, 0xab, 0x7e, 0x01, 0xc8, 0x53, 0xf6, 0x34, 0x9a,
    ],
    lawyer: {
      toBase58: () => "DemoLawyer1111111111111111111111111111111111",
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => "DemoCourt22222222222222222222222222222222222",
    } as unknown as PublicKey,
    status: "InProgress",
    createdAt: Math.floor(new Date("2025-04-25").getTime() / 1000),
    updatedAt: Math.floor(new Date("2025-04-25").getTime() / 1000),
    jurisdiction: "FR",
  },
  {
    publicKey: {
      toBase58: () => "DemoCase3333333333333333333333333333333333333",
    } as unknown as PublicKey,
    caseId: "CASE-BR-4521",
    documentHash: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    lawyer: {
      toBase58: () => "DemoLawyer1111111111111111111111111111111111",
    } as unknown as PublicKey,
    issuer: {
      toBase58: () => "DemoCourt33333333333333333333333333333333333",
    } as unknown as PublicKey,
    status: "Open",
    createdAt: Math.floor(new Date("2025-04-22").getTime() / 1000),
    updatedAt: Math.floor(new Date("2025-04-22").getTime() / 1000),
    jurisdiction: "BR",
  },
];

function inferJurisdiction(caseId: string): string {
  const match = caseId.match(/^(?:CASE|E2E)-([A-Z]{2})/);
  if (match) return match[1];
  if (caseId.startsWith("E2E-DEMO")) return "DE";
  return "\u2014";
}

export default function CaseList({
  refreshKey = 0,
  demoMode = false,
}: {
  refreshKey?: number;
  demoMode?: boolean;
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

  if (cases.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-500">
          No cases assigned to your wallet.
        </p>
        <p className="mt-1 text-xs text-zinc-600">
          Cases will appear here once a court authority opens one for you.
        </p>
      </div>
    );
  }

  return (
    <div>
      {/* Table */}
      <table className="w-full">
        {/* Header */}
        <thead>
          <tr className="border-b border-zinc-800 text-left text-[11px] font-medium uppercase tracking-widest text-zinc-500">
            <th className="pb-3 pr-4 font-medium">Case ID</th>
            <th className="pb-3 pr-4 font-medium">Status</th>
            <th className="hidden pb-3 pr-4 font-medium md:table-cell">
              Jurisdiction
            </th>
            <th className="hidden pb-3 pr-4 font-medium sm:table-cell">
              Document Hash
            </th>
            <th className="pb-3 font-medium">Date</th>
          </tr>
        </thead>
        <tbody>
          {cases.map((c) => {
            const hex = hashToHex(c.documentHash);
            const empty = isEmptyHash(c.documentHash);
            const expanded = expandedId === c.caseId;
            const explorerUrl = `${EXPLORER}/address/${c.publicKey.toBase58()}?cluster=devnet`;
            const jurisdiction =
              c.jurisdiction ?? inferJurisdiction(c.caseId);

            return (
              <tr
                key={c.caseId}
                onClick={() =>
                  setExpandedId(expanded ? null : c.caseId)
                }
                className="cursor-pointer border-b border-zinc-800/50 transition-colors hover:bg-zinc-800/30"
              >
                <td className="py-4 pr-4">
                  <a
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-sm text-zinc-200 hover:text-blue-400"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {c.caseId}
                  </a>
                </td>
                <td className="py-4 pr-4">
                  <span
                    className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${STATUS_STYLE[c.status] ?? ""}`}
                  >
                    {c.status === "InProgress" ? "In Progress" : c.status}
                  </span>
                </td>
                <td className="hidden py-4 pr-4 text-sm text-zinc-400 md:table-cell">
                  {jurisdiction}
                </td>
                <td className="hidden py-4 pr-4 font-mono text-xs text-zinc-500 sm:table-cell">
                  {empty ? "\u2014" : `${hex.slice(0, 8)}\u2026`}
                </td>
                <td className="py-4 text-sm text-zinc-400">
                  {formatDate(c.createdAt)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
