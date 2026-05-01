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

function truncate(s: string, head = 4, tail = 4): string {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-CA");
}

const STATUS_STYLE: Record<string, string> = {
  Open: "bg-blue-950 text-blue-300 border border-blue-900",
  InProgress: "bg-yellow-950 text-yellow-300 border border-yellow-900",
  Closed: "bg-orange-950 text-orange-300 border border-orange-900",
  Paid: "bg-emerald-950 text-emerald-300 border border-emerald-900",
};

const EXPLORER = "https://explorer.solana.com";

export default function CaseList({ refreshKey = 0 }: { refreshKey?: number }) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [cases, setCases] = useState<CaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      // Fetch all CaseFile accounts — lawyer field is at a variable
      // offset (after a string), so we filter client-side.
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
    } catch (err) {
      console.error("Failed to fetch cases:", err);
      setCases([]);
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases, refreshKey]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        Loading cases...
      </div>
    );
  }

  return (
    <div>
      {/* Header row with refresh */}
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs text-zinc-500">
          {cases.length} {cases.length === 1 ? "case" : "cases"} found
        </p>
        <button
          onClick={fetchCases}
          className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 hover:border-zinc-600 hover:text-zinc-300"
        >
          Refresh
        </button>
      </div>

      {cases.length === 0 ? (
        <p className="py-6 text-center text-sm text-zinc-500">
          No cases assigned to your wallet
        </p>
      ) : (
        <div className="space-y-px">
          {/* Column headers — hidden on mobile */}
          <div className="hidden grid-cols-[1fr_auto_1fr_auto] gap-4 px-3 pb-2 text-xs font-medium uppercase tracking-wide text-zinc-500 sm:grid">
            <span>Case ID</span>
            <span>Status</span>
            <span>Document Hash</span>
            <span>Date</span>
          </div>

          {cases.map((c) => {
            const hex = hashToHex(c.documentHash);
            const empty = isEmptyHash(c.documentHash);
            const expanded = expandedId === c.caseId;

            return (
              <div key={c.caseId}>
                {/* Row */}
                <button
                  type="button"
                  onClick={() =>
                    setExpandedId(expanded ? null : c.caseId)
                  }
                  className={`w-full rounded text-left text-sm transition-colors ${
                    expanded
                      ? "bg-zinc-800"
                      : "bg-zinc-800/40 hover:bg-zinc-800/70"
                  }`}
                >
                  {/* Desktop grid */}
                  <div className="hidden grid-cols-[1fr_auto_1fr_auto] items-center gap-4 px-3 py-2.5 sm:grid">
                    <span className="font-mono text-zinc-200">
                      {c.caseId}
                    </span>
                    <span
                      className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status] ?? ""}`}
                    >
                      {c.status}
                    </span>
                    <span className="font-mono text-zinc-400">
                      {empty ? "(none)" : truncate(hex, 6, 6)}
                    </span>
                    <span className="text-zinc-500">
                      {formatDate(c.createdAt)}
                    </span>
                  </div>

                  {/* Mobile stack */}
                  <div className="flex flex-col gap-1.5 px-3 py-2.5 sm:hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-zinc-200">
                        {c.caseId}
                      </span>
                      <span
                        className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${STATUS_STYLE[c.status] ?? ""}`}
                      >
                        {c.status}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-zinc-400">
                        {empty ? "(none)" : truncate(hex, 6, 6)}
                      </span>
                      <span className="text-zinc-500">
                        {formatDate(c.createdAt)}
                      </span>
                    </div>
                  </div>
                </button>

                {/* Expanded detail panel */}
                {expanded && (
                  <div className="rounded-b border-t border-zinc-700 bg-zinc-800 px-4 py-3 text-xs">
                    <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1.5 text-zinc-300">
                      <dt className="text-zinc-500">Document Hash</dt>
                      <dd className="break-all font-mono">
                        {empty ? "(none)" : hex}
                      </dd>
                      <dt className="text-zinc-500">PDA Address</dt>
                      <dd className="font-mono">
                        {c.publicKey.toBase58()}
                      </dd>
                      <dt className="text-zinc-500">Issuer</dt>
                      <dd className="font-mono">
                        {c.issuer.toBase58()}
                      </dd>
                      <dt className="text-zinc-500">Updated</dt>
                      <dd>{formatDate(c.updatedAt)}</dd>
                      <dt className="text-zinc-500">Explorer</dt>
                      <dd>
                        <a
                          href={`${EXPLORER}/address/${c.publicKey.toBase58()}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:underline"
                        >
                          View on Solana Explorer
                        </a>
                      </dd>
                    </dl>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
