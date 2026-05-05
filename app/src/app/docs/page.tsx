"use client";

import Link from "next/link";
import { useState, useCallback, useEffect, useRef } from "react";
import "./docs.css";
import Navbar from "../Navbar";

const GITHUB_URL = "https://github.com/SAHU-01/legal_aid";
const PROGRAM_ID = "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV";
const EXPLORER_BASE = "https://explorer.solana.com";

// Live sample case — German Berechtigungsschein executed on Solana Devnet
const LIVE_CASE = {
  reference: "123 UR II 143/22",
  caseId: "BS-DE-123-UR-II-143/22-772655",
  transactions: {
    credential: {
      label: "Berechtigungsschein Issued",
      tx: "uonEG3e45h7NRt2kWh9hr8cG3Bt36rwsdNedJr7yBZdnnrLbPZydANGaQzVo8eEsScKovy9fG5VDYeeTCG6xihq",
      pda: "C8B4AJp5U8UBw7fJCqvYiE7W26n15Aw3F35BLaVrgwu7",
    },
    caseOpened: {
      label: "Case Opened",
      tx: "XvybzQRqQ2EbUPW4jPgwBcGp4tc76DxkAhupimMDYdjz6kER5TWL96jCQ2kyM5fCxLArED3YWWAnUzuky74k5LA",
      pda: "23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9",
    },
    docAnchored: {
      label: "Documents Anchored",
      tx: "2HKRkJU2FEbV2xfizhwDbARr6PGLEyvQq11vojH4h3e4eQ899JzB16H16r7bzxWoouCTevh7BLHbMCuJxJWpkjjE",
      hash: "175b1e36e8c94b94e4019994df951385b48fd8908f8d529a7e4b2a8da1af2351",
    },
    compressed: {
      label: "Compressed Audit Log",
      tx: "3ETQA5nkgapbYXxjneEH9SpkCFAJx9Pub2gijcGNCu6QxY9yjL7FB2xut1rZoErFwZNVqTKG249MhLSSxz9qC6yh",
      cost: "$0.0038",
    },
    caseClosed: {
      label: "Case Closed",
      tx: "5MJ7wZFhPkwqFvRjTseSFvve4JSsHs7bKvits46E2RHnpUEZXJ85bs5MSJ6FH8xu5BNWwU3ZiVp2jTqzK6sZ8ZqK",
    },
    payment: {
      label: "Payment Disbursed (85 USDC)",
      tx: "sVZAS7DAARA9zXGzozpSsMhBSZpYpHFpQ8qxPPw5q9bGwK2G47AnmSRYh5Vhmbmk4ctNjyfecPjZp8S4LGSFQBe",
    },
    markPaid: {
      label: "Case Marked Paid",
      tx: "4SPWnLkv4V7wqghbzqs8FoAgHRGho6K5erbUEUSkEdrJdwCHiLWYgLjDihbkqBeiJ9xqWpcc3QtCGWvmzq5Hupdg",
    },
  },
};

function ExternalIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ verticalAlign: "-1px", marginLeft: 3 }}>
      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
      <polyline points="15 3 21 3 21 9" />
      <line x1="10" y1="14" x2="21" y2="3" />
    </svg>
  );
}

function AnimatedFlow({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setInView(true); observer.disconnect(); } },
      { threshold: 0.6, rootMargin: "-50px 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className={`arch-flow${inView ? " in-view" : ""}`}>
      {children}
    </div>
  );
}

function CopyBlock({ title, code, children }: { title: string; code: string; children?: React.ReactNode }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [code]);

  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {children && <div style={{ marginBottom: "0.75rem" }}>{children}</div>}
      <div className="code-block">
        <div className="code-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span className="code-dot code-dot-red" />
            <span className="code-dot code-dot-yellow" />
            <span className="code-dot code-dot-green" />
            <span className="code-title">{title}</span>
          </div>
          <button
            onClick={handleCopy}
            style={{
              background: "none",
              border: "1px solid rgba(255,255,255,0.2)",
              color: copied ? "#4ade80" : "rgba(255,255,255,0.6)",
              cursor: "pointer",
              fontSize: "0.7rem",
              padding: "3px 10px",
              borderRadius: "4px",
              fontFamily: "var(--mono)",
              transition: "all 0.15s",
            }}
          >
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
        <div className="code-body">
          <pre>{code}</pre>
        </div>
      </div>
    </div>
  );
}

export default function DocsPage() {
  return (
    <div className="docs">
      <Navbar activePage="home" />

      {/* HERO */}
      <section className="docs-hero">
        <div className="docs-hero-badge">Production Docs</div>
        <h1>
          Module-by-Module
          <br />
          <em>Setup Guide.</em>
        </h1>
        <p className="docs-hero-sub">
          Everything you need to deploy Adduce for any country&rsquo;s legal aid
          system. Real on-chain infrastructure, no simulations. Each module is
          independently configurable and verifiable on Solana Explorer.
        </p>
      </section>

      {/* LAYOUT */}
      <div className="docs-layout">
        {/* SIDEBAR */}
        <aside className="docs-sidebar">
          <div className="docs-sidebar-title">Documentation</div>
          <ul className="docs-sidebar-nav">
            <li><a href="#what-is-adduce">What is Adduce</a></li>
            <li><a href="#why-public-chain">Why Public Chain</a></li>
            <li><a href="#architecture">Architecture</a></li>
            <li className="nav-divider" />
            <li><a href="#user-roles">User Roles</a></li>
            <li><a href="#role-court">Court Operator</a></li>
            <li><a href="#role-lawyer">Lawyer</a></li>
            <li><a href="#role-applicant">Applicant</a></li>
            <li><a href="#bs-flow-mapped">End-to-End Flow</a></li>
            <li><a href="#pain-points">Pain Points</a></li>
            <li className="nav-divider" />
            <li><a href="#quickstart-integration">Integration Quickstart</a></li>
            <li><a href="#portal-integration">Portal Integration</a></li>
            <li className="nav-divider" />
            <li><a href="#anchor-reference">Anchor Program (14 ix)</a></li>
            <li><a href="#module-1">SAS Credentials</a></li>
            <li><a href="#module-2">Case Management</a></li>
            <li><a href="#zk-circuit">ZK Selective Disclosure</a></li>
            <li><a href="#module-4">ZK Compression</a></li>
            <li><a href="#module-5">Payment (x402)</a></li>
            <li><a href="#integration-sdk">SDK Integration</a></li>
            <li><a href="#api-reference">API &amp; Scripts</a></li>
            <li className="nav-divider" />
            <li><a href="#live-case">Live Sample Case</a></li>
            <li><a href="#country-config">Country Config</a></li>
            <li><a href="#governance">Governance</a></li>
          </ul>
        </aside>

        {/* CONTENT */}
        <div className="docs-content">

          {/* ── WHAT IS ADDUCE ── */}
          <section id="what-is-adduce" className="docs-section">
            <div className="docs-section-label">Introduction</div>
            <h2>What is Adduce</h2>
            <p>
              Adduce is an on-chain legal-aid plugin. It provides credential
              issuance, document anchoring, and payment settlement primitives
              that integrate into existing government legal-aid portals.
              Adduce does not replace your portal: it replaces the parts
              of your stack that are slow, opaque, or non-interoperable:
              identity attestations, document audit trails, and payment rails.
            </p>

            <div className="callout" style={{ marginBottom: "1.5rem" }}>
              <p>
                <strong>Protocol, not portal.</strong> In production, a government
                integrator (e.g.{" "}
                <a href="https://www.justiz.bayern.de" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  Government Justice Portal
                </a>
                ) embeds Adduce SDK calls into their existing system. The
                reference UI at <code>/dashboard</code> is a demo showing what
                those calls look like end-to-end.
              </p>
            </div>

            <h3>Integration architecture</h3>
            <div className="module-grid" style={{ marginBottom: "1.5rem" }}>
              <div className="module-card" style={{ textAlign: "center", padding: "1rem" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Your existing portal</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.2rem" }}>Government IT System</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Any justice portal, case management system, or ERP</div>
                <div style={{ margin: "0.8rem 0 0.4rem", fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>{"\u2193"} Adduce SDK calls {"\u2193"}</div>
              </div>
              <div className="module-card" style={{ borderLeft: "3px solid var(--accent)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Adduce Protocol Layer</div>
                <ul className="req-list" style={{ margin: "0.5rem 0 0" }}>
                  <li>SAS: identity attestations (eligibility certificates)</li>
                  <li>Light Protocol: ZK-compressed document hashes</li>
                  <li>x402: HTTP-native payment settlement</li>
                  <li>Anchor program: case lifecycle state machine</li>
                </ul>
                <div style={{ margin: "0.8rem 0 0.4rem", fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>{"\u2193"} All transactions on {"\u2193"}</div>
              </div>
              <div className="module-card" style={{ textAlign: "center", padding: "1rem", background: "var(--accent-light)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Public ledger</div>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, marginTop: "0.2rem" }}>Solana</div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Auditable, cross-jurisdictional, no consortium required</div>
              </div>
            </div>

            <h3>What each module handles</h3>
            <div className="module-grid">
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">1</div>
                  <h4>Identity &amp; Credentials (SAS)</h4>
                </div>
                <p>
                  Issues on-chain attestations that serve as the digital
                  equivalent of a legal aid eligibility certificate: Berechtigungsschein (DE), Aide Juridictionnelle
                  certificate, or any country&rsquo;s legal aid entitlement
                  document. Verifiable by any party without contacting the
                  issuing authority.
                </p>
                <div className="module-tech">sas-lib &middot; Solana Attestation Service</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">2</div>
                  <h4>Case Management (Anchor Program)</h4>
                </div>
                <p>
                  On-chain state machine tracking each case through its
                  lifecycle: Open, InProgress, Closed, Paid. Jurisdiction-scoped
                  configurations. Authority-gated transitions. All state changes
                  produce verifiable transactions.
                </p>
                <div className="module-tech">Anchor 0.32 &middot; Solana Program</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">3</div>
                  <h4>Document Integrity (SHA-256 Anchoring)</h4>
                </div>
                <p>
                  Lawyers anchor SHA-256 hashes of case documents on-chain. No
                  PII is stored: only the cryptographic fingerprint. Any
                  auditor can verify a document&rsquo;s integrity by comparing
                  hashes without accessing the original.
                </p>
                <div className="module-tech">SHA-256 &middot; anchorDocument instruction</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">4</div>
                  <h4>ZK Selective Disclosure (Groth16)</h4>
                </div>
                <p>
                  Holders prove statements about credentials: &ldquo;jurisdiction
                  is DE, credential not expired&rdquo;: without revealing other
                  fields. A custom Circom circuit generates 256-byte Groth16 proofs
                  verified on-chain via Solana&rsquo;s alt_bn128 pairing. Same
                  BN254 curve as Light Protocol and Ethereum ZK rollups.
                  Mathematical privacy, not access-control privacy.
                </p>
                <div className="module-tech">Circom &middot; snarkjs &middot; Groth16 &middot; alt_bn128 syscall</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">5</div>
                  <h4>ZK Compression (Light Protocol)</h4>
                </div>
                <p>
                  Compressed audit logs reduce storage costs by 98.7% compared
                  to standard Solana PDAs. At government scale (100K+
                  cases/year), this means $22,000+ annual savings while
                  maintaining full immutability and verifiability.
                </p>
                <div className="module-tech">Light Protocol &middot; Helius Photon Indexer</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">6</div>
                  <h4>Payment Settlement (x402 + USDC)</h4>
                </div>
                <p>
                  Instant stablecoin disbursement upon case closure and
                  credential verification. The x402 protocol handles the
                  HTTP-native payment flow: GET returns 402 Payment Required,
                  POST verifies credential + payment signature.
                </p>
                <div className="module-tech">x402-solana &middot; SPL Token (USDC/EURC)</div>
              </div>
              <div className="module-card">
                <div className="module-card-header">
                  <div className="module-step">6</div>
                  <h4>Automation Agent</h4>
                </div>
                <p>
                  Background polling agent that scans for closed cases, verifies
                  credentials, executes USDC transfers, creates compressed audit
                  logs, and marks cases as paid. Runs as a cron job or
                  continuous service.
                </p>
                <div className="module-tech">scripts/agent.ts &middot; 15s polling interval</div>
              </div>
            </div>
          </section>

          {/* ── WHY PUBLIC CHAIN ── */}
          <section id="why-public-chain" className="docs-section">
            <div className="docs-section-label">Architecture Decision</div>
            <h2>Why a public chain</h2>
            <p>
              Legal aid certificates cross institutional boundaries: issued by
              one authority, verified by another, audited by a third. A private
              chain requires every participant to join the same network. A
              public chain lets any court, any lawyer, any auditor verify
              independently.
            </p>

            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Dimension</div>
                <div className="live-case-cell live-case-cell-header">Private Chain</div>
                <div className="live-case-cell live-case-cell-header">Adduce (Solana)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Trust source</span></div>
                <div className="live-case-cell">Consortium agreement (legal)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Cryptographic proof (math)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Settlement speed</span></div>
                <div className="live-case-cell">Days to weeks (batch clearing)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>400ms (USDC on Solana)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Cross-border verification</span></div>
                <div className="live-case-cell">Requires bilateral agreement per country</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Native: any node, any jurisdiction</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Infrastructure model</span></div>
                <div className="live-case-cell">CapEx: dedicated nodes + maintenance</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>OpEx: $0.004/credential, no servers</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Deploy time</span></div>
                <div className="live-case-cell">Months (consortium formation)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Hours (anchor deploy)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Storage cost per case</span></div>
                <div className="live-case-cell">Varies by implementation</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>$0.004 (ZK compressed)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Audit access</span></div>
                <div className="live-case-cell">Consortium members only</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Any auditor, no permission needed</div>
              </div>
            </div>

            <h3>When a private chain is the right choice</h3>
            <p>
              Private chains win when strict data-residency is required (all
              data must stay within national borders), when regulation
              explicitly mandates a permissioned ledger, or when participating
              institutions already share network infrastructure. Adduce is
              designed for the opposite scenario: lightweight credential
              verification that must work across jurisdictions without
              bilateral agreements.
            </p>
          </section>

          {/* ── ARCHITECTURE ── */}
          <section id="architecture" className="docs-section">
            <div className="docs-section-label">Architecture</div>
            <h2>How the pieces connect</h2>
            <p>
              The protocol is a pipeline. Each stage produces an on-chain
              artifact that the next stage can verify independently.
            </p>

            <AnimatedFlow>
              <div className="arch-node">
                <div className="arch-node-label">Court / Ministry</div>
                <div className="arch-node-value">Issues Credential</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Lawyer</div>
                <div className="arch-node-value">Opens Case</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Lawyer</div>
                <div className="arch-node-value">Anchors Documents</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Court</div>
                <div className="arch-node-value">Closes Case</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Protocol</div>
                <div className="arch-node-value">Settles Payment</div>
              </div>
            </AnimatedFlow>

            <p>
              <strong>Program ID:</strong>{" "}
              <a
                href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: "3px" }}
              >
                {PROGRAM_ID}<ExternalIcon />
              </a>
            </p>

            <h3>On-chain accounts</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Account</div>
                <div className="live-case-cell live-case-cell-header">Seeds / Derivation</div>
                <div className="live-case-cell live-case-cell-header">Purpose</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">ProgramConfig</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>[&quot;config&quot;, jurisdiction]</div>
                <div className="live-case-cell">Authority + jurisdiction metadata, case counter</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">CaseFile</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>[&quot;case&quot;, case_id]</div>
                <div className="live-case-cell">Case lifecycle: status, document hash, lawyer, timestamps</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">SAS Attestation</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>deriveAttestationPda(credential, schema, nonce)</div>
                <div className="live-case-cell">Verifiable credential: jurisdiction, tier, expiry</div>
              </div>
            </div>
          </section>

          {/* ── USER ROLES ── */}
          <section id="user-roles" className="docs-section">
            <div className="docs-section-label">User Roles</div>
            <h2>Three roles. One workflow.</h2>
            <p>
              Every legal aid system in the world has three actors, regardless
              of jurisdiction. Each has different permissions, different daily
              tasks, and different pain points. Adduce maps each role to
              specific on-chain capabilities.
            </p>

            <div className="module-grid">
              <div className="module-card role-card role-card-court">
                <div className="module-card-header">
                  <span className="role-badge role-badge-court">Court</span>
                  <h4>Court Operator</h4>
                </div>
                <div className="role-subtitle">On-chain role: Authority signer</div>
                <p>
                  Government employee at the court or ministry. Reviews
                  eligibility applications, issues legal aid certificates
                  (eligibility certificates), monitors case progress, and approves
                  payment disbursements. Role-separated: <strong>authority</strong>{" "}
                  calls <code>initialize</code> and <code>open_case</code>,{" "}
                  <strong>reviewer</strong> (or delegate) calls <code>link_credential</code> and{" "}
                  <code>close_case</code>, <strong>payer</strong> calls{" "}
                  <code>mark_paid</code>. Up to 3 delegates can be added via <code>add_delegate</code>. Custodial cases use <code>open_case_custodial</code>. Lawyers can be reassigned via <code>reassign_lawyer</code>.
                </p>
              </div>
              <div className="module-card role-card role-card-lawyer">
                <div className="module-card-header">
                  <span className="role-badge role-badge-lawyer">Lawyer</span>
                  <h4>Lawyer</h4>
                </div>
                <div className="role-subtitle">On-chain role: Lawyer signer</div>
                <p>
                  Private attorney who takes legal aid cases. Must hold a valid
                  SAS credential (the digital eligibility certificate). Receives
                  case assignments, submits case documents by anchoring their
                  SHA-256 hash on-chain, verifies credential validity, and
                  claims payment after case closure. Can call{" "}
                  <code>anchor_document</code> (must be the assigned lawyer;
                  credential liveness re-checked on-chain).
                </p>
              </div>
              <div className="module-card role-card role-card-applicant">
                <div className="module-card-header">
                  <span className="role-badge role-badge-applicant">Applicant</span>
                  <h4>Applicant (Antragsteller / Citizen)</h4>
                </div>
                <div className="role-subtitle">On-chain role: None (off-chain only)</div>
                <p>
                  Citizen seeking legal aid. Files an application at the court,
                  receives an eligibility certificate if eligible, and takes it to a
                  lawyer. The applicant has zero blockchain interaction.
                  the system is invisible to them. Their data never touches the
                  chain. Only entitlement metadata (jurisdiction, tier, expiry)
                  is stored as a verifiable credential.
                </p>
              </div>
            </div>
          </section>

          {/* ── COURT OPERATOR WORKFLOW ── */}
          <section id="role-court" className="docs-section">
            <div className="docs-section-label">Court Operator</div>
            <h2>Issuance, review, and disbursement.</h2>
            <p>
              The court operator is the system&rsquo;s authority. They control
              the full case lifecycle: from certificate issuance to
              payment approval.
            </p>

            <AnimatedFlow>
              <div className="arch-node">
                <div className="arch-node-label">Step 1</div>
                <div className="arch-node-value">Review</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 2</div>
                <div className="arch-node-value">Issue Certificate</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 3</div>
                <div className="arch-node-value">Open Case</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 4</div>
                <div className="arch-node-value">Close Case</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 5</div>
                <div className="arch-node-value">Approve Payment</div>
              </div>
            </AnimatedFlow>

            <h3>Mapping to on-chain operations</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Operator Action</div>
                <div className="live-case-cell live-case-cell-header">Adduce Operation</div>
                <div className="live-case-cell live-case-cell-header">On-Chain Instruction</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">View pending applications</span></div>
                <div className="live-case-cell">Dashboard: read case list</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>Read CaseFile PDAs</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Issue eligibility certificate</span></div>
                <div className="live-case-cell">Issue SAS credential to citizen</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>scripts/issue-credential.ts</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Open case</span></div>
                <div className="live-case-cell">Create case on-chain with lawyer commitment</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>open_case(case_id, lawyer_commitment, applicant, authorized_amount)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Monitor case progress</span></div>
                <div className="live-case-cell">Read case status from chain</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>Read CaseFile.status</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Approve payment</span></div>
                <div className="live-case-cell">Record disbursement + payment reference</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>mark_paid(case_id, amount, reference)</div>
              </div>
            </div>

            <h3>Work Procedure: 3-step BS issuance</h3>
            <p>
              In a typical system, issuing an eligibility certificate follows a
              Review &rarr; Editing &rarr; Verification procedure. In Adduce:
            </p>
            <ul className="req-list">
              <li><strong>Review:</strong> Operator views the submitted application form and attached documents on-screen</li>
              <li><strong>Editing:</strong> Operator sets the activity remark, selects status (&ldquo;Issued&rdquo;), and uploads the signed BS document</li>
              <li><strong>Verification:</strong> The SAS credential is created on-chain, the BS PDF preview is shown with QR code, and the operator clicks &ldquo;Send&rdquo; to finalize</li>
            </ul>
          </section>

          {/* ── LAWYER WORKFLOW ── */}
          <section id="role-lawyer" className="docs-section">
            <div className="docs-section-label">Lawyer</div>
            <h2>Request, verify, submit, get paid.</h2>
            <p>
              The lawyer is the primary user of the system. They receive legal
              aid assignments, verify their eligibility certificate, submit case
              documents, and claim payment once the case is closed.
            </p>

            <AnimatedFlow>
              <div className="arch-node">
                <div className="arch-node-label">Step 1</div>
                <div className="arch-node-value">Connect Wallet</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 2</div>
                <div className="arch-node-value">Verify Credential</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 3</div>
                <div className="arch-node-value">Submit Documents</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 4</div>
                <div className="arch-node-value">Claim Payment</div>
              </div>
            </AnimatedFlow>

            <h3>Mapping to on-chain operations</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Lawyer Action</div>
                <div className="live-case-cell live-case-cell-header">Adduce Operation</div>
                <div className="live-case-cell live-case-cell-header">On-Chain Instruction</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Request certificate for client</span></div>
                <div className="live-case-cell">Off-chain: client applies at court</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>-</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Verify credential validity</span></div>
                <div className="live-case-cell">Read SAS attestation PDA</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>fetchMaybeAttestation()</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Submit case documents</span></div>
                <div className="live-case-cell">Documents encrypted (X25519+AES-256-GCM), uploaded to Arweave via Irys (permanent, only assigned lawyer can decrypt). SHA-256 hash of plaintext anchored on-chain.</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>anchor_document(case_id, hash, lawyer_salt)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Check case status</span></div>
                <div className="live-case-cell">Dashboard: My Cases view</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>Read CaseFile.status</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Claim payment</span></div>
                <div className="live-case-cell">POST /api/claim-payment</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>x402 payment + mark_paid</div>
              </div>
            </div>

            <div className="callout">
              <p>
                <strong>Pain point solved:</strong> In the current paper system,
                a lawyer must phone the issuing court to verify a
                eligibility certificate. With Adduce, verification is a single
                on-chain PDA read: no phone calls, no hold queues, no
                business-hour dependency.
              </p>
            </div>

            <div className="callout" style={{ marginTop: "1rem" }}>
              <p>
                <strong>Sensitive document handling:</strong> Case documents
                (billing forms, court filings, settlement records) are
                encrypted end-to-end using X25519 ECDH key agreement +
                AES-256-GCM. The encrypted blob is stored permanently on
                Arweave via Irys (pay once, stored forever). Only the
                assigned lawyer can decrypt using their wallet key. The
                plaintext SHA-256 hash is anchored on Solana for integrity
                verification. No sensitive content ever touches the public
                ledger.
                See <code>scripts/encrypt-and-anchor.ts</code> for the
                full working implementation.
              </p>
            </div>
          </section>

          {/* ── APPLICANT WORKFLOW ── */}
          <section id="role-applicant" className="docs-section">
            <div className="docs-section-label">Applicant</div>
            <h2>Apply once. Carry a verifiable certificate.</h2>
            <p>
              The applicant is the citizen seeking legal aid. They interact with
              the court and the lawyer: never with the blockchain
              directly. Adduce is invisible to them.
            </p>
            <ul className="req-list">
              <li>Applicant goes to court (or online portal) and files an application for Beratungshilfe / legal aid</li>
              <li>Court clerk reviews eligibility based on income and case merits</li>
              <li>If approved, court issues an eligibility certificate: in Adduce, this becomes an SAS credential on-chain, tied to the lawyer&rsquo;s wallet</li>
              <li>Applicant takes the BS to a lawyer. The lawyer verifies it instantly on-chain: no phone calls needed</li>
              <li>The applicant never creates a wallet, signs a transaction, or sees a blockchain address. The system is transparent to them.</li>
            </ul>
            <div className="callout">
              <p>
                <strong>Pain point solved:</strong> Today, applicants carry a
                paper certificate that can be forged, lost, or expired without
                anyone knowing. An on-chain attestation cannot be forged, cannot
                be lost (it lives on the blockchain), and expiry is checked
                automatically at verification time.
              </p>
            </div>
          </section>

          {/* ── BS FLOW MAPPED ── */}
          <section id="bs-flow-mapped" className="docs-section">
            <div className="docs-section-label">End-to-End Flow</div>
            <h2>How an eligibility certificate becomes an on-chain lifecycle.</h2>
            <p>
              This is the complete flow from a citizen&rsquo;s application to
              the lawyer&rsquo;s payment. Each step shows who performs it, what
              happens on-chain, and the real Solana Devnet transaction from our
              sample case (Reference: <strong>123 UR II 143/22</strong>).
            </p>

            <ol className="flow-timeline">
              <li className="flow-step">
                <div className="flow-step-dot">1</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-applicant">Applicant</span>
                  <span className="flow-step-title">Files application at court</span>
                </div>
                <div className="flow-step-desc">
                  Citizen Max Mustermann visits the court and submits income
                  documents. This step is entirely off-chain.
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">2</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-court">Court</span>
                  <span className="flow-step-title">Reviews and approves eligibility</span>
                </div>
                <div className="flow-step-desc">
                  Operator Sabine Mueller reviews the application using the
                  3-step work procedure (Review &rarr; Editing &rarr;
                  Verification). Off-chain decision.
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">3</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-court">Court</span>
                  <span className="flow-step-title">Issues Eligibility Certificate (SAS Credential)</span>
                </div>
                <div className="flow-step-desc">
                  The court creates an on-chain attestation encoding
                  jurisdiction (&ldquo;DE&rdquo;), eligibility tier
                  (&ldquo;TIER_1&rdquo;), and expiry date. This is the digital
                  eligibility certificate.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.credential.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.credential.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">4</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-court">Court</span>
                  <span className="flow-step-title">Opens case on-chain</span>
                </div>
                <div className="flow-step-desc">
                  Authority creates a CaseFile PDA with the case ID, assigns
                  lawyer Dieter Stein. Status: Open.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.caseOpened.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.caseOpened.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">5</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-lawyer">Lawyer</span>
                  <span className="flow-step-title">Anchors case documents (SHA-256)</span>
                </div>
                <div className="flow-step-desc">
                  Lawyer submits billing forms, certificate PDFs,
                  and Vollmacht. The system hashes them and stores the
                  fingerprint on-chain. Status: InProgress.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.docAnchored.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.docAnchored.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">6</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-protocol">Protocol</span>
                  <span className="flow-step-title">Creates compressed audit log (ZK)</span>
                </div>
                <div className="flow-step-desc">
                  Light Protocol creates an immutable, ZK-compressed audit
                  record at 98.7% lower cost than a standard PDA
                  ({LIVE_CASE.transactions.compressed.cost}).
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.compressed.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.compressed.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">7</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-court">Court</span>
                  <span className="flow-step-title">Closes case</span>
                </div>
                <div className="flow-step-desc">
                  Operator reviews the completed work and closes the case.
                  Status: Closed. The lawyer can now claim payment.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.caseClosed.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.caseClosed.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">8</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-protocol">Protocol</span>
                  <span className="flow-step-title">Disburses USDC payment (85 USDC)</span>
                </div>
                <div className="flow-step-desc">
                  The automation agent or x402 endpoint transfers 85 USDC (EUR
                  equivalent) from the court treasury to the lawyer&rsquo;s
                  token account.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.payment.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.payment.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
              <li className="flow-step">
                <div className="flow-step-dot">9</div>
                <div className="flow-step-header">
                  <span className="role-badge role-badge-protocol">Protocol</span>
                  <span className="flow-step-title">Marks case as Paid (final)</span>
                </div>
                <div className="flow-step-desc">
                  On-chain status set to Paid. This is the terminal state
                 : the case is now a permanent, immutable record.
                </div>
                <div className="flow-step-tx">
                  <a href={`${EXPLORER_BASE}/tx/${LIVE_CASE.transactions.markPaid.tx}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.markPaid.tx.slice(0, 32)}&hellip; <ExternalIcon />
                  </a>
                </div>
              </li>
            </ol>

            <div className="callout">
              <p>
                Every step after #3 produces a verifiable Solana transaction.
                The full cycle: from certificate issuance to payment
               : completed in under 2 minutes on-chain. In the paper
                system, the same cycle takes 6&ndash;12 months.
              </p>
            </div>
          </section>

          {/* ── PAIN POINTS ── */}
          <section id="pain-points" className="docs-section">
            <div className="docs-section-label">Why This Matters</div>
            <h2>What breaks in the paper system.</h2>
            <p>
              Legal aid infrastructure across Europe shares the same failure
              modes. Each is a direct consequence of paper-based, siloed
              processes.
            </p>

            <div className="pain-grid">
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> Certificate Forgery</h4>
                <p>
                  A paper eligibility certificate can be photocopied and reused. No
                  court can tell if the certificate was already consumed by
                  another lawyer.
                </p>
                <div className="pain-fix">
                  Adduce: SAS attestation is cryptographically bound to a
                  specific wallet. Cannot be duplicated.
                </div>
              </div>
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> Payment Delays (6&ndash;12 months)</h4>
                <p>
                  Lawyers submit paper forms, wait for manual review, and
                  receive payment via bank transfer weeks or months later. 40%
                  of lawyers stop taking legal aid cases.
                </p>
                <div className="pain-fix">
                  Adduce: USDC disbursement happens in 400ms after case closure
                  verification.
                </div>
              </div>
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> No Cross-Verification</h4>
                <p>
                  A lawyer in Munich cannot verify a BS issued by a court in
                  Hamburg without calling them during business hours. Cross-border
                  is impossible.
                </p>
                <div className="pain-fix">
                  Adduce: Any party reads the attestation PDA on-chain. Works
                  across jurisdictions, 24/7.
                </div>
              </div>
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> Double Billing</h4>
                <p>
                  A lawyer can submit the same BS for multiple payment claims.
                  Detection relies on manual spreadsheet reconciliation.
                </p>
                <div className="pain-fix">
                  Adduce: On-chain state machine enforces Open &rarr; InProgress
                  &rarr; Closed &rarr; Paid. No state can be revisited.
                </div>
              </div>
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> Lost Paper Trail</h4>
                <p>
                  Document submissions have no tamper-proof audit trail. Forms
                  are lost, filing cabinets are inaccessible, and there is no
                  proof of when something was submitted.
                </p>
                <div className="pain-fix">
                  Adduce: SHA-256 hash anchored on Solana with immutable
                  timestamp. Permanent proof of submission.
                </div>
              </div>
              <div className="pain-card">
                <h4><span className="pain-icon">{"\u2717"}</span> Manual Reconciliation</h4>
                <p>
                  Court clerks manually match incoming billing forms to
                  cases and payment records. Error-prone at any scale.
                </p>
                <div className="pain-fix">
                  Adduce: The automation agent polls closed cases and disburses
                  payments automatically every 15 seconds.
                </div>
              </div>
            </div>
          </section>

          {/* ── INTEGRATION QUICKSTART ── */}
          <section id="quickstart-integration" className="docs-section">
            <div className="docs-section-label">Integration</div>
            <h2>5-minute integration quickstart</h2>

            <CopyBlock
              title="Install the SDK (npm)"
              code={`npm install @adduce/sdk`}
            >
              <p>
                The fastest path. Install the published SDK and call
                the already-deployed program on devnet. No cloning, no
                deploying, no Anchor setup. Works from any TypeScript/Node.js
                project.{" "}
                <a href="https://www.npmjs.com/package/@adduce/sdk" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)" }}>
                  View on npm
                </a>
              </p>
            </CopyBlock>

            <CopyBlock
              title="SDK usage (TypeScript)"
              code={`import { AdduceClient, Keypair } from "@adduce/sdk";

const wallet = Keypair.fromSecretKey(/* your keypair */);
const adduce = new AdduceClient({ cluster: "devnet", wallet });

// Open a case
const { casePda, lawyerCommitment } = await adduce.openCase({
  caseId: "CASE-DE-2025-001",
  lawyerPubkey: lawyerWallet.publicKey,
  applicant: citizenWallet.publicKey,
  authorizedAmount: 8500,
}, "DE");

// Read case status
const caseData = await adduce.getCase("CASE-DE-2025-001");
console.log(caseData.status); // "Open"`}
            >
              <p>
                All 14 program instructions are callable through the SDK.
                The program is already deployed at{" "}
                <code>3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV</code>.
                You connect to it, not deploy your own.
              </p>
            </CopyBlock>

            <h3>Or clone the full repo</h3>
            <p>
              For running scripts, modifying the program, or building the
              ZK circuit locally. Tested with the German jurisdiction but
              works for any of the 9 supported countries by changing the
              jurisdiction parameter.
            </p>

            <h3>Prerequisites</h3>
            <ul className="req-list">
              <li>Node.js 22+ (<code>nvm use 22</code>)</li>
              <li>Rust + Solana CLI + Anchor CLI</li>
              <li>A Helius API key (free tier at helius.dev, required for Light Protocol)</li>
              <li>Devnet SOL (<code>solana airdrop 2</code>)</li>
            </ul>

            <CopyBlock
              title="Step 1: Clone, install, deploy"
              code={`git clone https://github.com/SAHU-01/legal_aid.git && cd legal_aid
nvm use 22 && npm install
cp .env.example .env  # add your Helius API key
anchor build && anchor deploy --provider.cluster devnet`}
            >
              <p>
                Clones the repository, installs all dependencies (including
                snarkjs and circomlibjs for ZK proofs), compiles the Anchor
                program, and deploys it to Solana Devnet. The program ID is
                printed after deploy. Your wallet at{" "}
                <code>~/.config/solana/id.json</code> becomes the upgrade
                authority.
              </p>
            </CopyBlock>

            <CopyBlock
              title="Step 2: Create a credential schema"
              code={`npx ts-node scripts/create-schema.ts`}
            >
              <p>
                Deploys the eligibility credential schema to the Solana
                Attestation Service (SAS). The schema defines three fields:
                <code>jurisdiction</code> (12 bytes),{" "}
                <code>eligibility_tier</code> (12 bytes), and{" "}
                <code>expiry_date</code> (8 bytes). These fields are the same
                regardless of country. Output: a schema address saved to{" "}
                <code>scripts/schema-address.json</code>.
              </p>
            </CopyBlock>

            <CopyBlock
              title="Step 3: Issue a credential to a citizen"
              code={`npx ts-node scripts/issue-credential.ts`}
            >
              <p>
                Issues an eligibility certificate as an SAS attestation. The
                script fetches the schema, serializes the credential data
                (jurisdiction, tier, expiry), and creates the attestation PDA
                on-chain bound to the citizen&rsquo;s wallet. This is the
                digital equivalent of a court issuing a paper certificate.
                Output: credential info saved to{" "}
                <code>scripts/credential-info.json</code>.
              </p>
            </CopyBlock>

            <CopyBlock
              title="Step 4: Run the full case lifecycle"
              code={`npx ts-node scripts/e2e-full-pipeline.ts`}
            >
              <p>
                Executes the complete lifecycle on Devnet with real
                transactions:{" "}
                <code>open_case</code> {"\u2192"}{" "}
                <code>link_credential</code> {"\u2192"}{" "}
                <code>anchor_document</code> {"\u2192"}{" "}
                <code>close_case</code> {"\u2192"}{" "}
                USDC transfer {"\u2192"}{" "}
                <code>mark_paid</code>. Every step produces a Solana
                transaction with an Explorer link. The report includes
                cost analysis and timing for each instruction.
              </p>
            </CopyBlock>

            <CopyBlock
              title="Step 5: Verify credential and case"
              code={`npx ts-node scripts/verify-credential.ts`}
            >
              <p>
                Independently verifies the full chain: SAS credential is valid
                and not expired, case status is Paid, document hash matches,
                and payment was disbursed. This is what an external auditor
                or a different jurisdiction would run to verify a case without
                any access to the issuing court&rsquo;s internal systems.
              </p>
            </CopyBlock>

            <CopyBlock
              title="Optional: Run ZK selective disclosure demo"
              code={`cd circuits && npm install && ./build.sh
cd .. && npx ts-node scripts/zk-disclosure-demo.ts`}
            >
              <p>
                Compiles the Groth16 circuit, runs the trusted setup ceremony,
                then generates and verifies a ZK proof that proves
                &ldquo;jurisdiction is DE and credential is not expired&rdquo;
                without revealing any other fields. The proof is 256 bytes and
                verifiable on-chain via <code>verify_zk_disclosure</code>.
              </p>
            </CopyBlock>
          </section>

          {/* ── PORTAL INTEGRATION ── */}
          <section id="portal-integration" className="docs-section">
            <div className="docs-section-label">Integration Guide</div>
            <h2>Integrating into an existing portal</h2>
            <p>
              Adduce is designed to be called from any government portal via
              REST API. The on-chain program and TypeScript scripts are
              deployed and working today. The REST API wrapper
              (<code>/api/gov/*</code>) is the planned integration layer
              that makes these callable from Java, .NET, or any HTTP client.
              No existing system needs to be replaced.
            </p>

            <h3>Integration architecture</h3>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", lineHeight: "1.8", padding: "1.5rem", background: "var(--bg-warm)", borderRadius: "8px", border: "1px solid var(--border)", marginBottom: "1.5rem" }}>
              <div>Your Portal (Java/Spring, .NET, etc.)</div>
              <div style={{ color: "var(--accent)" }}>&nbsp;&nbsp;&darr; REST/JSON (standard HTTP)</div>
              <div>Adduce API Layer (Next.js, deployed alongside or as microservice)</div>
              <div style={{ color: "var(--accent)" }}>&nbsp;&nbsp;&darr; Anchor TypeScript SDK</div>
              <div>Solana Devnet (public ledger)</div>
            </div>

            <h3>What is live vs. planned</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Language</div>
                <div className="live-case-cell live-case-cell-header">Integration Method</div>
                <div className="live-case-cell live-case-cell-header">Status</div>
              </div>
              {[
                { l: "TypeScript / Node.js", m: "Anchor SDK: direct program calls via @coral-xyz/anchor", s: "Live (scripts/)" },
                { l: "Rust", m: "Anchor CPI: call from another Solana program", s: "Live (CPI feature)" },
                { l: "Any", m: "Solana JSON-RPC: raw transaction construction over HTTP", s: "Live (advanced)" },
                { l: "Any (Java, .NET, Python)", m: "REST API: /api/gov/* endpoints wrapping the above", s: "Planned" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.l}</span></div>
                  <div className="live-case-cell">{row.m}</div>
                  <div className="live-case-cell" style={{ color: row.s.includes("Available") ? "var(--accent)" : "var(--text-muted)" }}>{row.s}</div>
                </div>
              ))}
            </div>

            <h3>Scenario 1: Court operator issues credential</h3>
            <p>
              The operator approves a legal aid application in the existing
              portal. The portal&rsquo;s backend adds one call to
              create the on-chain credential. The TypeScript path works
              today. The REST path shows the planned API design.
            </p>
            <CopyBlock
              title="REST API (planned, any language)"
              code={`POST /api/gov/credentials/issue
Content-Type: application/json

{
  "jurisdiction": "DE",
  "eligibilityTier": "TIER_1",
  "expiryDate": "2027-05-04",
  "citizenWallet": "Citizen4K...pubkey",
  "lawyerCommitment": "a3b2c1d4...sha256hex"
}

# Response: { credentialAddress, transactionSignature, explorerUrl }`}
            >
              <p>
                Your Java/Spring backend calls this endpoint after the
                operator clicks &ldquo;Approve.&rdquo; The API handles all
                Solana transaction construction, signing, and confirmation.
                Your portal receives the credential address and transaction
                link for its internal records.
              </p>
            </CopyBlock>
            <CopyBlock
              title="TypeScript SDK (live)"
              code={`import { getCreateAttestationInstruction, deriveAttestationPda } from "sas-lib";

// 1. Derive the credential PDA
const [attestationPda] = await deriveAttestationPda({
  credential: credentialAddress,
  schema: schemaAddress,
  nonce: citizenWallet,
});

// 2. Build and send the attestation instruction
const ix = getCreateAttestationInstruction({
  authority: courtWallet,
  schema: schemaAddress,
  nonce: citizenWallet,
  data: serializedFields,  // jurisdiction + tier + expiry
  expiry: expiryTimestamp,
});

// 3. Open the case with lawyer commitment
await program.methods
  .openCase(caseId, lawyerCommitment, citizenWallet, authorizedAmount)
  .accounts({ config: configPda, caseFile: casePda, authority: courtWallet.publicKey })
  .signers([courtWallet])
  .rpc();`}
            >
              <p>
                For TypeScript/Node.js integrations, call the Anchor program
                directly. The <code>sas-lib</code> package handles credential
                creation. The Anchor client handles case management.
              </p>
            </CopyBlock>

            <h3>Scenario 2: Lawyer anchors documents</h3>
            <p>
              The lawyer uploads case documents through the existing portal.
              The portal hashes the document and anchors the hash on-chain.
              Documents stay in the existing DMS. Only the hash goes on-chain.
            </p>
            <CopyBlock
              title="REST API (planned, any language)"
              code={`POST /api/gov/cases/{caseId}/anchor
Content-Type: application/json

{
  "documentHash": "175b1e36...sha256hex",
  "lawyerWallet": "Lawyer5K...pubkey",
  "lawyerSalt": "random32bytehex..."
}

# The lawyer's salt proves they are the assigned lawyer
# (their pubkey + salt hashes to the commitment stored on-chain)

# Response: { transactionSignature, explorerUrl }`}
            >
              <p>
                The portal computes SHA-256 of the uploaded document, then
                sends it along with the lawyer&rsquo;s salt (generated during
                case assignment). The API verifies the lawyer commitment
                and anchors the hash. The document itself never leaves
                the portal&rsquo;s DMS.
              </p>
            </CopyBlock>

            <h3>Scenario 3: Verify credential (any jurisdiction)</h3>
            <p>
              A court in one country needs to verify a credential issued
              by another country. No bilateral agreement needed. One API call.
            </p>
            <CopyBlock
              title="REST API (planned, any language)"
              code={`GET /api/gov/credentials/verify?address=C8B4AJp5...credentialPDA

# Response:
{
  "valid": true,
  "jurisdiction": "DE",
  "eligibilityTier": "TIER_1",
  "expiryDate": "2027-05-04",
  "isExpired": false,
  "issuer": "Court7K...pubkey",
  "explorerUrl": "https://explorer.solana.com/address/C8B4AJp5...?cluster=devnet"
}`}
            >
              <p>
                Any system in any country can verify a credential by passing
                its on-chain address. No Solana SDK required. No consortium
                membership. The API reads the SAS attestation PDA and returns
                structured JSON.
              </p>
            </CopyBlock>

            <h3>Scenario 4: Close case and record payment</h3>
            <CopyBlock
              title="REST API (planned, any language)"
              code={`# Close the case (reviewer or delegate)
POST /api/gov/cases/{caseId}/close
{ "signerWallet": "Reviewer3K...pubkey" }

# Record payment after bank transfer completes
POST /api/gov/cases/{caseId}/pay
{
  "disbursedAmount": 8500,
  "paymentReference": "SAP-INV-2025-04-28-00142",
  "signerWallet": "Payer9K...pubkey"
}

# Response: { status: "Paid", transactionSignature, explorerUrl }`}
            >
              <p>
                The existing payment system (bank transfer, SEPA, etc.)
                processes the actual payment. Then the portal calls
                <code>mark_paid</code> to record it on-chain with the
                ERP payment reference. The on-chain program validates that
                the disbursed amount does not exceed the authorized amount.
              </p>
            </CopyBlock>

            <h3>What changes vs. what stays</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Portal Action</div>
                <div className="live-case-cell live-case-cell-header">What Adduce Adds</div>
                <div className="live-case-cell live-case-cell-header">What Stays the Same</div>
              </div>
              {[
                { a: "Issue certificate", add: "One POST to create SAS attestation + case PDA", same: "PDF generation, internal DB, operator UI" },
                { a: "Submit documents", add: "Documents encrypted end-to-end (X25519+AES-256-GCM), stored permanently on Arweave via Irys. Plaintext hash anchored on-chain. Only assigned lawyer can decrypt.", same: "Upload flow, DMS as primary storage" },
                { a: "Verify eligibility", add: "One GET to read credential status", same: "Decision logic, eligibility rules" },
                { a: "Approve payment", add: "One POST to record disbursement on-chain", same: "Approval workflow, bank transfer, audit requirements" },
                { a: "Reassign lawyer", add: "One POST with new lawyer commitment", same: "Case assignment UI, notification flow" },
                { a: "Audit/report", add: "Read case PDAs from Solana (or /api/gov/cases)", same: "Reporting format, compliance requirements" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.a}</span></div>
                  <div className="live-case-cell" style={{ color: "var(--accent)" }}>{row.add}</div>
                  <div className="live-case-cell">{row.same}</div>
                </div>
              ))}
            </div>

            <h3>Government tech stack compatibility</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Stack</div>
                <div className="live-case-cell live-case-cell-header">Integration Path</div>
                <div className="live-case-cell live-case-cell-header">Effort</div>
              </div>
              {[
                { s: "Java / Spring Boot", p: "REST client (HttpClient or RestTemplate) calling /api/gov/* endpoints", e: "1-2 days" },
                { s: ".NET / C#", p: "HttpClient calling /api/gov/* endpoints", e: "1-2 days" },
                { s: "Python / Django", p: "requests library calling /api/gov/* endpoints", e: "1 day" },
                { s: "Node.js / TypeScript", p: "Direct Anchor SDK calls (no REST layer needed)", e: "Hours" },
                { s: "Legacy SOAP/XML", p: "Middleware adapter: SOAP-in, REST-out to Adduce API", e: "1 week" },
                { s: "No portal (paper only)", p: "Use Adduce demo dashboard directly at /dashboard", e: "Zero (use as-is)" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.s}</span></div>
                  <div className="live-case-cell">{row.p}</div>
                  <div className="live-case-cell" style={{ color: "var(--accent)" }}>{row.e}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── ANCHOR PROGRAM REFERENCE ── */}
          <section id="anchor-reference" className="docs-section">
            <div className="docs-section-label">Reference</div>
            <h2>Anchor program reference</h2>
            <p>
              Program ID:{" "}
              <a
                href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--accent)", display: "inline-flex", alignItems: "center", gap: "3px" }}
              >
                {PROGRAM_ID}<ExternalIcon />
              </a>
            </p>

            <h3>initialize(jurisdiction, expected_schema, reviewer, payer_role)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>authority</div>
                <div className="live-case-cell">Must be payer. Becomes the jurisdiction authority.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Params</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>jurisdiction: String, expected_schema: Pubkey, reviewer: Pubkey, payer_role: Pubkey</div>
                <div className="live-case-cell">Role separation: authority opens cases, reviewer links/closes, payer approves payment</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Creates</span></div>
                <div className="live-case-cell">ProgramConfig (293 bytes)</div>
                <div className="live-case-cell">authority, reviewer, payer, jurisdiction, expected_schema, operations_wallet, delegates[], case_timeout_days, total_cases=0</div>
              </div>
            </div>

            <h3>open_case(case_id, lawyer_commitment, applicant, authorized_amount)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>authority (must match config.authority)</div>
                <div className="live-case-cell">Only the jurisdiction authority can open cases</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Params</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>case_id: String, lawyer_commitment: [u8;32], applicant: Pubkey, authorized_amount: u64</div>
                <div className="live-case-cell">lawyer_commitment = SHA-256(lawyer_pubkey + salt). Authorized amount enforced during mark_paid.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">{"\u2192"} Open</div>
                <div className="live-case-cell">CaseFile (404 bytes) with credential_pubkey=default, commitment_root=[0;32]</div>
              </div>
            </div>

            <h3>link_credential(case_id, commitment_root)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>reviewer or authority</div>
                <div className="live-case-cell">Role-separated: reviewer links credentials</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Accounts</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>config, case_file (mut), credential_account, authority</div>
                <div className="live-case-cell">credential_account = SAS attestation PDA</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Validates</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>owner == SAS, schema match, expiry, nonce == applicant</div>
                <div className="live-case-cell">Dynamic SAS binary parsing; citizen binding enforced</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Params</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>case_id: String, commitment_root: [u8; 32]</div>
                <div className="live-case-cell">Merkle root of credential field commitments (must be non-zero)</div>
              </div>
            </div>

            <h3>anchor_document(case_id, document_hash, lawyer_salt)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>lawyer (proves identity via SHA-256 commitment)</div>
                <div className="live-case-cell">SHA-256(lawyer_pubkey + salt) must match case_file.lawyer_commitment</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Params</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>document_hash: [u8;32], lawyer_salt: [u8;32]</div>
                <div className="live-case-cell">Salt used to verify lawyer commitment without exposing pubkey on-chain</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Checks</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>credential liveness, commitment root non-zero</div>
                <div className="live-case-cell">Credential re-checked for liveness (revoked = rejected). LawyerCommitmentMismatch if salt wrong.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">Open/InProgress {"\u2192"} InProgress</div>
                <div className="live-case-cell">SHA-256 document hash stored on CaseFile PDA</div>
              </div>
            </div>

            <h3>close_case(case_id)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>reviewer, authority, or delegate</div>
                <div className="live-case-cell">If case exceeds case_timeout_days while InProgress, authority can close directly (escalation)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Checks</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>credential liveness re-check, status == InProgress</div>
                <div className="live-case-cell">Credential must still be live on-chain. Revoked credentials block case closure.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">InProgress {"\u2192"} Closed</div>
                <div className="live-case-cell">Lawyer can now claim payment</div>
              </div>
            </div>

            <h3>mark_paid(case_id, disbursed_amount, payment_reference)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>payer or authority</div>
                <div className="live-case-cell">Role-separated: payer approves payment after USDC or bank transfer</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Params</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>disbursed_amount: u64, payment_reference: String (max 64)</div>
                <div className="live-case-cell">Amount must be &lt;= authorized_amount. Reference = ERP invoice number or internal tracking ID for audit trail.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">Closed {"\u2192"} Paid (terminal)</div>
                <div className="live-case-cell">PaymentExceedsAuthorized error if disbursed &gt; authorized</div>
              </div>
            </div>

            <h3>Additional instructions (v2)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Instruction</div>
                <div className="live-case-cell live-case-cell-header">Signer</div>
                <div className="live-case-cell live-case-cell-header">Purpose</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">open_case_custodial</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Open case for citizen without wallet. Uses citizen_id_hash (SHA-256 of national ID) instead of pubkey. Court acts as custodian.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">reassign_lawyer</span></div>
                <div className="live-case-cell">Authority / Reviewer / Delegate</div>
                <div className="live-case-cell">Switch lawyer on active case. New lawyer_commitment set. Emits LawyerReassigned event with old/new commitments and reason.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">update_case_status</span></div>
                <div className="live-case-cell">Authority / Reviewer / Delegate</div>
                <div className="live-case-cell">Non-linear transitions: InProgress to Stayed/Appealed/Withdrawn. Closed to Remanded. Reverse transitions back to InProgress.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">reopen_case</span></div>
                <div className="live-case-cell">Authority only</div>
                <div className="live-case-cell">Moves Closed back to InProgress. Requires reason string. Emits CaseReopened event.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">verify_zk_disclosure</span></div>
                <div className="live-case-cell">Any signer</div>
                <div className="live-case-cell">Verifies 256-byte Groth16 proof on-chain via alt_bn128 pairing. Checks commitmentRoot matches PDA, predicateSatisfied == 1.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">add_delegate / remove_delegate</span></div>
                <div className="live-case-cell">Authority only</div>
                <div className="live-case-cell">Manage up to 3 delegate reviewers. Delegates can link credentials, close cases, reassign lawyers.</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">fund_operations</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Transfer SOL to the operations wallet. Ministry funds all transaction fees from this wallet.</div>
              </div>
            </div>

            <h3>Error codes</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Code</div>
                <div className="live-case-cell live-case-cell-header">Name</div>
                <div className="live-case-cell live-case-cell-header">Cause</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6000</div>
                <div className="live-case-cell">JurisdictionTooLong</div>
                <div className="live-case-cell">jurisdiction &gt; 10 chars</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6001</div>
                <div className="live-case-cell">CaseIdTooLong</div>
                <div className="live-case-cell">case_id &gt; 32 chars</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6002</div>
                <div className="live-case-cell">Unauthorized</div>
                <div className="live-case-cell">Signer does not match expected authority or lawyer</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6003</div>
                <div className="live-case-cell">InvalidStatus</div>
                <div className="live-case-cell">Case status does not permit this operation</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6004</div>
                <div className="live-case-cell">CredentialNotLinked</div>
                <div className="live-case-cell">No credential linked: call link_credential first</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6005</div>
                <div className="live-case-cell">CredentialWrongOwner</div>
                <div className="live-case-cell">Account not owned by SAS program</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6006</div>
                <div className="live-case-cell">CredentialSchemaMismatch</div>
                <div className="live-case-cell">Credential schema doesn&apos;t match jurisdiction&apos;s expected schema</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6007</div>
                <div className="live-case-cell">CredentialExpired</div>
                <div className="live-case-cell">Credential expiry timestamp is in the past</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6009</div>
                <div className="live-case-cell">CredentialApplicantMismatch</div>
                <div className="live-case-cell">Credential nonce does not match case applicant</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)" }}>6010</div>
                <div className="live-case-cell">CredentialRevoked</div>
                <div className="live-case-cell">Credential account has been closed (revoked via SAS)</div>
              </div>
            </div>
          </section>

          {/* ── MODULE 1: IDENTITY ── */}
          <section id="module-1" className="docs-section">
            <div className="docs-section-label">Module 1</div>
            <h2>Identity &amp; Credentials</h2>
            <p>
              The Solana Attestation Service (SAS) issues verifiable on-chain
              eligibility credentials. The same schema works across all 9
              supported jurisdictions: the Aide Juridictionnelle in France,
              the Toevoeging in Netherlands, and so on. Configurable per
              jurisdiction.
            </p>

            <h3>Schema fields</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Field</div>
                <div className="live-case-cell live-case-cell-header">Type</div>
                <div className="live-case-cell live-case-cell-header">Description</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">jurisdiction</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>String (12 bytes)</div>
                <div className="live-case-cell">ISO country code + region (e.g. &quot;DE&quot;, &quot;FR&quot;, &quot;AT&quot;)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">eligibility_tier</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>String (12 bytes)</div>
                <div className="live-case-cell">Aid level (TIER_1 = full, TIER_2 = partial, TIER_3 = consultation only)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">expiry_date</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>u64 (Unix timestamp)</div>
                <div className="live-case-cell">Credential validity period, typically 1 year from issuance</div>
              </div>
            </div>

            <h3>Setup steps</h3>
            <ul className="req-list">
              <li>Deploy the SAS schema once per jurisdiction using <code>scripts/create-schema.ts</code></li>
              <li>The schema address and credential address are saved to <code>scripts/schema-address.json</code></li>
              <li>Issue credentials to lawyers using <code>scripts/issue-credential.ts</code> or programmatically via the dashboard</li>
              <li>Verification happens on-chain: any party can read the attestation PDA and check expiry</li>
            </ul>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Issue a credential</span>
              </div>
              <div className="code-body">
                <pre>{`# Deploy schema (one-time per jurisdiction)
npx ts-node scripts/create-schema.ts

# Issue credential to a lawyer wallet
npx ts-node scripts/issue-credential.ts

# Verify a credential on-chain
npx ts-node scripts/verify-credential.ts`}</pre>
              </div>
            </div>
          </section>

          {/* ── MODULE 2: CASE MANAGEMENT ── */}
          <section id="module-2" className="docs-section">
            <div className="docs-section-label">Module 2</div>
            <h2>Case Management</h2>
            <p>
              The Anchor program manages the full case lifecycle on-chain with
              14 instructions, 4 events, and 26 error codes. The core flow
              (open, link, anchor, close, pay) is extended with custodial
              support, lawyer reassignment, delegation, escalation, extended
              case statuses, payment validation, and ZK proof verification.
            </p>

            <h3>Core flow (7 instructions)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Instruction</div>
                <div className="live-case-cell live-case-cell-header">Signer</div>
                <div className="live-case-cell live-case-cell-header">Effect</div>
              </div>
              {[
                { i: "initialize", s: "Authority", e: "Creates ProgramConfig (293 bytes) with roles, operations wallet, timeout" },
                { i: "open_case", s: "Authority", e: "Creates CaseFile (404 bytes) with lawyer_commitment + authorized_amount" },
                { i: "open_case_custodial", s: "Authority", e: "Same as open_case but for citizens without wallets (citizen_id_hash)" },
                { i: "link_credential", s: "Reviewer / Delegate", e: "Binds SAS credential to case. 5-point validation. Supports custodial nonce." },
                { i: "anchor_document", s: "Lawyer (via salt)", e: "Stores document hash. Lawyer proves identity via SHA-256 commitment." },
                { i: "close_case", s: "Reviewer / Delegate", e: "Closes case. Credential liveness re-checked. Timeout escalation supported." },
                { i: "mark_paid", s: "Payer", e: "Records disbursed_amount + payment_reference. Enforces amount <= authorized." },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.i}</span></div>
                  <div className="live-case-cell">{row.s}</div>
                  <div className="live-case-cell">{row.e}</div>
                </div>
              ))}
            </div>

            <h3>Extended instructions (7 more)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Instruction</div>
                <div className="live-case-cell live-case-cell-header">Signer</div>
                <div className="live-case-cell live-case-cell-header">Effect</div>
              </div>
              {[
                { i: "reassign_lawyer", s: "Authority / Reviewer", e: "Switch lawyer on active case. Emits LawyerReassigned event." },
                { i: "update_case_status", s: "Authority / Reviewer", e: "Non-linear transitions: Stayed, Appealed, Withdrawn, Remanded" },
                { i: "reopen_case", s: "Authority only", e: "Moves Closed back to InProgress with reason + event" },
                { i: "verify_zk_disclosure", s: "Any signer", e: "Verifies 256-byte Groth16 proof on-chain (alt_bn128 pairing)" },
                { i: "add_delegate", s: "Authority", e: "Add delegate reviewer (max 3)" },
                { i: "remove_delegate", s: "Authority", e: "Remove delegate" },
                { i: "fund_operations", s: "Authority", e: "Top up operations wallet with SOL for transaction fees" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.i}</span></div>
                  <div className="live-case-cell">{row.s}</div>
                  <div className="live-case-cell">{row.e}</div>
                </div>
              ))}
            </div>

            <h3>State machine (8 statuses)</h3>
            <div style={{ fontFamily: "var(--mono)", fontSize: "0.75rem", lineHeight: "1.8", padding: "1.5rem", background: "var(--bg-warm)", borderRadius: "8px", border: "1px solid var(--border)" }}>
              <div>Open &rarr; InProgress &rarr; Closed &rarr; Paid</div>
              <div style={{ marginTop: "0.5rem", color: "var(--text-secondary)" }}>
                InProgress &harr; Stayed (court stay, reversible)<br/>
                InProgress &harr; Appealed (appeal filed, reversible)<br/>
                InProgress &rarr; Withdrawn (applicant withdraws)<br/>
                Closed &rarr; Remanded (higher court sends back &rarr; InProgress)<br/>
                Closed &rarr; InProgress (via reopen_case with reason)
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Build and deploy</span>
              </div>
              <div className="code-body">
                <pre>{`# Build the Anchor program
anchor build

# Deploy to devnet
anchor deploy --provider.cluster devnet

# Run integration tests
anchor test`}</pre>
              </div>
            </div>
          </section>

          {/* ── MODULE 3: DOCUMENT INTEGRITY + STORAGE ── */}
          <section id="module-3" className="docs-section">
            <div className="docs-section-label">Module 3</div>
            <h2>Document Integrity &amp; Storage</h2>
            <p>
              Adduce uses a layered storage architecture. No personal data or
              document content touches the public ledger. The chain stores
              only cryptographic proofs of existence. Actual documents stay
              where they are today.
            </p>

            <h3>Where data lives</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Data Type</div>
                <div className="live-case-cell live-case-cell-header">Where Stored</div>
                <div className="live-case-cell live-case-cell-header">Technology</div>
                <div className="live-case-cell live-case-cell-header">Who Can Read</div>
              </div>
              {[
                { d: "Credential (eligibility)", w: "Solana (PDA)", t: "SAS attestation", r: "Anyone (but fields hidden behind commitments)" },
                { d: "Case lifecycle state", w: "Solana (PDA)", t: "Anchor CaseFile account", r: "Anyone (lawyer identity is a hash)" },
                { d: "Document hash", w: "Solana (CaseFile PDA)", t: "SHA-256 fingerprint", r: "Anyone (but hash is one-way, can't reconstruct doc)" },
                { d: "Compressed audit logs", w: "Solana (compressed state)", t: "Light Protocol + Helius Photon", r: "Anyone with Helius RPC (not enumerable)" },
                { d: "Encrypted documents", w: "Arweave (permanent storage)", t: "Irys upload + X25519+AES-256-GCM", r: "Only assigned lawyer (holder of decryption key)" },
                { d: "Original case files", w: "Government DMS (unchanged)", t: "Existing ministry system", r: "Existing access controls" },
                { d: "Citizen personal data", w: "Government DB only", t: "Never touches blockchain", r: "Government staff under GDPR obligations" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.d}</span></div>
                  <div className="live-case-cell">{row.w}</div>
                  <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.7rem" }}>{row.t}</div>
                  <div className="live-case-cell">{row.r}</div>
                </div>
              ))}
            </div>

            <h3>Document anchoring flow</h3>
            <ul className="req-list">
              <li>Lawyer uploads documents via the dashboard or ministry portal</li>
              <li>System computes SHA-256 hash of the document</li>
              <li>Lawyer provides their salt to prove assignment (commitment verification)</li>
              <li>Hash is stored in the CaseFile PDA via <code>anchor_document</code></li>
              <li>Credential liveness is re-checked before anchoring is allowed</li>
              <li>Any auditor can verify: hash the document locally, compare with on-chain hash</li>
            </ul>

            <h3>Encrypted document storage (optional)</h3>
            <p>
              For cases where documents need to be shared securely between
              the court and the assigned lawyer, Adduce provides end-to-end
              encrypted storage via Arweave (permanent, decentralized) through
              the Irys upload service.
            </p>
            <CopyBlock
              title="Encrypt and upload a document (TypeScript, live)"
              code={`import { encryptDocument, deriveEncryptionKeypair } from "./lib/privacy";
import { uploadToArweave } from "./upload-to-arweave";

// 1. Derive encryption keys from Solana wallet (deterministic)
const senderKeys = deriveEncryptionKeypair(courtWallet.secretKey);
const recipientKeys = deriveEncryptionKeypair(lawyerWallet.secretKey);

// 2. Encrypt document (X25519 ECDH + AES-256-GCM)
const envelope = encryptDocument(
  documentBuffer,
  recipientKeys.publicKey,    // only the lawyer can decrypt
  courtWallet.secretKey       // court signs the encryption
);

// 3. Upload ciphertext to Arweave via Irys (permanent storage)
const arweaveUrl = await uploadToArweave(envelope);

// 4. Anchor the plaintext hash on-chain (proves document existed)
// envelope.plaintextHash goes into anchor_document()
// The actual document is encrypted on Arweave, hash is on Solana`}
            >
              <p>
                The court encrypts the document so only the assigned lawyer can
                read it. The plaintext hash is anchored on-chain (for integrity
                verification). The ciphertext is stored on Arweave (permanent,
                censorship-resistant). The lawyer decrypts using their wallet
                key. See <code>scripts/encrypt-and-anchor.ts</code> for the
                full working example.
              </p>
            </CopyBlock>

            <h3>GDPR compliance</h3>
            <ul className="req-list">
              <li>No personally identifiable information (PII) on-chain</li>
              <li>Document hashes are one-way: cannot reconstruct the original</li>
              <li>Encrypted documents on Arweave are readable only by the assigned lawyer</li>
              <li>Client names, addresses, case details remain in the national system</li>
              <li>Lawyer identity on-chain is a SHA-256 commitment, not a raw public key</li>
            </ul>

            <h3>Scripts</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Script</div>
                <div className="live-case-cell live-case-cell-header">What It Does</div>
                <div className="live-case-cell live-case-cell-header">Status</div>
              </div>
              {[
                { s: "scripts/encrypt-and-anchor.ts", d: "Encrypt document (X25519+AES-256-GCM), anchor hash on Solana", st: "Live" },
                { s: "scripts/upload-to-arweave.ts", d: "Upload encrypted document to Arweave via Irys", st: "Live" },
                { s: "scripts/anchor-document-compressed.ts", d: "Anchor hash using Light Protocol compression (98.8% cheaper)", st: "Live" },
                { s: "scripts/query-compressed.ts", d: "Query compressed accounts via Helius Photon indexer", st: "Live" },
                { s: "scripts/cost-comparison.ts", d: "Compare standard PDA vs compressed storage costs", st: "Live" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.7rem" }}>{row.s}</div>
                  <div className="live-case-cell">{row.d}</div>
                  <div className="live-case-cell" style={{ color: "var(--accent)" }}>{row.st}</div>
                </div>
              ))}
            </div>
          </section>

          {/* ── MODULE 4: ZK COMPRESSION ── */}
          <section id="module-4" className="docs-section">
            <div className="docs-section-label">Module 4</div>
            <h2>ZK Compression (Light Protocol)</h2>
            <p>
              Light Protocol compresses on-chain state using zero-knowledge
              proofs, reducing storage costs by 98.8%. This is critical at
              government scale: a country processing 100,000 legal aid
              cases per year saves over $22,000 annually on infrastructure
              costs alone.
            </p>

            <h3>Cost comparison</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Method</div>
                <div className="live-case-cell live-case-cell-header">Cost per case</div>
                <div className="live-case-cell live-case-cell-header">At 100K cases/year</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Standard PDA</span></div>
                <div className="live-case-cell">~$0.30 (1,997,520 lamports)</div>
                <div className="live-case-cell">~$30,000/year</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">ZK Compressed</span></div>
                <div className="live-case-cell">~$0.004 (25,003 lamports)</div>
                <div className="live-case-cell">~$400/year</div>
              </div>
            </div>

            <h3>How compression works</h3>
            <ul className="req-list">
              <li>Light Protocol stores data as leaves in a Merkle tree rather than individual accounts</li>
              <li>Validity is proved via ZK proofs (same BN254 curve as our selective disclosure circuit)</li>
              <li>Compressed accounts are not directly enumerable on Explorer (privacy benefit)</li>
              <li>Helius Photon indexer provides query access to compressed state</li>
              <li>From the developer perspective: use <code>createRpc()</code> from <code>@lightprotocol/stateless.js</code> and call <code>compress()</code></li>
            </ul>

            <CopyBlock
              title="Compress and anchor audit log (TypeScript, live)"
              code={`import { createRpc, compress } from "@lightprotocol/stateless.js";

// 1. Connect to Helius (required for Light Protocol)
const rpc = createRpc(HELIUS_RPC_URL, HELIUS_RPC_URL, HELIUS_RPC_URL);

// 2. Compress SOL into Light Protocol state tree
const compressLamports = 10_000;
await compress(rpc, payer, compressLamports, payer.publicKey);

// 3. Anchor case metadata as compressed memo
const memo = JSON.stringify({
  case_id: "BS-DE-143/22",
  document_hash: "175b1e36...",
  timestamp: Date.now(),
  status: "closed"
});
// Memo program anchors this in compressed state
// Cost: ~$0.004 vs ~$0.30 for standard PDA`}
            >
              <p>
                The compression script uses Helius as both RPC and Photon
                indexer. All three parameters to <code>createRpc()</code> point
                to Helius because it serves JSON-RPC, prover, and indexer
                functions from a single endpoint. See{" "}
                <code>scripts/anchor-document-compressed.ts</code> for the
                full implementation.
              </p>
            </CopyBlock>

            <h3>Requirements</h3>
            <ul className="req-list">
              <li>Helius RPC endpoint (standard Solana RPC does not support compressed accounts)</li>
              <li>Set <code>HELIUS_RPC_URL</code> in your <code>.env</code> file</li>
              <li>Photon indexer is built into Helius: no separate service needed</li>
              <li><code>@lightprotocol/stateless.js</code> and <code>@lightprotocol/compressed-token</code> packages</li>
            </ul>
          </section>

          {/* ── MODULE 5: PAYMENT ── */}
          <section id="module-5" className="docs-section">
            <div className="docs-section-label">Module 5</div>
            <h2>Payment Settlement</h2>
            <p>
              The x402 protocol enables HTTP-native payment flows. When a
              lawyer claims payment, the system verifies their SAS credential
              and the on-chain payment transaction before confirming. Settlement
              happens in USDC (or EURC for eurozone deployments).
            </p>

            <h3>Payment flow</h3>
            <ul className="req-list">
              <li><strong>GET /api/claim-payment</strong>: Returns 402 Payment Required with x402 spec (amount, asset, credential requirements)</li>
              <li><strong>POST /api/claim-payment</strong>: Accepts payment signature + lawyer wallet. Verifies: (a) SAS credential exists and is valid, (b) USDC transfer confirmed on-chain, (c) case is in Closed status</li>
              <li>On success, the automation agent or authority calls <code>mark_paid</code> to finalize the case</li>
            </ul>

            <h3>x402 headers</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">x402 payment response</span>
              </div>
              <div className="code-body">
                <pre>{`HTTP/1.1 402 Payment Required
X-Payment-Amount: 85000000
X-Payment-Asset: USDC
X-Payment-Chain: solana:devnet
X-Payment-Recipient: <authority-wallet>
X-Credential-Required: SAS
X-Credential-Schema: 7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid`}</pre>
              </div>
            </div>
          </section>

          {/* ── MODULE 6: AUTOMATION ── */}
          <section id="module-6" className="docs-section">
            <div className="docs-section-label">Module 6</div>
            <h2>Automation Agent</h2>
            <p>
              The agent runs as a background service, polling the on-chain
              program every 15 seconds for cases in Closed status. When it finds
              one, it executes the full disbursement pipeline automatically:
              credential verification, USDC transfer, compressed log creation,
              and status update.
            </p>

            <h3>What the agent does</h3>
            <ul className="req-list">
              <li>Scans all CaseFile PDAs for status = Closed</li>
              <li>For each closed case, verifies the assigned lawyer&rsquo;s SAS credential</li>
              <li>Transfers USDC from the court treasury to the lawyer&rsquo;s token account</li>
              <li>Creates a compressed audit log via Light Protocol</li>
              <li>Calls <code>mark_paid</code> to finalize the case on-chain</li>
            </ul>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Run the agent</span>
              </div>
              <div className="code-body">
                <pre>{`# Run the production automation agent
npx ts-node scripts/agent.ts

# Or run the full e2e pipeline (demo mode)
npx ts-node scripts/e2e-full-pipeline.ts

# Run the German BS sample case
npx ts-node scripts/sample-german-bs-case.ts`}</pre>
              </div>
            </div>
          </section>

          {/* ── LIVE CASE ── */}
          <section id="live-case" className="docs-section">
            <div className="docs-section-label">Live on Devnet</div>
            <h2>Sample Case: German Berechtigungsschein</h2>
            <p>
              This is a real case executed on Solana Devnet following the exact
              German Beratungshilfe workflow. Every transaction below is
              clickable and verifiable on Solana Explorer. Reference:{" "}
              <strong>{LIVE_CASE.reference}</strong>.
            </p>

            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Step</div>
                <div className="live-case-cell live-case-cell-header">Operation</div>
                <div className="live-case-cell live-case-cell-header">Transaction</div>
              </div>
              {Object.entries(LIVE_CASE.transactions).map(([key, val], i) => (
                <div className="live-case-row" key={key}>
                  <div className="live-case-cell"><span className="cell-label">{i + 1}</span></div>
                  <div className="live-case-cell"><span className="cell-label">{val.label}</span></div>
                  <div className="live-case-cell">
                    <a
                      href={`${EXPLORER_BASE}/tx/${val.tx}?cluster=devnet`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {val.tx.slice(0, 20)}&hellip;
                      <ExternalIcon />
                    </a>
                  </div>
                </div>
              ))}
            </div>

            <h3 style={{ marginTop: "2rem" }}>Key addresses</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Entity</div>
                <div className="live-case-cell live-case-cell-header">Type</div>
                <div className="live-case-cell live-case-cell-header">Address</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Program</span></div>
                <div className="live-case-cell">Anchor Program</div>
                <div className="live-case-cell">
                  <a href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {PROGRAM_ID.slice(0, 16)}&hellip;<ExternalIcon />
                  </a>
                </div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Berechtigungsschein</span></div>
                <div className="live-case-cell">SAS Attestation PDA</div>
                <div className="live-case-cell">
                  <a href={`${EXPLORER_BASE}/address/${LIVE_CASE.transactions.credential.pda}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.credential.pda?.slice(0, 16)}&hellip;<ExternalIcon />
                  </a>
                </div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Case PDA</span></div>
                <div className="live-case-cell">CaseFile Account</div>
                <div className="live-case-cell">
                  <a href={`${EXPLORER_BASE}/address/${LIVE_CASE.transactions.caseOpened.pda}?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    {LIVE_CASE.transactions.caseOpened.pda?.slice(0, 16)}&hellip;<ExternalIcon />
                  </a>
                </div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">SAS Schema</span></div>
                <div className="live-case-cell">Credential Schema</div>
                <div className="live-case-cell">
                  <a href={`${EXPLORER_BASE}/address/7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid?cluster=devnet`} target="_blank" rel="noopener noreferrer">
                    7uKMGSgup1UZ26Mn&hellip;<ExternalIcon />
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* ── COUNTRY CONFIG ── */}
          <section id="country-config" className="docs-section">
            <div className="docs-section-label">Deployment</div>
            <h2>Configure for any country</h2>
            <p>
              Adduce is jurisdiction-agnostic by design. The protocol uses a
              two-character jurisdiction code as the seed for all
              jurisdiction-scoped accounts. To deploy for a new country, you
              configure three things: the jurisdiction code, the SAS credential
              schema, and the payment asset.
            </p>

            <div className="country-grid">
              <div className="country-card">
                <div className="country-flag">DE</div>
                <div className="country-name">Germany</div>
                <div className="country-cert">Berechtigungsschein</div>
                <div className="country-detail">
                  Beratungshilfe system. Court-issued certificate. Tiers: consultation, representation, settlement.
                  Payment: fixed fee schedule per assistance type.
                </div>
              </div>
              <div className="country-card">
                <div className="country-flag">FR</div>
                <div className="country-name">France</div>
                <div className="country-cert">Aide Juridictionnelle</div>
                <div className="country-detail">
                  Bureau d&rsquo;aide juridictionnelle issues certificates.
                  Income-based tiers (full/partial). Highest volume in EU.
                </div>
              </div>
              <div className="country-card">
                <div className="country-flag">AT</div>
                <div className="country-name">Austria</div>
                <div className="country-cert">Verfahrenshilfe</div>
                <div className="country-detail">
                  Court-granted procedural assistance. Income verification required. Smaller market, easier pilot entry.
                </div>
              </div>
              <div className="country-card">
                <div className="country-flag">NL</div>
                <div className="country-name">Netherlands</div>
                <div className="country-cert">Toevoeging</div>
                <div className="country-detail">
                  Raad voor Rechtsbijstand issues assignment letters.
                  High digitalization readiness. Digital credential early adopter.
                </div>
              </div>
              <div className="country-card">
                <div className="country-flag">ES</div>
                <div className="country-name">Spain</div>
                <div className="country-cert">Justicia Gratuita</div>
                <div className="country-detail">
                  Regional bar association managed. Income threshold based.
                  Comisi&oacute;n de Asistencia Jur&iacute;dica Gratuita issues certificates.
                </div>
              </div>
              <div className="country-card">
                <div className="country-flag">IT</div>
                <div className="country-name">Italy</div>
                <div className="country-cert">Patrocinio a spese dello Stato</div>
                <div className="country-detail">
                  Consiglio dell&rsquo;Ordine degli Avvocati manages applications.
                  Income-based eligibility with regional variations.
                </div>
              </div>
            </div>

            <h3>Configuration steps for a new country</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">New jurisdiction setup</span>
              </div>
              <div className="code-body">
                <pre>{`# 1. Set jurisdiction code in your environment
export JURISDICTION="FR"  # France

# 2. Deploy SAS credential schema for the jurisdiction
#    Edit scripts/create-schema.ts — change schema fields if needed:
#    - jurisdiction: "FR"
#    - eligibility_tier: mapped to local categories
#    - expiry_date: per local regulation
npx ts-node scripts/create-schema.ts

# 3. Initialize the on-chain jurisdiction config
#    The Anchor program creates a ProgramConfig PDA
#    seeded with ["config", "FR"]
#    This is done automatically on first case open

# 4. Configure payment asset
#    USDC for dollar-pegged, EURC for eurozone
#    Set in .env: PAYMENT_MINT=<token-mint-address>

# 5. Issue credentials to registered lawyers
npx ts-node scripts/issue-credential.ts

# 6. Start the automation agent
npx ts-node scripts/agent.ts`}</pre>
              </div>
            </div>

            <h3>What you customize per country</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Parameter</div>
                <div className="live-case-cell live-case-cell-header">Where</div>
                <div className="live-case-cell live-case-cell-header">Example</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Jurisdiction code</span></div>
                <div className="live-case-cell">.env, scripts, Anchor init</div>
                <div className="live-case-cell">&quot;DE&quot;, &quot;FR&quot;, &quot;AT&quot;, &quot;NL&quot;, &quot;BR&quot;</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Credential schema</span></div>
                <div className="live-case-cell">scripts/create-schema.ts</div>
                <div className="live-case-cell">Field names, sizes, tiers per local law</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Payment asset</span></div>
                <div className="live-case-cell">.env PAYMENT_MINT</div>
                <div className="live-case-cell">USDC, EURC, or custom SPL token</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Fee schedule</span></div>
                <div className="live-case-cell">scripts/agent.ts, API route</div>
                <div className="live-case-cell">Per-case payment amounts by assistance type</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Authority wallet</span></div>
                <div className="live-case-cell">~/.config/solana/id.json</div>
                <div className="live-case-cell">Court/ministry keypair that signs state transitions</div>
              </div>
            </div>
          </section>

          {/* ── QUICKSTART ── */}
          <section id="quickstart" className="docs-section">
            <div className="docs-section-label">Getting Started</div>
            <h2>Quickstart</h2>
            <p>
              Full setup from clone to running sample case in under 10 minutes.
            </p>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Terminal</span>
              </div>
              <div className="code-body">
                <pre>{`# Clone the repository
git clone https://github.com/SAHU-01/legal_aid.git
cd legal_aid

# Install dependencies (requires Node >= 22)
nvm use 22
npm install

# Configure environment
cp .env.example .env
# Edit .env — add your Helius API key:
# HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Build the Anchor program
anchor build

# Deploy to Solana devnet
anchor deploy --provider.cluster devnet

# Run the German sample case (creates real on-chain txs)
npx ts-node scripts/sample-german-bs-case.ts

# Start the Next.js dashboard
npm run dev

# Open http://localhost:3000/dashboard`}</pre>
              </div>
            </div>

            <h3>Prerequisites</h3>
            <ul className="req-list">
              <li><strong>Node.js 22+</strong>: Required by Anchor SDK. Use <code>nvm use 22</code></li>
              <li><strong>Rust + Anchor CLI</strong>: <code>cargo install --git https://github.com/coral-xyz/anchor avm</code></li>
              <li><strong>Solana CLI</strong>: <code>sh -c &quot;$(curl -sSfL https://release.anza.xyz/stable/install)&quot;</code></li>
              <li><strong>Helius API key</strong>: Free tier at helius.dev (required for Light Protocol / compressed accounts)</li>
              <li><strong>Devnet SOL</strong>: <code>solana airdrop 2</code> (fund your local wallet)</li>
            </ul>
          </section>

          {/* ── ZK SELECTIVE DISCLOSURE ── */}
          <section id="zk-circuit" className="docs-section">
            <div className="docs-section-label">Zero Knowledge</div>
            <h2>ZK Selective Disclosure</h2>
            <p>
              A custom Circom circuit enables true zero-knowledge credential
              verification. Holders prove statements about credential fields
              without revealing them. Proofs are verified on-chain using
              Solana&rsquo;s native alt_bn128 pairing syscall.
            </p>

            <h3>Circuit specification</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              {[
                { p: "Circuit", v: "circuits/selective_disclosure.circom", n: "Circom 2.2" },
                { p: "Curve", v: "BN254 (alt_bn128)", n: "Same as Light Protocol and Ethereum ZK rollups" },
                { p: "Hash", v: "Poseidon", n: "Snark-friendly, replaces SHA-256 for commitments" },
                { p: "Constraints", v: "7,883", n: "Well within Solana compute budget" },
                { p: "Proof size", v: "256 bytes", n: "A[G1] + B[G2] + C[G1]" },
                { p: "Public inputs", v: "7", n: "commitmentRoot, disclosedValue, disclosureIndex, predicateValue, predicateIndex, predicateSatisfied, issuerPubkeyHash" },
                { p: "Verification cost", v: "~200,000 CU", n: "4 pairing + 7 scalar multiplications" },
                { p: "Proof generation", v: "~660ms (off-chain)", n: "snarkjs + circuit WASM" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.p}</span></div>
                  <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>{row.v}</div>
                  <div className="live-case-cell">{row.n}</div>
                </div>
              ))}
            </div>

            <h3>What the verifier learns vs. what stays private</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Verifier Learns</div>
                <div className="live-case-cell live-case-cell-header">Stays Private (ZK)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Disclosed field value (e.g., jurisdiction = &quot;DE&quot;)</div>
                <div className="live-case-cell">All other field values</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Predicate result (e.g., &quot;not expired&quot; = true)</div>
                <div className="live-case-cell">Exact expiry date</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Credential issuer hash</div>
                <div className="live-case-cell">Applicant identity, case type, salts</div>
              </div>
            </div>

            <h3>Build the circuit</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Circuit build + test</span>
              </div>
              <div className="code-body">
                <pre>{`cd circuits
npm install          # installs circomlib + snarkjs
./build.sh           # compile + Powers of Tau + phase 2 setup + export VK
node test_proof.js   # generate + verify a test proof locally

# Run the full ZK demo
cd .. && npx ts-node scripts/zk-disclosure-demo.ts`}</pre>
              </div>
            </div>
          </section>

          {/* ── SDK INTEGRATION ── */}
          <section id="integration-sdk" className="docs-section">
            <div className="docs-section-label">Integration</div>
            <h2>SDK Integration Guide</h2>
            <p>
              How external systems (government portals, case management
              systems, ERP platforms) integrate with Adduce. Every
              instruction is callable via the Anchor TypeScript SDK.
            </p>

            <h3>PDA derivation</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">TypeScript: derive account addresses</span>
              </div>
              <div className="code-body">
                <pre>{`import { PublicKey } from "@solana/web3.js";

const PROGRAM_ID = new PublicKey("3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV");

// Config PDA (one per jurisdiction)
const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config"), Buffer.from("DE")],
  PROGRAM_ID
);

// Case PDA (one per case ID)
const [casePda] = PublicKey.findProgramAddressSync(
  [Buffer.from("case"), Buffer.from("BS-DE-143/22")],
  PROGRAM_ID
);`}</pre>
              </div>
            </div>

            <h3>Lawyer commitment generation</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">TypeScript: create lawyer commitment</span>
              </div>
              <div className="code-body">
                <pre>{`import { createHash, randomBytes } from "crypto";

// Generate commitment (done once during open_case)
const lawyerPubkey = lawyerKeypair.publicKey.toBytes();
const salt = randomBytes(32);
const commitment = createHash("sha256")
  .update(Buffer.concat([lawyerPubkey, salt]))
  .digest();

// Store salt securely — lawyer needs it for anchor_document
// commitment goes on-chain, salt stays off-chain`}</pre>
              </div>
            </div>

            <h3>Custodial case (citizen without wallet)</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">TypeScript: open custodial case</span>
              </div>
              <div className="code-body">
                <pre>{`import { createHash } from "crypto";

// Hash the citizen's national ID (never stored in plaintext)
const citizenIdHash = createHash("sha256")
  .update("DE-PERSONALAUSWEIS-L01234567")
  .digest();

// Court acts as custodian — citizen never touches blockchain
await program.methods
  .openCaseCustodial(
    "BS-DE-143/22",
    lawyerCommitment,
    Array.from(citizenIdHash),
    custodianPubkey,
    85_000_000  // authorized amount in atomic units
  )
  .accounts({ config: configPda, caseFile: casePda, authority: courtWallet.publicKey })
  .signers([courtWallet])
  .rpc();`}</pre>
              </div>
            </div>
          </section>

          {/* ── API REFERENCE ── */}
          <section id="api-reference" className="docs-section">
            <div className="docs-section-label">Reference</div>
            <h2>API &amp; Scripts</h2>

            <h3>API Routes</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Endpoint</div>
                <div className="live-case-cell live-case-cell-header">Method</div>
                <div className="live-case-cell live-case-cell-header">Description</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>/api/claim-payment</div>
                <div className="live-case-cell">GET</div>
                <div className="live-case-cell">Returns 402 with x402 payment requirements and credential spec</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>/api/claim-payment</div>
                <div className="live-case-cell">POST</div>
                <div className="live-case-cell">Verifies SAS credential + payment tx, returns 200 with confirmation</div>
              </div>
            </div>

            <h3>Scripts reference</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Script</div>
                <div className="live-case-cell live-case-cell-header">Purpose</div>
                <div className="live-case-cell live-case-cell-header">When to use</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>sample-german-bs-case.ts</div>
                <div className="live-case-cell">Full German BS workflow</div>
                <div className="live-case-cell">Demo, testing, generating verifiable sample data</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>e2e-full-pipeline.ts</div>
                <div className="live-case-cell">Complete 10-step pipeline</div>
                <div className="live-case-cell">Full E2E testing, demo report generation</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>agent.ts</div>
                <div className="live-case-cell">Production automation</div>
                <div className="live-case-cell">Continuous operation, auto-disbursement</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>create-schema.ts</div>
                <div className="live-case-cell">Deploy SAS schema</div>
                <div className="live-case-cell">One-time per jurisdiction setup</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>issue-credential.ts</div>
                <div className="live-case-cell">Issue credential</div>
                <div className="live-case-cell">Onboarding a new lawyer</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>verify-credential.ts</div>
                <div className="live-case-cell">Verify credential</div>
                <div className="live-case-cell">Check credential validity before payment</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>cost-comparison.ts</div>
                <div className="live-case-cell">Cost analysis</div>
                <div className="live-case-cell">Standard PDA vs ZK compressed cost comparison</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>create-test-cases.ts</div>
                <div className="live-case-cell">Generate test data</div>
                <div className="live-case-cell">Creating multiple cases for agent testing</div>
              </div>
            </div>

            <h3>Environment variables</h3>
            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">.env</span>
              </div>
              <div className="code-body">
                <pre>{`# Required
HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY

# Program addresses (set after deployment)
NEXT_PUBLIC_PROGRAM_ID=3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV
NEXT_PUBLIC_SAS_PROGRAM_ID=22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG

# Network
NEXT_PUBLIC_NETWORK=devnet`}</pre>
              </div>
            </div>
          </section>

          {/* ── GOVERNANCE ── */}
          <section id="governance" className="docs-section">
            <div className="docs-section-label">Governance</div>
            <h2>Authority model, revocation, and upgrades</h2>

            <h3>Issuer authority model</h3>
            <p>
              Each jurisdiction has a single ProgramConfig PDA with an
              <code>authority</code> pubkey. This authority is the only signer
              that can open cases, close cases, mark payments, and issue SAS
              credentials. In production, this is the court or ministry keypair.
              Multi-sig (e.g. Squads Protocol) can be used for shared authority.
            </p>

            <h3>Credential revocation</h3>
            <p>
              SAS attestations support revocation natively. The issuing authority
              can close or revoke an attestation at any time. On the next
              verification check, <code>fetchMaybeAttestation()</code> returns
              <code>exists: false</code> and the payment claim is rejected. No
              phone calls, no manual registry updates.
            </p>

            <h3>Program upgrade path</h3>
            <ul className="req-list">
              <li>The Anchor program is currently deployed as upgradeable on Devnet (standard Anchor default)</li>
              <li>For production, the upgrade authority can be transferred to a multi-sig or frozen entirely</li>
              <li>Account structures (ProgramConfig, CaseFile) include a <code>bump</code> field for forward-compatible PDA derivation</li>
              <li>New instructions can be added without breaking existing PDAs: Anchor&rsquo;s discriminator model ensures backward compatibility</li>
              <li>SAS schema is immutable once deployed: new fields require a new schema version</li>
            </ul>
          </section>

        </div>
      </div>

      {/* FOOTER */}
      <footer className="docs-footer">
        <span>Adduce: Justice, verified on-chain.</span>
        <span>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          {" "}&middot;{" "}
          <Link href="/">Home</Link>
          {" "}&middot;{" "}
          <Link href="/docs">Documentation</Link>
          {" "}&middot;{" "}
          <Link href="/dashboard">Dashboard</Link>
        </span>
      </footer>
    </div>
  );
}
