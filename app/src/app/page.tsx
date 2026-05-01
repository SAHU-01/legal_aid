"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import CredentialStatus from "../components/CredentialStatus";
import CaseList from "../components/CaseList";
import ClaimPayment from "../components/ClaimPayment";

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
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
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      {/* Header */}
      <header className="border-b border-zinc-800 px-4 py-4 sm:px-6">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight text-zinc-50">
              Legal Aid Protocol
              <span className="font-normal text-zinc-400"> — Lawyer Portal</span>
            </h1>
            <p className="text-xs text-zinc-500">Solana Devnet</p>
          </div>
          <div className="flex items-center gap-3">
            {connected && publicKey && (
              <div className="text-right text-xs text-zinc-400">
                <p className="font-mono">{truncateAddress(publicKey.toBase58())}</p>
                <p>
                  {balance !== null
                    ? `${balance.toFixed(4)} SOL`
                    : "Loading…"}
                </p>
              </div>
            )}
            <WalletMultiButton />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
        {!connected ? (
          /* ---------- Disconnected state ---------- */
          <div className="flex min-h-[60vh] flex-col items-center justify-center gap-6 text-center">
            <div>
              <p className="text-zinc-300">
                Connect your Phantom or Solflare wallet to access your cases
              </p>
            </div>
            <WalletMultiButton />
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
    </div>
  );
}
