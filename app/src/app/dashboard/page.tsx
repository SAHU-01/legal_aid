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

  const [demoToast, setDemoToast] = useState(false);

  const interceptDemoClicks = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const btn = target.closest("button");
    if (!btn) return;
    // Allow tab/filter buttons (they just switch UI state)
    const text = btn.textContent?.toLowerCase() || "";
    const allowList = ["all cases", "in progress", "completed", "closed", "paid", "open", "fill sample", "applicant", "lawyer", "operator"];
    if (allowList.some((a) => text.includes(a))) return;
    // Block all other buttons
    e.preventDefault();
    e.stopPropagation();
    setDemoToast(true);
    setTimeout(() => setDemoToast(false), 2500);
  };

  /* ── Demo mode: role-based views ── */
  return (
    <div className="flex min-h-screen flex-col bg-[#0f0f0f] text-zinc-100">
      {/* Single merged navbar: logo + role pills + wallet */}
      <RoleSwitcher
        role={role}
        onRoleChange={setRole}
        onExit={() => {}}
        walletButton={<WalletMultiButton />}
        connected={connected}
      />

      {/* Demo banner */}
      <div className="w-full border-b border-amber-800/30 bg-amber-950/20 px-6 py-2 text-center text-[11px] text-amber-400/80">
        Preview: Sample data showing how a court, lawyer, and citizen interact with Adduce. No real government data. Integrate for real via{" "}
        <a href="https://www.npmjs.com/package/@adduce/sdk" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">
          @adduce/sdk
        </a>
      </div>

      {/* Demo toast */}
      {demoToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-lg border border-amber-700/50 bg-amber-950/95 px-4 py-2 text-xs text-amber-300 shadow-lg backdrop-blur-sm">
          Preview only. Use <code className="text-amber-200">@adduce/sdk</code> to perform real actions.
        </div>
      )}

      {/* Role-dispatched view — intercept action button clicks */}
      <main
        className="flex-1 px-4 py-6 sm:px-6 lg:px-10 max-w-[1400px] mx-auto w-full"
        onClickCapture={interceptDemoClicks}
      >
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
