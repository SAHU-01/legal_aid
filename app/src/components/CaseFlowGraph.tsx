"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

type FlowRole = "court" | "lawyer" | "protocol";

interface FlowStep {
  label: string;
  tx: string;
  role: FlowRole;
  detail?: string;
}

interface FlowMeta {
  title: string;
  reference: string;
  court: string;
  lawyer: string;
  client: string;
  assistance: string;
}

const EXPLORER = "https://explorer.solana.com";

const ROLE_STYLE: Record<
  FlowRole,
  {
    bg: string;
    bgActive: string;
    border: string;
    borderActive: string;
    text: string;
    badge: string;
    badgeText: string;
    label: string;
    ring: string;
    dot: string;
  }
> = {
  court: {
    bg: "bg-zinc-900/40",
    bgActive: "bg-emerald-950/40",
    border: "border-zinc-800",
    borderActive: "border-emerald-500/40",
    text: "text-emerald-300",
    badge: "bg-emerald-500/15",
    badgeText: "text-emerald-400",
    label: "Court Operator",
    ring: "ring-emerald-500/20",
    dot: "bg-emerald-400",
  },
  lawyer: {
    bg: "bg-zinc-900/40",
    bgActive: "bg-blue-950/40",
    border: "border-zinc-800",
    borderActive: "border-blue-500/40",
    text: "text-blue-300",
    badge: "bg-blue-500/15",
    badgeText: "text-blue-400",
    label: "Lawyer",
    ring: "ring-blue-500/20",
    dot: "bg-blue-400",
  },
  protocol: {
    bg: "bg-zinc-900/40",
    bgActive: "bg-purple-950/40",
    border: "border-zinc-800",
    borderActive: "border-purple-500/40",
    text: "text-purple-300",
    badge: "bg-purple-500/15",
    badgeText: "text-purple-400",
    label: "Protocol / Agent",
    ring: "ring-purple-500/20",
    dot: "bg-purple-400",
  },
};

const STEP_DESCRIPTIONS: string[] = [
  "The applicant (citizen) files a petition at the Amtsgericht requesting legal aid. The court opens the case on-chain, creating a CaseFile PDA. Status: Open.",
  "The court operator (Rechtspfleger) reviews the applicant\u2019s eligibility based on income and case merits. This is the 3-step Work Procedure: Review, Editing, Verification.",
  "Once approved, the operator issues a Berechtigungsschein as an on-chain SAS credential. This digital certificate proves the lawyer is authorized to take the case.",
  "The assigned lawyer submits case documents (Abrechnungsvordruck, Vollmacht). The system computes a SHA-256 hash and anchors it on-chain. No PII stored. Status: InProgress.",
  "The court operator reviews the lawyer\u2019s submitted work and closes the case. The lawyer can now claim payment. Status: Closed.",
  "The protocol agent transfers USDC from the court treasury to the lawyer\u2019s token account. Instant settlement \u2014 no 6-month wait.",
  "The case is marked Paid on-chain. This is the terminal state \u2014 a permanent, immutable, auditable record of the entire lifecycle.",
];

const AUTO_PLAY_INTERVAL = 3000;

export default function CaseFlowGraph({
  steps,
  meta,
  completedSteps,
}: {
  steps: FlowStep[];
  meta: FlowMeta;
  completedSteps?: number;
}) {
  const maxStep = completedSteps !== undefined ? completedSteps - 1 : steps.length - 1;
  const isPartial = completedSteps !== undefined && completedSteps < steps.length;

  const [activeStep, setActiveStep] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(true);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (!isPlaying) return;
    const delay = activeStep === -1 ? 600 : activeStep >= maxStep ? AUTO_PLAY_INTERVAL + 1500 : AUTO_PLAY_INTERVAL;
    const timer = setTimeout(() => {
      setActiveStep((prev) => {
        if (prev >= maxStep) {
          setHasCompleted(true);
          return -1;
        }
        return prev + 1;
      });
    }, delay);
    return () => clearTimeout(timer);
  }, [activeStep, isPlaying, maxStep]);

  const topRow = steps.slice(0, 4);
  const bottomRow = steps.slice(4);
  const currentStep = steps[activeStep];
  const currentDesc = STEP_DESCRIPTIONS[activeStep];

  return (
    <div className="py-1">
      {/* Title bar */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-5"
      >
        <div className="flex items-center gap-2 mb-1.5">
          <span className="inline-block h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-bold uppercase tracking-[0.15em] text-emerald-400/80">
            {meta.title}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-zinc-500">
          <span className="text-zinc-300 font-medium">{meta.lawyer}</span>
          <span className="text-zinc-700">/</span>
          <span>Ref. {meta.reference}</span>
          <span className="text-zinc-700">/</span>
          <span>{meta.court}</span>
          <span className="text-zinc-700">/</span>
          <span>Client: {meta.client}</span>
          <span className="text-zinc-700">/</span>
          <span>{meta.assistance}</span>
        </div>
      </motion.div>

      {/* Flow graph */}
      <div className="relative overflow-x-auto pb-2 -mx-1">
        <div style={{ minWidth: 880, padding: "14px 8px 8px" }}>
          {/* Top row */}
          <div className="flex items-center">
            {topRow.map((step, i) => (
              <div key={i} className="flex items-center">
                <FlowNode
                  step={step}
                  index={i}
                  isActive={activeStep === i}
                  isReached={activeStep >= i}
                  isFuture={i > maxStep}
                  onClick={() => {
                    if (i <= maxStep) { setIsPlaying(false); setActiveStep(i); }
                  }}
                />
                {i < topRow.length - 1 && (
                  <FlowEdge reached={activeStep > i} />
                )}
              </div>
            ))}
          </div>

          {/* Bottom row */}
          <div className="flex items-center mt-7">
            {[...bottomRow].reverse().map((step, visualIdx) => {
              const globalIdx = steps.length - 1 - visualIdx;
              return (
                <div key={globalIdx} className="flex items-center">
                  <FlowNode
                    step={step}
                    index={globalIdx}
                    isActive={activeStep === globalIdx}
                    isReached={activeStep >= globalIdx}
                    isFuture={globalIdx > maxStep}
                    onClick={() => {
                      if (globalIdx <= maxStep) { setIsPlaying(false); setActiveStep(globalIdx); }
                    }}
                  />
                  {visualIdx < bottomRow.length - 1 && (
                    <FlowEdge reached={activeStep > globalIdx} reversed />
                  )}
                </div>
              );
            })}
            <FlowEdgeTurn reached={activeStep >= 4} />
          </div>
        </div>
      </div>

      {/* Description callout */}
      <div className="mt-4 min-h-[52px]">
        <AnimatePresence mode="wait">
          {currentStep && currentDesc && (
            <motion.div
              key={activeStep}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.2 }}
              className={`rounded-xl border px-4 py-3 backdrop-blur-sm ${
                ROLE_STYLE[currentStep.role].borderActive
              } ${ROLE_STYLE[currentStep.role].bgActive}`}
            >
              <div className="flex items-center gap-2 mb-1.5">
                <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold text-white ${
                  ROLE_STYLE[currentStep.role].dot
                }`} style={{ opacity: 0.85 }}>
                  {activeStep + 1}
                </span>
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${ROLE_STYLE[currentStep.role].badge} ${ROLE_STYLE[currentStep.role].badgeText}`}
                >
                  {ROLE_STYLE[currentStep.role].label}
                </span>
                <span className="text-[12px] font-semibold text-zinc-200">
                  {currentStep.label}
                </span>
              </div>
              <p className="text-[11px] leading-[1.6] text-zinc-400 pl-7">
                {currentDesc}
              </p>
              {currentStep.tx && (
                <a
                  href={`${EXPLORER}/tx/${currentStep.tx}?cluster=devnet`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1.5 block pl-7 font-mono text-[10px] text-blue-400/50 hover:text-blue-400 truncate transition-colors"
                >
                  tx: {currentStep.tx}
                </a>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="mt-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              if (hasCompleted) {
                setActiveStep(-1);
                setHasCompleted(false);
              }
              setIsPlaying(!isPlaying);
            }}
            className="flex items-center gap-1.5 rounded-lg border border-zinc-700/50 bg-zinc-800/40 px-3 py-1.5 text-[11px] font-medium text-zinc-400 hover:border-zinc-600 hover:text-zinc-200 hover:bg-zinc-800/60 transition-all"
          >
            {isPlaying ? (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21" />
              </svg>
            )}
            {isPlaying ? "Pause" : hasCompleted ? "Replay" : "Play"}
          </button>

          <div className="flex items-center gap-1">
            {steps.map((_, i) => {
              const beyondMax = i > maxStep;
              return (
                <button
                  key={i}
                  onClick={() => {
                    if (!beyondMax) {
                      setIsPlaying(false);
                      setActiveStep(i);
                    }
                  }}
                  className={`rounded-full transition-all duration-300 ${
                    beyondMax
                      ? "h-1.5 w-1.5 bg-zinc-800 cursor-not-allowed"
                      : i === activeStep
                        ? "h-2 w-5 bg-emerald-400"
                        : i <= activeStep
                          ? "h-1.5 w-1.5 bg-emerald-400/40"
                          : "h-1.5 w-1.5 bg-zinc-700 hover:bg-zinc-600"
                  }`}
                />
              );
            })}
          </div>
        </div>

        <AnimatePresence>
          {hasCompleted && (
            <motion.span
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[11px] font-medium ${
                isPartial
                  ? "border-amber-800/30 bg-amber-950/20 text-amber-400"
                  : "border-emerald-800/30 bg-emerald-950/20 text-emerald-400"
              }`}
            >
              {isPartial ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {completedSteps} of {steps.length} steps completed
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  All {steps.length} transactions verified on Devnet
                </>
              )}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

/* ── Flow Node ── */
function FlowNode({
  step,
  index,
  isActive,
  isReached,
  isFuture,
  onClick,
}: {
  step: FlowStep;
  index: number;
  isActive: boolean;
  isReached: boolean;
  isFuture?: boolean;
  onClick: () => void;
}) {
  const style = ROLE_STYLE[step.role];
  const delay = index * 0.06;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 8 }}
      animate={{ opacity: isFuture ? 0.3 : 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.25, ease: "easeOut" }}
      onClick={isFuture ? undefined : onClick}
      className={`relative flex flex-col rounded-xl border transition-all duration-300 ${
        isFuture
          ? "bg-zinc-900/20 border-zinc-800/20 cursor-default"
          : isActive
            ? `${style.bgActive} ${style.borderActive} ring-1 ${style.ring} shadow-lg cursor-pointer`
            : isReached
              ? `${style.bgActive} ${style.borderActive} cursor-pointer`
              : `${style.bg} ${style.border} hover:border-zinc-700 cursor-pointer`
      }`}
      style={{ width: 180, minHeight: 84, padding: "12px 14px" }}
    >
      {/* Step number pill */}
      <div
        className={`absolute -top-2.5 -left-2 flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-bold transition-colors duration-300 shadow-sm ${
          isReached
            ? `${style.dot} text-white`
            : "bg-zinc-800 border border-zinc-700 text-zinc-500"
        }`}
      >
        {isReached ? (
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          index + 1
        )}
      </div>

      {/* Role badge */}
      <span
        className={`self-start rounded-md px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-[0.1em] mb-2 transition-opacity duration-300 ${style.badge} ${style.badgeText} ${
          isReached ? "opacity-100" : "opacity-35"
        }`}
      >
        {style.label}
      </span>

      {/* Label */}
      <span
        className={`text-[11px] font-semibold leading-snug transition-colors duration-300 ${
          isReached ? style.text : "text-zinc-600"
        }`}
      >
        {step.label}
      </span>

      {/* Detail */}
      {step.detail && (
        <span
          className={`mt-1.5 text-[10px] leading-tight truncate transition-opacity duration-300 ${
            isReached ? "text-zinc-500" : "text-zinc-700 opacity-40"
          }`}
        >
          {step.detail}
        </span>
      )}

      {/* Active indicator line at bottom */}
      {isActive && (
        <motion.div
          className={`absolute bottom-0 left-3 right-3 h-[2px] rounded-full ${style.dot}`}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 0.3 }}
          style={{ opacity: 0.7 }}
        />
      )}
    </motion.div>
  );
}

/* ── Flow Edge (arrow connector) ── */
function FlowEdge({ reached, reversed }: { reached: boolean; reversed?: boolean }) {
  return (
    <div className="flex items-center px-0.5">
      <div className="flex items-center">
        {reversed && (
          <svg
            width="6"
            height="8"
            viewBox="0 0 6 8"
            className={`transition-colors duration-500 ${
              reached ? "text-emerald-500/40" : "text-zinc-700/60"
            }`}
            style={{ transform: "rotate(180deg)" }}
          >
            <path d="M0 0 L6 4 L0 8" fill="currentColor" />
          </svg>
        )}
        <div
          className={`transition-colors duration-500 ${
            reached ? "bg-emerald-500/40" : "bg-zinc-700/40"
          }`}
          style={{ height: 1, width: 28 }}
        />
        {!reversed && (
          <svg
            width="6"
            height="8"
            viewBox="0 0 6 8"
            className={`transition-colors duration-500 ${
              reached ? "text-emerald-500/40" : "text-zinc-700/60"
            }`}
          >
            <path d="M0 0 L6 4 L0 8" fill="currentColor" />
          </svg>
        )}
      </div>
    </div>
  );
}

/* ── Turn Connector (U-bend from top row to bottom row) ── */
function FlowEdgeTurn({ reached }: { reached: boolean }) {
  const color = reached ? "rgba(16,185,129,0.35)" : "rgba(63,63,70,0.4)";
  return (
    <div className="flex items-start px-0.5" style={{ marginTop: -52 }}>
      <svg width="40" height="100" viewBox="0 0 40 100" fill="none">
        <path
          d={`M36 0 L36 80 Q36 88 28 88 L8 88`}
          stroke={color}
          strokeWidth="1"
          fill="none"
          style={{ transition: "stroke 0.5s" }}
        />
        <polygon points="2,88 10,83 10,93" fill={color} style={{ transition: "fill 0.5s" }} />
      </svg>
    </div>
  );
}
