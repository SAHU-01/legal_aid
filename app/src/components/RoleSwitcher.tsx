"use client";

import { useState, useEffect } from "react";

interface RoleSwitcherProps {
  role: "applicant" | "lawyer" | "operator";
  onRoleChange: (r: "applicant" | "lawyer" | "operator") => void;
  onExit: () => void;
  walletButton?: React.ReactNode;
  connected?: boolean;
}

const roles = [
  {
    key: "applicant" as const,
    label: "Applicant",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="12" y1="18" x2="12" y2="12" /><line x1="9" y1="15" x2="15" y2="15" />
      </svg>
    ),
    active: "bg-amber-950/50 text-amber-300 border-amber-700/50",
  },
  {
    key: "lawyer" as const,
    label: "Lawyer",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" />
      </svg>
    ),
    active: "bg-blue-950/50 text-blue-300 border-blue-700/50",
  },
  {
    key: "operator" as const,
    label: "Operator",
    icon: (
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
      </svg>
    ),
    active: "bg-emerald-950/50 text-emerald-300 border-emerald-700/50",
  },
] as const;

export default function RoleSwitcher({
  role,
  onRoleChange,
  onExit,
  walletButton,
  connected,
}: RoleSwitcherProps) {
  const [showToast, setShowToast] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowToast(false), 12000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Single merged navbar */}
      <header className="border-b border-zinc-800 bg-[#0f0f0f]">
        <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-2 flex items-center">
          {/* Left: Back + Logo */}
          <div className="flex-1 flex justify-start items-center gap-2">
            <a href="/" className="flex items-center justify-center h-6 w-6 rounded-full border border-zinc-700 hover:border-zinc-500 transition-colors" title="Back to home">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </a>
            <a href="/" className="flex items-center gap-2 flex-shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/adduce_logo.png" alt="Adduce" className="h-5 w-5 rounded" />
              <span className="text-sm font-semibold text-zinc-200">Adduce</span>
            </a>
          </div>

          {/* Center: Role pills */}
          <div className="flex-shrink-0 flex items-center gap-0.5 rounded-full border border-zinc-800 bg-zinc-900/60 p-0.5">
            {roles.map((r) => {
              const isActive = role === r.key;
              return (
                <button
                  key={r.key}
                  onClick={() => onRoleChange(r.key)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-medium transition-all border ${
                    isActive
                      ? r.active
                      : "text-zinc-500 hover:text-zinc-300 border-transparent"
                  }`}
                >
                  {r.icon}
                  {r.label}
                </button>
              );
            })}
          </div>

          {/* Right: Wallet + controls */}
          <div className="flex-1 flex justify-end items-center gap-2 flex-shrink-0">
            {/* Demo-only mode: no exit button, dashboard always shows demo data */}
            {walletButton}
            <span className="flex items-center gap-1 rounded-full border border-emerald-800/50 bg-emerald-950/40 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
              <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              Devnet
            </span>
          </div>
        </div>
      </header>

      {/* Bottom toast — auto-dismiss */}
      {showToast && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 max-w-lg">
          <div className="flex items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900/95 backdrop-blur px-4 py-2.5 shadow-2xl">
            <span className="text-[11px] text-zinc-400">
              <span className="text-zinc-300 font-medium">Reference UI.</span>{" "}
              In production, integrators embed Adduce SDK into existing portals.{" "}
              <a
                href="/docs#what-is-adduce"
                className="text-emerald-400 hover:underline"
              >
                Learn more
              </a>
            </span>
            <button
              onClick={() => setShowToast(false)}
              className="flex-shrink-0 text-zinc-600 hover:text-zinc-400"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
