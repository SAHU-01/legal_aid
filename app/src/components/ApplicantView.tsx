"use client";

import { useState } from "react";
import { MOCK_IDENTITIES, DEMO_CASES, LIFECYCLE_STEPS, CASE_PROGRESS } from "@/lib/demoData";
import CaseFlowGraph from "./CaseFlowGraph";

const PROGRESS_STEPS = [
  "Submitted",
  "Under Review",
  "Credential Issued",
  "Lawyer Assigned",
  "Closed",
  "Paid",
];

const FAQ_ITEMS = [
  {
    question: "What is a Berechtigungsschein?",
    answer:
      "A legal aid certificate issued by the court. It proves you are eligible for state-funded legal assistance.",
  },
  {
    question: "How long does the process take?",
    answer:
      "Typically 2-4 weeks from application to certificate issuance. With Adduce, the on-chain verification is instant.",
  },
  {
    question: "Do I need a blockchain wallet?",
    answer:
      "No. The blockchain layer is completely invisible to you. Your application flows through the court's existing process.",
  },
];

const SAMPLE_FORM = {
  description: "Tenant dispute with landlord regarding deposit return of 1,200 EUR. Landlord refuses to return security deposit after lease termination on 2026-03-15. All communication documented. Income below threshold for Beratungshilfe eligibility.",
  docs: ["Mietvertrag_2023.pdf", "Kuendigung_2026-01.pdf", "Einkommensnachweis.pdf"],
};

export default function ApplicantView() {
  const [showModal, setShowModal] = useState(false);
  const [openFaq, setOpenFaq] = useState<number[]>([]);
  const [caseDesc, setCaseDesc] = useState("");
  const [uploadedDocs, setUploadedDocs] = useState<string[]>([]);

  const applicant = MOCK_IDENTITIES.applicant;
  const activeCase = DEMO_CASES.find((c) => c.caseId === "CASE-BR-4521")!;
  const progress = CASE_PROGRESS["CASE-BR-4521"];
  const completedSteps = progress.completedSteps; // 1

  const toggleFaq = (index: number) => {
    setOpenFaq((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  return (
    <div className="space-y-10">
      {/* Header + CTA side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        {/* Header */}
        <div className="rounded-2xl border border-amber-800/30 bg-amber-950/10 p-6 flex items-center gap-5 shadow-sm">
          <div className="bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" className="text-amber-400 flex-shrink-0">
              <circle cx="12" cy="8" r="4" fill="currentColor" />
              <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xl font-bold text-zinc-100 tracking-tight">{applicant.name}</p>
            <p className="text-xs text-zinc-500 font-mono mt-1 opacity-80">{applicant.id}</p>
          </div>
          <span className="rounded-full bg-amber-600/10 border border-amber-700/30 px-4 py-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-widest">
            Applicant
          </span>
        </div>

        {/* CTA */}
        <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 flex flex-col justify-center transition-all hover:border-zinc-700 shadow-sm">
          <h2 className="text-base font-bold text-zinc-100">
            Request Berechtigungsschein
          </h2>
          <p className="text-xs text-zinc-500 mt-1 opacity-80">
            Apply for state-funded legal aid
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="mt-4 bg-amber-600 hover:bg-amber-500 text-white rounded-xl px-6 py-2 text-sm font-bold transition-all shadow-lg shadow-amber-900/20 active:scale-95"
          >
            Apply Here
          </button>
        </div>
      </div>

      {/* ─── Modal ─── */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-zinc-900 border border-zinc-700 rounded-xl p-6 w-full max-w-md">
            <div className="mb-4">
              <h3 className="text-base font-medium text-zinc-100">
                Request a Berechtigungsschein for your client
              </h3>
              <button
                onClick={() => {
                  setCaseDesc(SAMPLE_FORM.description);
                  setUploadedDocs(SAMPLE_FORM.docs);
                }}
                className="group inline-flex items-center gap-1 mt-2 rounded-md bg-amber-500/8 border border-amber-500/20 px-2 py-1 text-[10px] font-semibold text-amber-400 hover:bg-amber-500/15 hover:border-amber-500/35 hover:text-amber-300 transition-all duration-200"
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-200">
                  <path d="M15 4V2m0 2v2m0-2h2m-2 0h-2" /><path d="M8.5 8.5L3 14l-1 4 4-1 5.5-5.5" /><path d="M10 6l4.5 4.5" />
                </svg>
                Fill Sample
              </button>
            </div>

            <div className="space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Your Name</label>
                <input
                  type="text"
                  value="Max Mustermann"
                  readOnly
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 text-sm"
                />
              </div>

              {/* Case Description */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Case Description</label>
                <textarea
                  rows={3}
                  value={caseDesc}
                  onChange={(e) => setCaseDesc(e.target.value)}
                  placeholder="Describe your legal situation..."
                  className="w-full rounded-lg bg-zinc-800 border border-zinc-700 text-zinc-200 px-3 py-2 text-sm placeholder:text-zinc-600 resize-none"
                />
              </div>

              {/* Upload Documents */}
              <div>
                <label className="block text-xs text-zinc-400 mb-1">Upload Documents</label>
                {uploadedDocs.length > 0 ? (
                  <div className="space-y-1.5">
                    {uploadedDocs.map((doc) => (
                      <div key={doc} className="flex items-center gap-2 rounded-lg bg-zinc-800 border border-zinc-700 px-3 py-2">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-emerald-400 flex-shrink-0"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                        <span className="text-xs text-zinc-300">{doc}</span>
                        <span className="text-[9px] text-zinc-600 ml-auto">PDF</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="w-full rounded-lg bg-zinc-800 border border-zinc-700 border-dashed px-3 py-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-zinc-500 transition-colors">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" className="text-zinc-500">
                      <path d="M12 16V4m0 0l-4 4m4-4l4 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      <path d="M2 17l.621 2.485A2 2 0 004.561 21h14.878a2 2 0 001.94-1.515L22 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    <span className="text-xs text-zinc-500">Drag and drop or click to browse</span>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Buttons */}
            <div className="flex items-center justify-end gap-3 mt-6">
              <button
                onClick={() => { setShowModal(false); setCaseDesc(""); setUploadedDocs([]); }}
                className="rounded-lg border border-zinc-700 px-4 py-2 text-sm text-zinc-300 hover:border-zinc-500 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => { setShowModal(false); setCaseDesc(""); setUploadedDocs([]); }}
                className="rounded-lg bg-amber-600 hover:bg-amber-500 px-4 py-2 text-sm text-white font-medium transition-colors disabled:opacity-40"
                disabled={!caseDesc}
              >
                Submit Application
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2-column: Progress+Flow (left) + FAQ (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-8">

      {/* Left: Progress + Flow */}
      <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-zinc-100 mb-8 flex items-center gap-2">
          <span className="w-1 h-6 bg-amber-500 rounded-full"></span>
          Your Process
        </h2>

        {/* Horizontal steps */}
        <div className="flex items-center justify-between px-2 mb-10">
          {PROGRESS_STEPS.map((label, i) => {
            const isCompleted = i < completedSteps;
            const isCurrent = i === completedSteps;
            const isFuture = i > completedSteps;

            return (
              <div key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center relative">
                  {/* Circle */}
                  <div
                    className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold transition-all shadow-lg ${
                      isCompleted
                        ? "bg-emerald-500 text-white shadow-emerald-900/20"
                        : isCurrent
                          ? "bg-amber-500 text-white animate-pulse shadow-amber-900/20"
                          : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                    }`}
                  >
                    {isCompleted ? (
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    ) : (
                      i + 1
                    )}
                  </div>
                  {/* Label */}
                  <span
                    className={`absolute -bottom-7 text-[11px] font-bold text-center whitespace-nowrap leading-tight transition-colors ${
                      isCompleted
                        ? "text-emerald-400"
                        : isCurrent
                          ? "text-amber-400"
                          : "text-zinc-500"
                    }`}
                  >
                    {label}
                  </span>
                </div>
                {/* Connecting line */}
                {i < PROGRESS_STEPS.length - 1 && (
                  <div
                    className={`h-[2px] flex-1 mx-2 rounded-full ${
                      i < completedSteps
                        ? "bg-emerald-500"
                        : i === completedSteps - 1
                          ? "bg-amber-500/50"
                          : "bg-zinc-800"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Status callout */}
        <div className="bg-zinc-800/30 rounded-xl p-4 mt-12 border border-zinc-700/30">
          <p className="text-sm text-zinc-300 flex items-center gap-2">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            Your application has been submitted. The Amtsgericht is reviewing your eligibility.
          </p>
        </div>

        {/* CaseFlowGraph embed */}
        <div className="mt-8 border-t border-zinc-800/50 pt-8">
          <CaseFlowGraph
            completedSteps={1}
            steps={LIFECYCLE_STEPS.map((s) => ({ ...s, tx: "" }))}
            meta={{
              title: "Case CASE-BR-4521 Progress",
              reference: "CASE-BR-4521",
              court: "Amtsgericht",
              lawyer: "Pending",
              client: applicant.name,
              assistance: "Beratungshilfe",
            }}
          />
        </div>
      </div>

      {/* Right: FAQ */}
      <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 shadow-sm h-fit">
        <h2 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2">
          <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          Information
        </h2>

        <div className="space-y-1">
          {FAQ_ITEMS.map((item, i) => (
            <div key={i} className="border-b border-zinc-800/50 py-4 last:border-b-0">
              <button
                onClick={() => toggleFaq(i)}
                className="w-full flex items-center justify-between text-left group"
              >
                <span className="text-sm font-medium text-zinc-200 group-hover:text-white transition-colors">{item.question}</span>
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className={`text-zinc-500 transition-transform duration-200 ${
                    openFaq.includes(i) ? "rotate-180" : ""
                  }`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
              {openFaq.includes(i) && (
                <p className="text-xs text-zinc-400 mt-3 leading-relaxed bg-zinc-800/30 p-3 rounded-lg border border-zinc-700/20">{item.answer}</p>
              )}
            </div>
          ))}
        </div>
      </div>

      </div>
      {/* end grid */}
    </div>
  );
}
