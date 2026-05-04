"use client";

import { useState } from "react";
import { MOCK_IDENTITIES } from "@/lib/demoData";
import CaseList from "./CaseList";
import CredentialStatus from "./CredentialStatus";
import ClaimPayment from "./ClaimPayment";

type TabFilter = null | "InProgress" | "Closed" | "Paid";

export default function LawyerView() {
  const [statusFilter, setStatusFilter] = useState<TabFilter>(null);
  const [clientName, setClientName] = useState("");
  const [referenceNumber, setReferenceNumber] = useState("");

  const tabs: { label: string; filter: TabFilter }[] = [
    { label: "All Cases", filter: null },
    { label: "In Progress", filter: "InProgress" },
    { label: "Closed", filter: "Closed" },
    { label: "Paid", filter: "Paid" },
  ];

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center gap-5 border border-blue-800/30 bg-blue-950/10 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
          <svg className="w-8 h-8 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{MOCK_IDENTITIES.lawyer.name}</h2>
          <p className="font-mono text-xs text-zinc-500 mt-1 opacity-80">{MOCK_IDENTITIES.lawyer.id}</p>
        </div>
        <span className="px-4 py-1.5 text-[11px] font-bold rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 uppercase tracking-widest">Lawyer</span>
      </div>

      {/* 2-column layout: Cases (left) + Sidebar panels (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">

        {/* Left column: Case table */}
        <div>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-800/50 mb-6">
            {tabs.map((tab) => (
              <button
                key={tab.label}
                onClick={() => setStatusFilter(tab.filter)}
                className={`px-1 py-3 text-sm font-bold transition-all relative ${
                  statusFilter === tab.filter
                    ? "text-blue-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {statusFilter === tab.filter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Cases */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
            <CaseList
              demoMode={true}
              statusFilter={statusFilter}
              autoExpandId="BS-DE-143/22"
            />
          </div>
        </div>

        {/* Right column: Verify + Payment */}
        <div className="space-y-6">

          {/* Verify Berechtigungsschein */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 shadow-sm">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-md font-bold text-zinc-100 flex items-center gap-2">
                <svg className="w-5 h-5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
                Verify Credential
              </h3>
              <button
                onClick={() => { setClientName("Max Mustermann"); setReferenceNumber("BS-DE-143/22"); }}
                className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500/10 to-blue-400/5 border border-blue-500/25 px-3 py-1.5 text-[11px] font-semibold text-blue-400 hover:from-blue-500/20 hover:to-blue-400/10 hover:border-blue-500/40 hover:text-blue-300 transition-all duration-200 shadow-sm shadow-blue-900/10"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-200">
                  <path d="M15 4V2m0 2v2m0-2h2m-2 0h-2" /><path d="M8.5 8.5L3 14l-1 4 4-1 5.5-5.5" /><path d="M10 6l4.5 4.5" />
                </svg>
                Fill Sample
              </button>
            </div>
            <div className="space-y-3 mb-5">
              <input
                type="text"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Client name"
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="Reference number"
                className="w-full px-3 py-2 bg-zinc-800/50 border border-zinc-700/50 rounded-xl text-zinc-200 text-sm placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
              />
              <button className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-blue-900/20 active:scale-95">
                Verify On-Chain
              </button>
            </div>
            <div className="border-t border-zinc-800/50 pt-5">
              <CredentialStatus walletAddress="" demoMode={true} guideActive={false} />
            </div>
          </div>

          {/* Payment */}
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 shadow-sm">
            <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
              Payments
            </h3>
            <div className="bg-zinc-800/20 rounded-xl overflow-hidden">
              <ClaimPayment refreshKey={0} onClaimed={() => {}} demoMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
