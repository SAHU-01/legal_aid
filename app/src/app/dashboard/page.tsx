"use client";

import { useCallback, useEffect, useState } from "react";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";
import CredentialStatus from "../../components/CredentialStatus";
import CaseList from "../../components/CaseList";
import ClaimPayment from "../../components/ClaimPayment";

const EXPLORER = "https://explorer.solana.com";

type View = "cases" | "credentials" | "payments";

function truncateAddress(address: string): string {
  return `${address.slice(0, 4)}\u2026${address.slice(-4)}`;
}

export default function Dashboard() {
  const { connection } = useConnection();
  const { publicKey, connected } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [activeView, setActiveView] = useState<View>("cases");
  const onClaimed = useCallback(() => setRefreshKey((k) => k + 1), []);

  const isActive = connected || demoMode;

  useEffect(() => {
    setMounted(true);
  }, []);

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

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-zinc-400">
        Loading&hellip;
      </div>
    );
  }

  /* ── Disconnected landing ── */
  if (!isActive) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 bg-[#0f0f0f] text-center text-zinc-100">
        <div className="space-y-2">
          <h2 className="text-xl font-medium text-zinc-200">
            Welcome to the Legal Aid Portal
          </h2>
          <p className="max-w-md text-sm text-zinc-400">
            Connect your Phantom or Solflare wallet to view your SAS credential,
            manage cases, and claim payments.
          </p>
        </div>
        <WalletMultiButton />
        <p className="text-xs text-zinc-600">
          Ensure your wallet is set to Solana Devnet
        </p>
        <div className="mt-4 flex flex-col items-center gap-2">
          <span className="text-xs text-zinc-600">or</span>
          <button
            onClick={() => setDemoMode(true)}
            className="rounded border border-amber-800/60 bg-amber-950/40 px-5 py-2 text-sm font-medium text-amber-300 transition-colors hover:border-amber-700 hover:bg-amber-950/70"
          >
            Try Interactive Demo
          </button>
          <p className="max-w-xs text-xs text-zinc-600">
            Explore the full flow with sample data — no wallet needed
          </p>
        </div>
      </div>
    );
  }

  /* ── Dashboard shell ── */
  const walletLabel =
    publicKey ? truncateAddress(publicKey.toBase58()) : "Demo\u2026Wallet";

  const NAV_ITEMS: { key: View; icon: string; label: string }[] = [
    { key: "cases", icon: "\u229e", label: "Dashboard" },
    { key: "cases", icon: "\u25ce", label: "My Cases" },
    { key: "credentials", icon: "\u25cb", label: "Credentials" },
  ];

  const ACTION_ITEMS: { key: View; icon: string; label: string }[] = [
    { key: "payments", icon: "\u2197", label: "Claim Payment" },
    { key: "credentials", icon: "\u25c9", label: "Verify" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f0f] text-zinc-100">
      {/* ── Demo banner ── */}
      {demoMode && (
        <div className="flex items-center justify-between border-b border-amber-900/50 bg-amber-950/40 px-4 py-2">
          <p className="text-xs text-amber-300/90">
            <span className="mr-1.5 inline-block rounded bg-amber-400/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-amber-400">
              Sample Data
            </span>
            You are viewing the demo with example cases and credentials.
          </p>
          <button
            onClick={() => setDemoMode(false)}
            className="rounded border border-zinc-700 px-3 py-1 text-xs text-zinc-400 hover:border-zinc-500 hover:text-zinc-200"
          >
            Exit Demo
          </button>
        </div>
      )}

      {/* ── Top bar ── */}
      <header className="flex items-center justify-between border-b border-zinc-800 px-5 py-3">
        <div className="flex items-center gap-8">
          <button
            onClick={() => setActiveView("cases")}
            className={`flex items-center gap-2 text-sm transition-colors ${
              activeView === "cases" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#34d399" }}
            />
            Cases
          </button>
          <button
            onClick={() => setActiveView("credentials")}
            className={`flex items-center gap-2 text-sm transition-colors ${
              activeView === "credentials" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#fbbf24" }}
            />
            Credentials
          </button>
          <button
            onClick={() => setActiveView("payments")}
            className={`flex items-center gap-2 text-sm transition-colors ${
              activeView === "payments" ? "text-white" : "text-zinc-500 hover:text-zinc-300"
            }`}
          >
            <span
              className="inline-block h-2 w-2 rounded-full"
              style={{ background: "#f87171" }}
            />
            Payments
          </button>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setDemoMode(!demoMode)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
              demoMode
                ? "border border-amber-700 bg-amber-950/60 text-amber-300"
                : "border border-zinc-700 text-zinc-500 hover:border-zinc-600 hover:text-zinc-300"
            }`}
          >
            {demoMode ? "Demo On" : "View Sample Flow"}
          </button>
          <WalletMultiButton />
          <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
            Devnet
          </span>
        </div>
      </header>

      {/* ── Body: sidebar + content ── */}
      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-56 flex-shrink-0 border-r border-zinc-800 p-4 md:block">
          {/* Navigation */}
          <div className="mb-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
              Navigation
            </div>
            {NAV_ITEMS.map((item, i) => (
              <button
                key={`${item.label}-${i}`}
                onClick={() => setActiveView(item.key)}
                className={`mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                  (i === 0 && activeView === "cases") ||
                  (i === 1 && activeView === "cases") ||
                  (i === 2 && activeView === "credentials")
                    ? activeView === item.key
                      ? i === 0
                        ? "bg-zinc-800 text-white"
                        : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                      : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                    : "text-zinc-400 hover:bg-zinc-800/50 hover:text-zinc-200"
                }`}
              >
                <span className="text-base opacity-60">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="mb-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
              Actions
            </div>
            {ACTION_ITEMS.map((item) => (
              <button
                key={item.label}
                onClick={() => setActiveView(item.key)}
                className="mb-0.5 flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-sm text-zinc-400 transition-colors hover:bg-zinc-800/50 hover:text-zinc-200"
              >
                <span className="text-base opacity-60">{item.icon}</span>
                {item.label}
              </button>
            ))}
          </div>

          {/* Wallet */}
          <div>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-zinc-600">
              Wallet
            </div>
            <div className="px-3 py-2 font-mono text-xs text-zinc-500">
              {walletLabel}
            </div>
            {connected && publicKey && balance !== null && (
              <div className="px-3 text-xs text-zinc-600">
                {balance.toFixed(4)} SOL
              </div>
            )}
          </div>
        </aside>

        {/* Main content */}
        <main className="flex-1 p-6 lg:p-8">
          {/* ── CASES VIEW ── */}
          {activeView === "cases" && (
            <div>
              <div className="mb-6 flex items-center justify-between">
                <h1 className="text-xl font-semibold text-white">
                  Active Cases
                </h1>
                <div className="flex gap-2">
                  <button className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300">
                    {"\u2195"} Sort
                  </button>
                  <button className="rounded-lg border border-zinc-800 px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:border-zinc-700 hover:text-zinc-300">
                    {"\u2298"} Filter
                  </button>
                </div>
              </div>
              <CaseList
                refreshKey={refreshKey}
                demoMode={demoMode}
              />
            </div>
          )}

          {/* ── CREDENTIALS VIEW ── */}
          {activeView === "credentials" && (
            <div>
              <h1 className="mb-6 text-xl font-semibold text-white">
                Your Credential
              </h1>
              <div className="max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
                <CredentialStatus
                  walletAddress={
                    publicKey?.toBase58() ??
                    "DemoWallet111111111111111111111111111111111"
                  }
                  demoMode={demoMode}
                />
              </div>
            </div>
          )}

          {/* ── PAYMENTS VIEW ── */}
          {activeView === "payments" && (
            <div>
              <h1 className="mb-6 text-xl font-semibold text-white">
                Claim Payment
              </h1>
              <ClaimPayment
                refreshKey={refreshKey}
                onClaimed={onClaimed}
                demoMode={demoMode}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
