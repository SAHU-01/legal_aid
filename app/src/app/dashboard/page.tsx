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
        Demo Mode: Sample data showing how a court, lawyer, and citizen interact with Adduce. No real government data. Integrate for real via{" "}
        <a href="https://www.npmjs.com/package/@adduce/sdk" target="_blank" rel="noopener noreferrer" className="underline text-amber-300">
          @adduce/sdk
        </a>
      </div>

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
