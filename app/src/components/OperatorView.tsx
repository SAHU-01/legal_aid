"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MOCK_IDENTITIES,
  DEMO_CASES,
  STATUS_STYLE,
  formatDate,
  EXPLORER,
  LIFECYCLE_STEPS,
  CASE_PROGRESS,
} from "@/lib/demoData";
import CaseList from "./CaseList";
import ClaimPayment from "./ClaimPayment";
import CaseFlowGraph from "./CaseFlowGraph";

type ModalStep = 1 | 2 | 3;

type CaseTab = "InProgress" | "Closed";

export default function OperatorView() {
  const [modalOpen, setModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState<ModalStep>(1);
  const [activityRemark, setActivityRemark] = useState("");
  const [statusDecision, setStatusDecision] = useState("Approve");
  const [issueSuccess, setIssueSuccess] = useState(false);
  const [caseTab, setCaseTab] = useState<CaseTab>("InProgress");

  const pendingCases = DEMO_CASES.filter((c) => c.status === "Open");
  const closedCases = DEMO_CASES.filter((c) => c.status === "Closed");

  const openReviewModal = () => {
    setModalStep(1);
    setActivityRemark("");
    setStatusDecision("Approve");
    setIssueSuccess(false);
    setModalOpen(true);
  };

  const handleIssue = () => {
    setIssueSuccess(true);
    setTimeout(() => {
      setModalOpen(false);
      setIssueSuccess(false);
    }, 2000);
  };

  const stepLabels = ["Review", "Editing", "Verification"];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center gap-5 border border-emerald-800/30 bg-emerald-950/10 rounded-2xl p-6 mb-8 shadow-sm">
        <div className="bg-emerald-500/10 p-3 rounded-xl border border-emerald-500/20">
          <svg className="w-8 h-8 text-emerald-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25a2.25 2.25 0 0 1-2.25-2.25v-2.25Z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-xl font-bold text-zinc-100 tracking-tight">{MOCK_IDENTITIES.operator.name}</h2>
          <p className="font-mono text-xs text-zinc-500 mt-1 opacity-80">{MOCK_IDENTITIES.operator.id}</p>
        </div>
        <span className="px-4 py-1.5 text-[11px] font-bold rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase tracking-widest">Court Operator</span>
      </div>

      {/* Section 1: Pending Applications */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-zinc-100">
            Pending Applications
          </h3>
          <span className="px-2.5 py-0.5 text-xs font-bold rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
            {pendingCases.length}
          </span>
        </div>

        {pendingCases.map((c) => (
          <div
            key={c.caseId}
            className="group border border-zinc-800 rounded-2xl bg-zinc-900/40 p-6 transition-all hover:border-zinc-700 hover:bg-zinc-900/60"
          >
            <div className="flex items-center justify-between gap-6">
              <div className="flex-1">
                <p className="text-lg font-bold text-zinc-100 tracking-tight">
                  {c.caseId}
                </p>
                <p className="text-sm text-zinc-500 mt-2 flex items-center gap-2">
                  <span className="bg-zinc-800/50 px-2 py-0.5 rounded text-zinc-400">Jurisdiction: {c.jurisdiction || "---"}</span>
                  <span className="text-zinc-700">•</span>
                  <span>Filed: {formatDate(c.createdAt)}</span>
                </p>
              </div>
              <button
                onClick={openReviewModal}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20 active:scale-95"
              >
                Review Application (SDK required)
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* 3-Step Working Procedure Modal */}
      <AnimatePresence>
        {modalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setModalOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Step Indicator */}
              <div className="flex items-center justify-center gap-0 mb-8">
                {stepLabels.map((label, i) => (
                  <div key={label} className="flex items-center">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          modalStep >= (i + 1)
                            ? "bg-emerald-600 text-white"
                            : "bg-zinc-700 text-zinc-400"
                        }`}
                      >
                        {i + 1}
                      </div>
                      <span
                        className={`text-xs mt-1 ${
                          modalStep >= (i + 1)
                            ? "text-emerald-400"
                            : "text-zinc-500"
                        }`}
                      >
                        {label}
                      </span>
                    </div>
                    {i < stepLabels.length - 1 && (
                      <div
                        className={`w-12 h-0.5 mx-2 mt-[-12px] ${
                          modalStep > (i + 1)
                            ? "bg-emerald-600"
                            : "bg-zinc-700"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>

              {/* Step Content */}
              <AnimatePresence mode="wait">
                {modalStep === 1 && (
                  <motion.div
                    key="step1"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <h4 className="text-base font-semibold text-zinc-100 mb-4">
                      Case Review
                    </h4>
                    <div className="space-y-2 text-sm text-zinc-300">
                      <p>
                        <span className="text-zinc-500">Case ID:</span>{" "}
                        CASE-BR-4521
                      </p>
                      <p>
                        <span className="text-zinc-500">Applicant:</span> Max
                        Mustermann
                      </p>
                      <p>
                        <span className="text-zinc-500">Filed:</span>{" "}
                        {formatDate(
                          pendingCases[0]?.createdAt || Math.floor(Date.now() / 1000)
                        )}
                      </p>
                      <p>
                        <span className="text-zinc-500">Jurisdiction:</span> BR
                      </p>
                    </div>

                    <div className="mt-5">
                      <p className="text-sm font-medium text-zinc-200 mb-2">
                        Submitted Documents
                      </p>
                      <ul className="space-y-1.5">
                        {["Form789.pdf", "Income_Statement.pdf", "ID_Copy.pdf"].map(
                          (doc) => (
                            <li
                              key={doc}
                              className="flex items-center gap-2 text-sm text-zinc-400"
                            >
                              <svg
                                className="w-4 h-4 text-zinc-500"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.5}
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z"
                                />
                              </svg>
                              {doc}
                            </li>
                          )
                        )}
                      </ul>
                    </div>

                    <button
                      onClick={() => setModalStep(2)}
                      className="mt-6 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {modalStep === 2 && (
                  <motion.div
                    key="step2"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-base font-semibold text-zinc-100">
                        Editing
                      </h4>
                      <button
                        onClick={() => {
                          setActivityRemark("Application reviewed. Income documentation verified. Applicant meets eligibility threshold under BeratHiG. Berechtigungsschein approved for consultation and representation.");
                          setStatusDecision("Approve");
                        }}
                        className="group flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500/10 to-emerald-400/5 border border-emerald-500/25 px-3 py-1.5 text-[11px] font-semibold text-emerald-400 hover:from-emerald-500/20 hover:to-emerald-400/10 hover:border-emerald-500/40 hover:text-emerald-300 transition-all duration-200 shadow-sm shadow-emerald-900/10"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-12 transition-transform duration-200">
                          <path d="M15 4V2m0 2v2m0-2h2m-2 0h-2" /><path d="M8.5 8.5L3 14l-1 4 4-1 5.5-5.5" /><path d="M10 6l4.5 4.5" />
                        </svg>
                        Fill Sample
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">
                          Activity Remark
                        </label>
                        <textarea
                          value={activityRemark}
                          onChange={(e) => setActivityRemark(e.target.value)}
                          rows={3}
                          placeholder="Add notes about this application..."
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 resize-none"
                        />
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">
                          Status Decision
                        </label>
                        <select
                          value={statusDecision}
                          onChange={(e) => setStatusDecision(e.target.value)}
                          className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-zinc-200 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
                        >
                          <option value="Approve">Approve</option>
                          <option value="Reject">Reject</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm text-zinc-400 mb-1">
                          Upload Credential Document
                        </label>
                        <div className="border-2 border-dashed border-zinc-700 rounded-lg p-6 text-center hover:border-emerald-600/50 transition-colors cursor-pointer">
                          <svg
                            className="w-8 h-8 text-zinc-500 mx-auto mb-2"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5"
                            />
                          </svg>
                          <p className="text-xs text-zinc-500">
                            Drag & drop or click to upload
                          </p>
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => setModalStep(3)}
                      className="mt-6 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Continue
                    </button>
                  </motion.div>
                )}

                {modalStep === 3 && (
                  <motion.div
                    key="step3"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    {!issueSuccess ? (
                      <>
                        <h4 className="text-base font-semibold text-zinc-100 mb-4">
                          Verification
                        </h4>

                        <div className="space-y-2 text-sm text-zinc-300 bg-zinc-800/50 rounded-lg p-4">
                          <p>
                            <span className="text-zinc-500">Case:</span>{" "}
                            CASE-BR-4521
                          </p>
                          <p>
                            <span className="text-zinc-500">Decision:</span>{" "}
                            {statusDecision}
                          </p>
                          {activityRemark && (
                            <p>
                              <span className="text-zinc-500">Remark:</span>{" "}
                              {activityRemark}
                            </p>
                          )}
                          <p>
                            <span className="text-zinc-500">Jurisdiction:</span>{" "}
                            BR
                          </p>
                        </div>

                        <button
                          onClick={handleIssue}
                          className="mt-6 w-full px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                        >
                          Issue Berechtigungsschein
                        </button>
                      </>
                    ) : (
                      <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex flex-col items-center py-8"
                      >
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{
                            type: "spring",
                            stiffness: 200,
                            damping: 12,
                          }}
                        >
                          <svg
                            className="w-16 h-16 text-emerald-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                            />
                          </svg>
                        </motion.div>
                        <p className="mt-4 text-base font-medium text-emerald-400">
                          Berechtigungsschein Issued
                        </p>
                        <p className="text-xs text-zinc-500 mt-1">
                          Credential anchored on-chain
                        </p>
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 2-column: Cases (left) + Disbursements (right) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6 mt-10">

        {/* Left: Tabbed case list */}
        <div>
          {/* Tabs */}
          <div className="flex gap-4 border-b border-zinc-800/50 mb-6">
            {([
              { label: "In Progress", filter: "InProgress" as CaseTab },
              { label: "Completed", filter: "Closed" as CaseTab },
            ]).map((tab) => (
              <button
                key={tab.label}
                onClick={() => setCaseTab(tab.filter)}
                className={`px-1 py-3 text-sm font-bold transition-all relative ${
                  caseTab === tab.filter
                    ? "text-emerald-400"
                    : "text-zinc-500 hover:text-zinc-300"
                }`}
              >
                {tab.label}
                {caseTab === tab.filter && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400 rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Cases */}
          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl overflow-hidden">
            <CaseList
              demoMode={true}
              statusFilter={caseTab === "Closed" ? "Paid" : "InProgress"}
            />
          </div>
        </div>

        {/* Right: Disbursement + Payment */}
        <div className="space-y-6">
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-5 shadow-sm">
            <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Disbursement Queue
            </h3>
            <div className="space-y-3">
              {closedCases.map((c) => (
                <div key={c.caseId} className="group flex items-center justify-between rounded-xl bg-zinc-800/30 p-4 border border-zinc-700/30 hover:border-emerald-500/30 transition-all">
                  <div>
                    <p className="text-sm font-bold text-zinc-100">{c.caseId}</p>
                    <p className="text-[11px] text-zinc-500 mt-1">
                      {MOCK_IDENTITIES.lawyer.name} • <span className="text-emerald-400 font-bold">50 USDC</span>
                    </p>
                  </div>
                  <button className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold rounded-lg transition-all active:scale-95 shadow-lg shadow-emerald-900/10">
                    Approve
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div className="border border-zinc-800 rounded-2xl bg-zinc-900/40 p-5 shadow-sm">
            <h3 className="text-md font-bold text-zinc-100 mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              Payment History
            </h3>
            <div className="bg-zinc-800/20 rounded-xl overflow-hidden">
              <ClaimPayment refreshKey={0} onClaimed={() => {}} demoMode={true} operatorMode={true} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
