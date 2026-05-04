"use client";

import { Suspense, useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { useRole } from "@/hooks/useRole";
import RoleSwitcher from "@/components/RoleSwitcher";
import ApplicantView from "@/components/ApplicantView";
import LawyerView from "@/components/LawyerView";
import OperatorView from "@/components/OperatorView";
import WhyThisMatters from "@/components/WhyThisMatters";
import CaseList from "@/components/CaseList";
import ClaimPayment from "@/components/ClaimPayment";
import CredentialStatus from "@/components/CredentialStatus";

function DashboardInner() {
  const { publicKey, connected } = useWallet();
  const { role, setRole } = useRole();
  const [mounted, setMounted] = useState(false);
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-zinc-400">
        Loading&hellip;
      </div>
    );
  }

  /* ── Connected wallet: real mode (lawyer-only) ── */
  if (connected && !demoMode) {
    return (
      <div className="flex min-h-screen flex-col bg-[#0f0f0f] text-zinc-100">
        <header className="border-b border-zinc-800 bg-[#0f0f0f]">
          <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-3 flex items-center">
            <div className="flex-1 flex justify-start">
              <a href="/" className="flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/adduce_logo.png" alt="Adduce" className="h-6 w-6 rounded" />
                <span className="text-sm font-semibold text-zinc-200">Adduce</span>
              </a>
            </div>
            <div className="flex-1 flex justify-end items-center gap-3">
              <button
                onClick={() => setDemoMode(true)}
                className="rounded-full border border-zinc-700 px-3 py-1 text-xs text-zinc-500 hover:border-zinc-500 hover:text-zinc-300"
              >
                View Demo
              </button>
              <WalletMultiButton />
              <span className="flex items-center gap-1.5 rounded-full border border-emerald-800/50 bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-400">
                <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
                Devnet
              </span>
            </div>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 max-w-[1400px] mx-auto w-full">
          <h1 className="text-xl font-semibold text-white mb-6">Active Cases</h1>
          <CaseList refreshKey={0} demoMode={false} />
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Your Credential</h2>
            <div className="max-w-xl rounded-xl border border-zinc-800 bg-zinc-900/50 p-6">
              <CredentialStatus
                walletAddress={publicKey?.toBase58() ?? ""}
                demoMode={false}
              />
            </div>
          </div>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-white mb-4">Claim Payment</h2>
            <ClaimPayment refreshKey={0} onClaimed={() => {}} demoMode={false} />
          </div>
        </main>
      </div>
    );
  }

  /* ── Demo mode: role-based views ── */
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f0f] text-zinc-100">
      {/* Single merged navbar: logo + role pills + wallet */}
      <RoleSwitcher
        role={role}
        onRoleChange={setRole}
        onExit={() => setDemoMode(false)}
        walletButton={<WalletMultiButton />}
        connected={connected}
      />

      {/* Role-dispatched view */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10 max-w-[1400px] mx-auto w-full">
        {role === "applicant" && <ApplicantView />}
        {role === "lawyer" && <LawyerView />}
        {role === "operator" && <OperatorView />}
      </main>

      {/* Shared bottom panel */}
      <WhyThisMatters />
    </div>
  );
}

export default function Dashboard() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-[#0f0f0f] text-zinc-400">
          Loading&hellip;
        </div>
      }
    >
      <DashboardInner />
    </Suspense>
  );
}
