"use client";

type View = "cases" | "credentials" | "payments";

interface GuideStep {
  view: View;
  title: string;
  annotation: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    view: "cases",
    title: "Your Active Cases",
    annotation:
      "You are viewing this as a Lawyer. These are legal aid cases assigned to your wallet. Click BS-DE-143/22 to see the full on-chain Berechtigungsschein flow with every transaction verified on Solana Explorer.",
  },
  {
    view: "cases",
    title: "The German BS Flow",
    annotation:
      "This case completed all 7 on-chain steps. Each step shows who performed it (Court, Lawyer, or Protocol), the Solana transaction, and PDA addresses. Every checkmark is a real devnet transaction you can verify right now.",
  },
  {
    view: "credentials",
    title: "Your SAS Credential",
    annotation:
      "This is your Berechtigungsschein in digital form \u2014 an on-chain proof that you are authorized to take legal aid cases. The court issued it. Any system can verify it instantly. Without a valid credential, payment claims are rejected.",
  },
  {
    view: "payments",
    title: "Claim Payment",
    annotation:
      "CASE-DE-2847 is in Closed status \u2014 the court has finished review. You can claim your payment now. The system verifies your SAS credential and the USDC transfer, then marks the case as Paid.",
  },
  {
    view: "cases",
    title: "Lifecycle Complete",
    annotation:
      "You have walked through the complete Berechtigungsschein flow: Credential Issued \u2192 Case Opened \u2192 Documents Anchored \u2192 Case Closed \u2192 Payment Claimed. Every step produced a verifiable on-chain transaction. View the full documentation for setup instructions.",
  },
];

const LIFECYCLE_PHASES = [
  "Credential",
  "Case Open",
  "Documents",
  "Close",
  "Payment",
  "Paid",
];

export default function DemoGuide({
  step,
  setStep,
  setActiveView,
  onExit,
}: {
  step: number;
  setStep: (s: number) => void;
  setActiveView: (v: View) => void;
  onExit: () => void;
}) {
  const current = GUIDE_STEPS[step] ?? GUIDE_STEPS[0];
  const total = GUIDE_STEPS.length;

  const goTo = (s: number) => {
    const target = GUIDE_STEPS[s];
    if (target) {
      setStep(s);
      setActiveView(target.view);
    }
  };

  // Map guide step to lifecycle phase index for the progress bar
  const phaseIndex = Math.min(step, LIFECYCLE_PHASES.length - 1);

  return (
    <div className="border-b border-zinc-800 bg-zinc-900/60">
      {/* Lifecycle progress bar */}
      <div className="flex items-center justify-center gap-0 px-4 pt-3 pb-1">
        {LIFECYCLE_PHASES.map((phase, i) => (
          <div key={phase} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-bold transition-colors ${
                  i <= phaseIndex
                    ? "bg-emerald-500/20 text-emerald-400"
                    : "bg-zinc-800 text-zinc-600"
                }`}
              >
                {i < phaseIndex ? "\u2713" : i + 1}
              </div>
              <span
                className={`mt-0.5 text-[9px] transition-colors ${
                  i <= phaseIndex ? "text-emerald-400/70" : "text-zinc-700"
                }`}
              >
                {phase}
              </span>
            </div>
            {i < LIFECYCLE_PHASES.length - 1 && (
              <div
                className={`mx-1 h-px w-6 transition-colors ${
                  i < phaseIndex ? "bg-emerald-500/30" : "bg-zinc-800"
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Guide content */}
      <div className="flex items-start gap-4 px-4 pb-3 pt-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-block rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              Step {step + 1} of {total}
            </span>
            <span className="text-sm font-medium text-zinc-200">
              {current.title}
            </span>
          </div>
          <p className="text-xs leading-relaxed text-zinc-400">
            {current.annotation}
          </p>
        </div>
        <div className="flex flex-shrink-0 items-center gap-2">
          <button
            onClick={() => goTo(step - 1)}
            disabled={step === 0}
            className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Prev
          </button>
          {step < total - 1 ? (
            <button
              onClick={() => goTo(step + 1)}
              className="rounded border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-xs text-emerald-400 transition-colors hover:border-emerald-700 hover:bg-emerald-950/50"
            >
              Next
            </button>
          ) : (
            <a
              href="/docs#user-roles"
              className="rounded border border-emerald-800/50 bg-emerald-950/30 px-2.5 py-1 text-xs text-emerald-400 transition-colors hover:border-emerald-700 hover:bg-emerald-950/50"
            >
              View Docs
            </a>
          )}
          <button
            onClick={onExit}
            className="rounded border border-zinc-700 px-2.5 py-1 text-xs text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
