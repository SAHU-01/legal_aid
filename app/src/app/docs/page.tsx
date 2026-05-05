import Link from "next/link";
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
            <li><a href="#anchor-reference">Anchor Program</a></li>
            <li><a href="#module-1">SAS Credentials</a></li>
            <li><a href="#module-4">ZK Compression</a></li>
            <li><a href="#module-5">Payment (x402)</a></li>
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
                  Bayern Justizportal
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
                <div style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: "0.3rem" }}>Bayern Justizportal, SAP, custom ERP</div>
                <div style={{ margin: "0.8rem 0 0.4rem", fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600 }}>{"\u2193"} Adduce SDK calls {"\u2193"}</div>
              </div>
              <div className="module-card" style={{ borderLeft: "3px solid var(--accent)" }}>
                <div style={{ fontSize: "0.7rem", color: "var(--accent)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>Adduce Protocol Layer</div>
                <ul className="req-list" style={{ margin: "0.5rem 0 0" }}>
                  <li>SAS: identity attestations (Berechtigungsschein)</li>
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
                  equivalent of a Berechtigungsschein, Aide Juridictionnelle
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
            <div className="docs-section-label">Comparison</div>
            <h2>Why a public chain beats Hyperledger Fabric</h2>
            <p>
              The standard government blockchain pitch is a private consortium
              chain. Here is an honest comparison.
            </p>

            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Dimension</div>
                <div className="live-case-cell live-case-cell-header">Hyperledger Fabric</div>
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
                <div className="live-case-cell">Requires inter-ministerial agreement</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Native: anyone reads the PDA</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Infrastructure cost</span></div>
                <div className="live-case-cell">$500K+ nodes + consulting</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>$51/month pure OpEx (Helius RPC)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Deploy time</span></div>
                <div className="live-case-cell">6&ndash;18 months (consortium formation)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>1 day (anchor deploy)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Storage cost per case</span></div>
                <div className="live-case-cell">~$0.50&ndash;$2.00 (CouchDB state)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>$0.004 (ZK compressed)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Interoperability</span></div>
                <div className="live-case-cell">Walled garden per consortium</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Open: any W3C/eIDAS-compatible verifier</div>
              </div>
            </div>

            <h3>When Fabric is the right choice</h3>
            <p>
              Fabric wins when you need strict data-residency (all data must stay
              within national borders), when your regulatory framework explicitly
              mandates a permissioned ledger, or when the participating
              institutions already operate a shared Fabric network. Adduce is
              designed for the opposite scenario: lightweight credential
              verification and payment settlement that must work across
              jurisdictions without a consortium agreement.
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

            <div className="arch-flow">
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
            </div>

            <p>
              <strong>Program ID:</strong>{" "}
              <a
                href={`${EXPLORER_BASE}/address/${PROGRAM_ID}?cluster=devnet`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--accent)" }}
              >
                {PROGRAM_ID}
                <ExternalIcon />
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
                  <h4>Court Operator (Rechtspfleger / Clerk)</h4>
                </div>
                <div className="role-subtitle">On-chain role: Authority signer</div>
                <p>
                  Government employee at the court or ministry. Reviews
                  eligibility applications, issues legal aid certificates
                  (Berechtigungsscheine), monitors case progress, and approves
                  payment disbursements. Role-separated: <strong>authority</strong>{" "}
                  calls <code>initialize</code> and <code>open_case</code>,{" "}
                  <strong>reviewer</strong> calls <code>link_credential</code> and{" "}
                  <code>close_case</code>, <strong>payer</strong> calls{" "}
                  <code>mark_paid</code>.
                </p>
              </div>
              <div className="module-card role-card role-card-lawyer">
                <div className="module-card-header">
                  <span className="role-badge role-badge-lawyer">Lawyer</span>
                  <h4>Lawyer (Rechtsanwalt / Avocat)</h4>
                </div>
                <div className="role-subtitle">On-chain role: Lawyer signer</div>
                <p>
                  Private attorney who takes legal aid cases. Must hold a valid
                  SAS credential (the digital Berechtigungsschein). Receives
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
                  receives a Berechtigungsschein if eligible, and takes it to a
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
              payment approval. In the German system, this maps to the
              Rechtspfleger at the Amtsgericht.
            </p>

            <div className="arch-flow">
              <div className="arch-node">
                <div className="arch-node-label">Step 1</div>
                <div className="arch-node-value">Review Application</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 2</div>
                <div className="arch-node-value">Issue BS</div>
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
            </div>

            <h3>Mapping to on-chain operations</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">German System Screen</div>
                <div className="live-case-cell live-case-cell-header">Adduce Operation</div>
                <div className="live-case-cell live-case-cell-header">On-Chain Instruction</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Antragsliste (Application List)</span></div>
                <div className="live-case-cell">Dashboard: view pending applications</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>Read CaseFile PDAs</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">BS ausstellen (Issue Certificate)</span></div>
                <div className="live-case-cell">Issue SAS credential to lawyer</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>scripts/issue-credential.ts</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Verfahren er&ouml;ffnen (Open Proceeding)</span></div>
                <div className="live-case-cell">Create case on-chain</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>open_case(case_id, lawyer, applicant)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Sachbearbeitung (Case Processing)</span></div>
                <div className="live-case-cell">Monitor case progress</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>Read CaseFile.status</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Auszahlung genehmigen (Approve Payment)</span></div>
                <div className="live-case-cell">Transfer USDC + mark paid</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>mark_paid(case_id)</div>
              </div>
            </div>

            <h3>Work Procedure: 3-step BS issuance</h3>
            <p>
              In the German system, issuing a Berechtigungsschein follows a
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

            <div className="arch-flow">
              <div className="arch-node">
                <div className="arch-node-label">Step 1</div>
                <div className="arch-node-value">Connect Wallet</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-label">Step 2</div>
                <div className="arch-node-value">Verify BS</div>
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
            </div>

            <h3>Mapping to on-chain operations</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Lawyer Action</div>
                <div className="live-case-cell live-case-cell-header">Adduce Operation</div>
                <div className="live-case-cell live-case-cell-header">On-Chain Instruction</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Request BS for client</span></div>
                <div className="live-case-cell">Off-chain: client applies at court</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>-</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Verify BS validity</span></div>
                <div className="live-case-cell">Read SAS attestation PDA</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>fetchMaybeAttestation()</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Submit case documents</span></div>
                <div className="live-case-cell">Anchor SHA-256 hash on-chain</div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>anchor_document(case_id, hash)</div>
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
                Berechtigungsschein. With Adduce, verification is a single
                on-chain PDA read: no phone calls, no hold queues, no
                business-hour dependency.
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
              <li>If approved, court issues a Berechtigungsschein: in Adduce, this becomes an SAS credential on-chain, tied to the lawyer&rsquo;s wallet</li>
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
            <h2>How a Berechtigungsschein becomes an on-chain lifecycle.</h2>
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
                  <span className="flow-step-title">Files application at Amtsgericht</span>
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
                  <span className="flow-step-title">Issues Berechtigungsschein (SAS Credential)</span>
                </div>
                <div className="flow-step-desc">
                  The court creates an on-chain attestation encoding
                  jurisdiction (&ldquo;DE&rdquo;), eligibility tier
                  (&ldquo;TIER_1&rdquo;), and expiry date. This is the digital
                  Berechtigungsschein.
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
                  Lawyer submits Abrechnungsvordruck, Berechtigungsschein PDF,
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
                  A paper Berechtigungsschein can be photocopied and reused. No
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
                  Court clerks manually match incoming Abrechnungsvordrucke to
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
            <p>
              The shortest path from zero to a working legal-aid case on Solana
              Devnet. Every snippet below uses real functions from the
              <code>/scripts</code> directory.
            </p>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Step 1: Setup</span>
              </div>
              <div className="code-body">
                <pre>{`git clone https://github.com/SAHU-01/legal_aid.git && cd legal_aid
nvm use 22 && npm install
cp .env.example .env  # add your Helius API key
anchor build && anchor deploy --provider.cluster devnet`}</pre>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Step 2: Deploy SAS credential schema</span>
              </div>
              <div className="code-body">
                <pre>{`# Creates the legal-aid-eligibility schema on devnet
# Fields: jurisdiction (12B), eligibility_tier (12B), expiry_date (8B)
npx ts-node scripts/create-schema.ts
# Output: scripts/schema-address.json`}</pre>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Step 3: Issue a credential</span>
              </div>
              <div className="code-body">
                <pre>{`# Issues a Berechtigungsschein (SAS attestation) to a lawyer wallet
# Uses: fetchSchema() -> serializeAttestationData() -> getCreateAttestationInstruction()
npx ts-node scripts/issue-credential.ts
# Output: scripts/credential-info.json`}</pre>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Step 4: Run the full case lifecycle</span>
              </div>
              <div className="code-body">
                <pre>{`# Executes: open_case -> link_credential -> anchor_document -> close_case -> USDC transfer -> mark_paid
# Every step is a real devnet transaction
npx ts-node scripts/sample-german-bs-case.ts
# Output: scripts/output/german-bs-case-report.json`}</pre>
              </div>
            </div>

            <div className="code-block">
              <div className="code-header">
                <span className="code-dot code-dot-red" />
                <span className="code-dot code-dot-yellow" />
                <span className="code-dot code-dot-green" />
                <span className="code-title">Step 5: Verify everything</span>
              </div>
              <div className="code-body">
                <pre>{`# Verifies: SAS credential valid, case status Paid, document hash matches,
# USDC received, compressed audit log found
npx ts-node scripts/verify-credential.ts
# Open the report: cat scripts/output/german-bs-case-report.json`}</pre>
              </div>
            </div>
          </section>

          {/* ── PORTAL INTEGRATION ── */}
          <section id="portal-integration" className="docs-section">
            <div className="docs-section-label">Integration Guide</div>
            <h2>Integrating into an existing portal</h2>
            <p>
              A walkthrough showing what changes when a government portal (like
              Bayern Justizportal) integrates Adduce. For each role-action,
              we show what the portal does today, what changes, and what stays
              the same.
            </p>

            <h3>Operator: Issue Berechtigungsschein</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Today</div>
                <div className="live-case-cell live-case-cell-header">With Adduce</div>
                <div className="live-case-cell live-case-cell-header">Stays the same</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell">Operator clicks &ldquo;Issue BS&rdquo;, portal generates PDF, stores in internal DB</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Portal also calls <code>issueCredential()</code> which writes a SAS attestation on Solana</div>
                <div className="live-case-cell">PDF generation, internal DB record, operator UI: all unchanged</div>
              </div>
            </div>

            <h3>Lawyer: Submit documents</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Today</div>
                <div className="live-case-cell live-case-cell-header">With Adduce</div>
                <div className="live-case-cell live-case-cell-header">Stays the same</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell">Lawyer uploads Abrechnungsvordruck via portal, stored in DMS</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Portal also calls <code>anchorDocument()</code> with SHA-256 hash. Documents stay in DMS: only hash goes on-chain</div>
                <div className="live-case-cell">Upload flow, DMS storage, document format: all unchanged</div>
              </div>
            </div>

            <h3>Operator: Approve payment</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Today</div>
                <div className="live-case-cell live-case-cell-header">With Adduce</div>
                <div className="live-case-cell live-case-cell-header">Stays the same</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell">Operator approves, finance dept queues bank transfer (6&ndash;12 month cycle)</div>
                <div className="live-case-cell" style={{ color: "var(--accent)" }}>Portal calls x402 endpoint: USDC transferred in 400ms, case marked Paid on-chain</div>
                <div className="live-case-cell">Approval decision, audit requirements: unchanged. Only payment rail changes</div>
              </div>
            </div>

            <h3>New capabilities unlocked</h3>
            <ul className="req-list">
              <li><strong>Cross-jurisdiction verification:</strong> A lawyer in Munich can verify a BS issued by a court in Hamburg without calling them</li>
              <li><strong>Instant payment:</strong> Settlement in 400ms instead of 6&ndash;12 months</li>
              <li><strong>Public auditability:</strong> Any auditor can verify case lifecycle on Solana Explorer</li>
              <li><strong>Double-spend prevention:</strong> On-chain state machine prevents re-use of credentials</li>
              <li><strong>Cost reduction:</strong> $0.004 per case anchor vs $0.30+ for standard database entries at scale</li>
            </ul>
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
                style={{ fontFamily: "var(--mono)", fontSize: "0.78rem", color: "var(--accent)" }}
              >
                {PROGRAM_ID}
                <ExternalIcon />
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
                <div className="live-case-cell">ProgramConfig (159 bytes)</div>
                <div className="live-case-cell">authority, reviewer, payer, jurisdiction, expected_schema, total_cases=0</div>
              </div>
            </div>

            <h3>open_case(case_id, lawyer, applicant)</h3>
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
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>case_id: String (max 32), lawyer: Pubkey, applicant: Pubkey</div>
                <div className="live-case-cell">applicant = citizen&apos;s pubkey (credential nonce must match at link time)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">{"\u2192"} Open</div>
                <div className="live-case-cell">CaseFile (255 bytes) with credential_pubkey=default, commitment_root=[0;32]</div>
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

            <h3>anchor_document(case_id, document_hash)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>lawyer (must match case_file.lawyer)</div>
                <div className="live-case-cell">Only the assigned lawyer can anchor documents</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Accounts</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>case_file (mut), credential_account, lawyer (signer)</div>
                <div className="live-case-cell">credential_account re-checked for liveness (revoked = rejected)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Precondition</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>credential_pubkey != default, commitment_root != [0;32]</div>
                <div className="live-case-cell">Credential must be linked first via link_credential</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">Open/InProgress {"\u2192"} InProgress</div>
                <div className="live-case-cell">SHA-256 hash stored on CaseFile PDA</div>
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
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>reviewer or authority</div>
                <div className="live-case-cell">Role-separated: reviewer closes cases</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Accounts</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>config, case_file (mut), credential_account, authority</div>
                <div className="live-case-cell">Credential liveness re-checked (revoked = rejected)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">InProgress {"\u2192"} Closed</div>
                <div className="live-case-cell">Lawyer can now claim payment</div>
              </div>
            </div>

            <h3>mark_paid(case_id)</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Property</div>
                <div className="live-case-cell live-case-cell-header">Value</div>
                <div className="live-case-cell live-case-cell-header">Notes</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Signer</span></div>
                <div className="live-case-cell" style={{ fontFamily: "var(--mono)", fontSize: "0.72rem" }}>payer or authority</div>
                <div className="live-case-cell">Role-separated: payer approves payment after USDC transfer</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Precondition</span></div>
                <div className="live-case-cell">Status must be Closed</div>
                <div className="live-case-cell">Error 6003 if wrong status</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">Status</span></div>
                <div className="live-case-cell">Closed {"\u2192"} Paid (terminal)</div>
                <div className="live-case-cell">Immutable final state</div>
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
              credentials. In the German system, this is the digital
              Berechtigungsschein. In France, it maps to the Aide
              Juridictionnelle certificate. The schema is configurable per
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
              The Anchor program manages case lifecycle on-chain. Five
              instructions handle the full flow from initialization to payment
              confirmation. Each state transition is authority-gated and produces
              a verifiable transaction.
            </p>

            <h3>Instructions</h3>
            <div className="live-case-table">
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Instruction</div>
                <div className="live-case-cell live-case-cell-header">Signer</div>
                <div className="live-case-cell live-case-cell-header">Effect</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">initialize</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Creates ProgramConfig for a jurisdiction (&quot;DE&quot;, &quot;FR&quot;, etc.)</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">open_case</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Creates CaseFile PDA, assigns lawyer, status = Open</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">anchor_document</span></div>
                <div className="live-case-cell">Lawyer</div>
                <div className="live-case-cell">Stores SHA-256 document hash, status = InProgress</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">close_case</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Marks case work complete, status = Closed</div>
              </div>
              <div className="live-case-row">
                <div className="live-case-cell"><span className="cell-label">mark_paid</span></div>
                <div className="live-case-cell">Authority</div>
                <div className="live-case-cell">Confirms payment disbursed, status = Paid (terminal)</div>
              </div>
            </div>

            <h3>State machine</h3>
            <div className="arch-flow">
              <div className="arch-node">
                <div className="arch-node-value">Open</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-value">InProgress</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-value">Closed</div>
              </div>
              <div className="arch-arrow">&rarr;</div>
              <div className="arch-node">
                <div className="arch-node-value">Paid</div>
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

          {/* ── MODULE 3: DOCUMENT INTEGRITY ── */}
          <section id="module-3" className="docs-section">
            <div className="docs-section-label">Module 3</div>
            <h2>Document Integrity</h2>
            <p>
              When a lawyer submits case documents (Abrechnungsvordruck,
              Berechtigungsschein PDF, settlement documents), the system
              computes a SHA-256 hash and anchors it on-chain. The original
              documents stay in the existing ministry system: only the
              fingerprint goes to Solana.
            </p>

            <h3>GDPR compliance</h3>
            <ul className="req-list">
              <li>No personally identifiable information (PII) is stored on-chain</li>
              <li>Document hashes are one-way: you cannot reconstruct the original from the hash</li>
              <li>Client names, addresses, case details remain in the national system</li>
              <li>Only public keys (wallet addresses) and cryptographic hashes touch the blockchain</li>
            </ul>

            <h3>How it works</h3>
            <ul className="req-list">
              <li>Lawyer uploads documents via the dashboard or ministry portal</li>
              <li>System computes SHA-256 hash of the document bundle</li>
              <li>Hash is stored in the CaseFile PDA via <code>anchor_document</code> instruction</li>
              <li>Lawyer signs the transaction with their wallet (proves authorship)</li>
              <li>Any auditor can verify: hash the document locally, compare with on-chain hash</li>
            </ul>
          </section>

          {/* ── MODULE 4: ZK COMPRESSION ── */}
          <section id="module-4" className="docs-section">
            <div className="docs-section-label">Module 4</div>
            <h2>ZK Compression</h2>
            <p>
              Light Protocol compresses on-chain state using zero-knowledge
              proofs, reducing storage costs by 98.7%. This is critical at
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

            <h3>Requirements</h3>
            <ul className="req-list">
              <li>Helius RPC endpoint (standard Solana RPC does not support compressed accounts)</li>
              <li>Set <code>HELIUS_RPC_URL</code> in your <code>.env</code> file</li>
              <li>Photon indexer is built into Helius: no separate service needed</li>
              <li>The compression script: <code>scripts/anchor-document-compressed.ts</code></li>
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
