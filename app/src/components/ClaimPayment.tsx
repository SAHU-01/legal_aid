"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { PublicKey } from "@solana/web3.js";
import idl from "../lib/legal_aid.json";

const EXPLORER = "https://explorer.solana.com";
const AMOUNT_USDC = 50;

interface CaseAccount {
  publicKey: PublicKey;
  caseId: string;
  status: string;
  createdAt: number;
  updatedAt: number;
}

interface ClaimRecord {
  caseId: string;
  txSignature: string;
  amount: string;
  claimedAt: number;
}

interface Toast {
  type: "success" | "error";
  message: string;
  detail?: string;
  txSignature?: string;
}

function getStatusName(status: Record<string, unknown>): string {
  const key = Object.keys(status)[0];
  return key.charAt(0).toUpperCase() + key.slice(1);
}

function formatDate(timestamp: number): string {
  return new Date(timestamp * 1000).toLocaleDateString("en-CA");
}

function truncate(s: string, head = 4, tail = 4): string {
  if (s.length <= head + tail + 3) return s;
  return `${s.slice(0, head)}...${s.slice(-tail)}`;
}

export default function ClaimPayment({
  refreshKey,
  onClaimed,
}: {
  refreshKey: number;
  onClaimed: () => void;
}) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();

  const [closedCases, setClosedCases] = useState<CaseAccount[]>([]);
  const [paidCases, setPaidCases] = useState<CaseAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [confirmCaseId, setConfirmCaseId] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [claims, setClaims] = useState<ClaimRecord[]>([]);

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
          status: getStatusName(a.account.status),
          createdAt: Number(a.account.createdAt),
          updatedAt: Number(a.account.updatedAt),
        }));

      setClosedCases(
        mine
          .filter((c: CaseAccount) => c.status === "Closed")
          .sort((a: CaseAccount, b: CaseAccount) => b.updatedAt - a.updatedAt),
      );
      setPaidCases(
        mine
          .filter((c: CaseAccount) => c.status === "Paid")
          .sort((a: CaseAccount, b: CaseAccount) => b.updatedAt - a.updatedAt),
      );
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to load payment data";
      console.error("Failed to fetch cases:", err);
      setError(msg);
      setClosedCases([]);
      setPaidCases([]);
    } finally {
      setLoading(false);
    }
  }, [program, wallet]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases, refreshKey]);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 8000);
    return () => clearTimeout(t);
  }, [toast]);

  async function handleClaim(caseId: string) {
    if (!wallet) return;
    setClaiming(true);
    setConfirmCaseId(null);

    try {
      const res = await fetch("/api/claim-payment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          caseId,
          lawyerWallet: wallet.publicKey.toBase58(),
        }),
      });

      const data = await res.json();

      if (res.status === 200) {
        const txSig = data.txSignature ?? "";
        setClaims((prev) => [
          {
            caseId,
            txSignature: txSig,
            amount: data.amount ?? String(AMOUNT_USDC),
            claimedAt: Math.floor(Date.now() / 1000),
          },
          ...prev,
        ]);
        setToast({
          type: "success",
          message: `Payment claimed for ${caseId}`,
          txSignature: txSig,
        });
        onClaimed();
      } else if (res.status === 403) {
        setToast({
          type: "error",
          message: "Credential verification failed",
          detail:
            data.detail ??
            "Your wallet does not have a valid SAS credential. Contact your court authority.",
        });
      } else if (res.status === 400) {
        setToast({
          type: "error",
          message: "Invalid request",
          detail: data.error,
        });
      } else {
        setToast({
          type: "error",
          message: data.error || `Request failed (${res.status})`,
          detail: data.detail,
        });
      }
    } catch {
      setToast({
        type: "error",
        message: "Could not reach the payment server",
        detail: "Make sure the dev server is running (npm run dev).",
      });
    } finally {
      setClaiming(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        Loading payment data&hellip;
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

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div
          className={`rounded border px-4 py-3 text-sm ${
            toast.type === "success"
              ? "border-emerald-800 bg-emerald-950 text-emerald-300"
              : "border-red-800 bg-red-950 text-red-300"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p>{toast.message}</p>
              {toast.detail && (
                <p className="mt-0.5 text-xs opacity-80">{toast.detail}</p>
              )}
              {toast.txSignature && (
                <a
                  href={`${EXPLORER}/tx/${toast.txSignature}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block text-xs text-blue-400 hover:underline"
                >
                  View transaction on Explorer &nearr;
                </a>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className="text-zinc-500 hover:text-zinc-300"
              aria-label="Dismiss"
            >
              &times;
            </button>
          </div>
        </div>
      )}

      {/* Claimable cases */}
      <div>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
          Claimable
        </h3>
        {closedCases.length === 0 ? (
          <div className="py-4 text-center">
            <p className="text-sm text-zinc-500">
              No cases ready for payment claim.
            </p>
            <p className="mt-0.5 text-xs text-zinc-600">
              Cases appear here once closed by the court authority.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {closedCases.map((c) => (
              <div
                key={c.caseId}
                className="flex flex-col gap-2 rounded bg-zinc-800/40 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-mono text-sm text-zinc-200">{c.caseId}</p>
                  <p className="text-xs text-zinc-500">
                    Closed {formatDate(c.updatedAt)} &middot; {AMOUNT_USDC} USDC
                  </p>
                </div>
                <button
                  onClick={() => setConfirmCaseId(c.caseId)}
                  disabled={claiming}
                  className="rounded bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600 disabled:opacity-50"
                >
                  {claiming ? "Processing\u2026" : "Claim Payment"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Payment history */}
      {(paidCases.length > 0 || claims.length > 0) && (
        <div>
          <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">
            Payment History
          </h3>
          <div className="space-y-px">
            {/* Recent claims from this session (have tx signatures) */}
            {claims.map((cl) => (
              <div
                key={`claim-${cl.caseId}`}
                className="flex flex-col gap-1 rounded bg-zinc-800/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="text-sm text-zinc-200">
                    <span className="font-mono">{cl.caseId}</span>
                    <span className="ml-2 text-emerald-400">
                      {cl.amount} USDC
                    </span>
                  </p>
                  <p className="text-xs text-zinc-500">
                    {formatDate(cl.claimedAt)}
                    {cl.txSignature && (
                      <>
                        {" "}&middot;{" "}
                        <a
                          href={`${EXPLORER}/tx/${cl.txSignature}?cluster=devnet`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-blue-400 hover:underline"
                        >
                          tx {truncate(cl.txSignature, 4, 4)}
                          <span className="ml-0.5 text-zinc-600">&nearr;</span>
                        </a>
                      </>
                    )}
                  </p>
                </div>
                {cl.txSignature && (
                  <a
                    href={`${EXPLORER}/tx/${cl.txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:underline"
                  >
                    Explorer &nearr;
                  </a>
                )}
              </div>
            ))}

            {/* On-chain Paid cases (no tx sig available) */}
            {paidCases
              .filter(
                (c) => !claims.some((cl) => cl.caseId === c.caseId),
              )
              .map((c) => (
                <div
                  key={`paid-${c.caseId}`}
                  className="flex flex-col gap-1 rounded bg-zinc-800/40 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm text-zinc-200">
                      <span className="font-mono">{c.caseId}</span>
                      <span className="ml-2 text-emerald-400">
                        {AMOUNT_USDC} USDC
                      </span>
                    </p>
                    <p className="text-xs text-zinc-500">
                      {formatDate(c.updatedAt)}
                      {" "}&middot;{" "}
                      <a
                        href={`${EXPLORER}/address/${c.publicKey.toBase58()}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-400 hover:underline"
                      >
                        View case &nearr;
                      </a>
                    </p>
                  </div>
                  <span className="inline-block rounded border border-emerald-900 bg-emerald-950 px-2 py-0.5 text-xs text-emerald-300">
                    Paid
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Confirmation modal */}
      {confirmCaseId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
          <div className="w-full max-w-sm rounded-lg border border-zinc-700 bg-zinc-900 p-6">
            <h3 className="text-base font-medium text-zinc-100">
              Claim {AMOUNT_USDC} USDC for {confirmCaseId}?
            </h3>
            <p className="mt-2 text-sm text-zinc-400">
              This will verify your SAS credential and process the payment to your wallet.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirmCaseId(null)}
                className="rounded border border-zinc-700 px-4 py-1.5 text-sm text-zinc-300 hover:border-zinc-600"
              >
                Cancel
              </button>
              <button
                onClick={() => handleClaim(confirmCaseId)}
                className="rounded bg-emerald-700 px-4 py-1.5 text-sm font-medium text-white hover:bg-emerald-600"
              >
                Confirm &amp; Claim
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
