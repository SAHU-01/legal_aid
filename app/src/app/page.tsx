"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import CredentialStatus from "../components/CredentialStatus";
import CaseList from "../components/CaseList";
import ClaimPayment from "../components/ClaimPayment";

const PROGRAM_ID = "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV";
const EXPLORER = "https://explorer.solana.com";

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function truncateProgramId(id: string): string {
  return `${id.slice(0, 4)}...${id.slice(-5)}`;
}

export default function Home() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const onClaimed = useCallback(() => setRefreshKey((k) => k + 1), []);

  useEffect(() => {
    if (!publicKey) {
      setBalance(null);
      return;
    }
    let cancelled = false;
    connection.getBalance(publicKey).then((lamports) => {
      if (!cancelled) setBalance(lamports / LAMPORTS_PER_SOL);
    });
    return () => {
      cancelled = true;
    };
  }, [publicKey, connection]);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Demo Mode Banner */}
      <div className="border-b border-amber-900/50 bg-amber-950/40 px-4 py-2 text-center text-xs text-amber-300/90">
        <span className="mr-1.5 inline-block rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
          Demo
        </span>
        This is a live Devnet prototype. All transactions are real and verifiable on Solana Explorer.
      </div>

      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              Legal Aid Protocol
              <span className="font-normal text-zinc-400"> &mdash; Lawyer Portal</span>
            </h1>
            <p className="mt-0.5 text-xs text-zinc-500">
              Program:{" "}
              <a
                href={`${EXPLORER}/address/${PROGRAM_ID}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-zinc-400 hover:text-blue-400"
              >
                {truncateProgramId(PROGRAM_ID)}
              </a>
              <span className="mx-1.5 text-zinc-700">&middot;</span>
              <span className="inline-block rounded bg-zinc-800 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-zinc-400">
                Devnet
              </span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {connected && publicKey && (
              <div className="text-right text-xs text-zinc-400">
                <a
                  href={`${EXPLORER}/address/${publicKey.toBase58()}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono hover:text-blue-400"
                >
                  {truncateAddress(publicKey.toBase58())}
                </a>
                <p>
                  {balance !== null
                    ? `${balance.toFixed(4)} SOL`
                    : "Loading\u2026"}
                </p>
              </div>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">
        {!connected ? (
          /* ---------- Disconnected state ---------- */
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div className="space-y-2">
              <h2 className="text-xl font-medium text-zinc-200">
                Welcome to the Legal Aid Portal
              </h2>
              <p className="max-w-md text-sm text-zinc-400">
                Connect your Phantom or Solflare wallet to view your SAS credential, manage cases, and claim payments.
              </p>
            </div>
            <WalletMultiButton />
            <p className="text-xs text-zinc-600">
              Ensure your wallet is set to Solana Devnet
            </p>
          </div>
        ) : (
          /* ---------- Connected state ---------- */
          <div className="space-y-6">
            {/* Section A: Credential */}
            <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
                Your Credential
              </h2>
              {publicKey && (
                <CredentialStatus walletAddress={publicKey.toBase58()} />
              )}
            </section>

            {/* Section B: Cases */}
            <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
                Your Cases
              </h2>
              <CaseList refreshKey={refreshKey} />
            </section>

            {/* Section C: Claim Payment */}
            <section className="rounded-lg border border-zinc-800 bg-zinc-900 p-5">
              <h2 className="mb-3 text-sm font-medium uppercase tracking-wide text-zinc-400">
                Claim Payment
              </h2>
              <ClaimPayment refreshKey={refreshKey} onClaimed={onClaimed} />
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-800/60 px-4 py-5">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-2 text-xs text-zinc-600 sm:flex-row sm:justify-between">
          <p>
            Legal Aid Protocol &middot; Built on{" "}
            <a
              href="https://solana.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-zinc-500 hover:text-zinc-300"
            >
              Solana
            </a>
          </p>
          <div className="flex items-center gap-3">
            <span>SAS</span>
            <span className="text-zinc-800">&middot;</span>
            <span>Light Protocol</span>
            <span className="text-zinc-800">&middot;</span>
            <span>x402</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
