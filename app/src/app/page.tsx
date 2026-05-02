import Link from "next/link";
import "./landing.css";
import TerminalTabs from "./TerminalTabs";
import ArchDiagram from "./ArchDiagram";
import HeartbeatTimeline from "./HeartbeatTimeline";
import Navbar from "./Navbar";

const GITHUB_URL = "https://github.com/SAHU-01/legal_aid";
const EXPLORER_URL =
  "https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet";

function GitHubIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ verticalAlign: "-3px", marginRight: 4 }}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.332 1.21-6.03 5.874 1.424 8.305L12 19.187l-7.394 3.889 1.424-8.305L0 8.228l8.332-1.21z" />
    </svg>
  );
}

function NavLogo() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

/*
const TESTIMONIALS = [
  {
    initials: "RK",
    name: "Rechtsanwalt K.",
    role: "Legal Aid Lawyer, Berlin",
    text: "Payment in 400 milliseconds instead of 6 months. This is what legal aid infrastructure should have been from the start.",
  },
  {
    initials: "SM",
    name: "Sarah M.",
    role: "NGO Director, Access to Justice EU",
    text: "The credential verification is the killer feature. Courts issue, lawyers verify, citizens never expose their data. Exactly how it should work.",
  },
  {
    initials: "JP",
    name: "Jean-Pierre D.",
    role: "Public Defender, Paris",
    text: "I stopped taking legal aid cases because payment took a year. With this, I would start again. Instant settlement changes the economics entirely.",
  },
  {
    initials: "AN",
    name: "Anika N.",
    role: "Legal Tech Researcher, UNDP",
    text: "The cost comparison alone sells it. $0.004 per document anchor vs $0.30. At government scale, we\u2019re talking millions saved on infrastructure.",
  },
  {
    initials: "DT",
    name: "Dr. Thomas W.",
    role: "Ministry of Justice, Advisor",
    text: "It\u2019s a plug-in, not a replacement. Our SAP stays. Our processes stay. The blockchain just handles trust and payment. That\u2019s the right approach.",
  },
  {
    initials: "MR",
    name: "Maria R.",
    role: "Pro Bono Coordinator, S\u00e3o Paulo",
    text: "In Brazil, legal aid lawyers wait months. Some never get paid. Blockchain-verified instant payment would transform pro bono work here.",
  },
  {
    initials: "KO",
    name: "Kofi O.",
    role: "Legal Aid Board, Accra",
    text: "Every transaction on the block explorer. Every credential verifiable. This is the transparency and accountability we need in legal aid systems.",
  },
  {
    initials: "LH",
    name: "Lisa H.",
    role: "Barrister, London",
    text: "ZK compression means the state doesn\u2019t have to choose between cost and immutability. They get both. That removes every procurement objection.",
  },
];
*/

const CERTIFICATE_SYSTEMS = [
  { flag: "\ud83c\udde9\ud83c\uddea", country: "Germany", cert: "Berechtigungsschein" },
  { flag: "\ud83c\uddf3\ud83c\uddf1", country: "Netherlands", cert: "Toevoeging" },
  { flag: "\ud83c\uddeb\ud83c\uddf7", country: "France", cert: "Aide Juridictionnelle" },
  { flag: "\ud83c\uddee\ud83c\uddf9", country: "Italy", cert: "Patrocinio a spese dello Stato" },
  { flag: "\ud83c\uddea\ud83c\uddf8", country: "Spain", cert: "Asistencia Jur\u00eddica Gratuita" },
  { flag: "\ud83c\udde6\ud83c\uddf9", country: "Austria", cert: "Verfahrenshilfe" },
  { flag: "\ud83c\uddf5\ud83c\uddf9", country: "Portugal", cert: "Apoio Judici\u00e1rio" },
  { flag: "\ud83c\udde8\ud83c\udde6", country: "Canada", cert: "Legal Aid Certificate" },
  { flag: "\ud83c\uddee\ud83c\uddea", country: "Ireland", cert: "Legal Aid Certificate" },
];

const PRO_BONO_SURVEY_URL =
  "https://www.lw.com/admin/Upload/Documents/Global%20Pro%20Bono%20Survey/A-Survey-of-Pro-Bono-Practices-and-Opportunities.pdf";

export default function LandingPage() {
  return (
    <div className="landing">
      <Navbar activePage="home" />

      {/* HERO */}
      <section className="hero">
        <div className="hero-image-container">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/hero-img.png" alt="Adduce" />
          <div className="hero-image-overlay" />
        </div>
        <div className="hero-content">
          <h1>
            Adduce
            <br />
            Justice, <em>verified</em>
            <br />
            on-chain.
          </h1>
          <p className="hero-sub">
            One artifact &mdash; the legal aid entitlement certificate &mdash;
            issued, verified, and settled on a public rail. Your court system
            stays untouched. The certificate goes on-chain.
          </p>
          <div className="hero-buttons">
            <Link href="/dashboard" className="btn-primary">
              Launch App
            </Link>
            <a
              href={GITHUB_URL}
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon />
              GitHub
            </a>
          </div>
        </div>
      </section>

      {/* QUICKSTART */}
      <section className="quickstart">
        <div>
          <h2>Quickstart</h2>
          <p>
            Clone, configure, deploy. A specialized QEAA issuer/verifier for
            legal aid entitlements, anchored on Solana for cross-jurisdictional
            auditability and revocation. All you need is a Solana wallet.
          </p>
          <div className="quickstart-links">
            <a
              href={GITHUB_URL}
              className="btn-primary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
            >
              <GitHubIcon />
              Star on GitHub
            </a>
            <a
              href={`${GITHUB_URL}#quick-start`}
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: "0.85rem", padding: "0.6rem 1.5rem" }}
            >
              Read the docs &rarr;
            </a>
          </div>
        </div>
        <div>
          <TerminalTabs />
        </div>
      </section>

      {/* THE PROBLEM */}
      <section className="social-proof">
        <div className="social-proof-label">The problem</div>
        <h2>Justice delayed is justice denied.</h2>
        <div className="problem-grid">
          <div className="problem-card">
            <div className="problem-number">6&ndash;12 months</div>
            <div className="problem-label">
              Average legal aid payment delay in the EU
            </div>
            <p className="problem-detail">
              Lawyers routinely wait half a year or more for reimbursement,
              creating cash-flow crises that force them to stop taking cases.
            </p>
            <div className="problem-source">
              <a href="https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/upholding-rule-law/eu-justice-scoreboard_en" target="_blank" rel="noopener noreferrer">
                Source: EU Justice Scoreboard &amp; national bar surveys
              </a>
            </div>
          </div>
          <div className="problem-card">
            <div className="problem-number">40%</div>
            <div className="problem-label">
              Lawyers who stop taking legal aid cases due to payment delays
            </div>
            <p className="problem-detail">
              Nearly half of eligible lawyers opt out of legal aid work entirely,
              shrinking the pool of representation for the most vulnerable
              citizens.
            </p>
            <div className="problem-source">
              <a href="https://www.ccbe.eu/documents/publications/" target="_blank" rel="noopener noreferrer">
                Source: Council of Bars &amp; Law Societies of Europe (CCBE)
              </a>
            </div>
          </div>
          <div className="problem-card">
            <div className="problem-number">2 billion+</div>
            <div className="problem-label">
              People worldwide who lack access to legal aid
            </div>
            <p className="problem-detail">
              Over two billion people live outside the protection of the law.
              Modernizing payment infrastructure is the first step to closing the
              justice gap.
            </p>
            <div className="problem-source">
              <a href="https://www.undp.org/publications/global-study-legal-aid" target="_blank" rel="noopener noreferrer">
                Source: UNDP Global Study on Legal Aid (2024)
              </a>
            </div>
          </div>
          <div className="problem-card">
            <div className="problem-number">$0.30 &rarr; $0.004</div>
            <div className="problem-label">
              Cost per document anchor with ZK compression
            </div>
            <p className="problem-detail">
              Standard on-chain storage costs 75x more. Light Protocol&rsquo;s
              ZK compression makes government-scale document integrity feasible
              for the first time.
            </p>
            <div className="problem-source">
              <a href="https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet" target="_blank" rel="noopener noreferrer">
                Measured on Solana Devnet, May 2025
              </a>
            </div>
          </div>
        </div>
      </section>

      {/*
      -- TESTIMONIALS (commented out until real feedback is collected) --
      <section className="social-proof">
        <div className="social-proof-label">What people are saying</div>
        <h2>Loved by lawyers.</h2>
        <div className="testimonial-grid">
          ...testimonial cards...
        </div>
      </section>
      */}

      {/* DASHBOARD PREVIEW */}
      <section className="dashboard-section">
        <h2>Manage cases, not paperwork.</h2>
        <p className="subtitle">
          One dashboard. Credential verification, case tracking, instant payment
          claims.
        </p>

        <div className="dashboard-mockup">
          <div className="dashboard-topbar">
            <div className="dashboard-sidebar-items">
              <span className="dashboard-sidebar-item active">
                <span className="dot dot-green" /> Cases
              </span>
              <span className="dashboard-sidebar-item">
                <span className="dot dot-yellow" /> Credentials
              </span>
              <span className="dashboard-sidebar-item">
                <span className="dot dot-red" /> Payments
              </span>
            </div>
            <div className="dashboard-live-badge">Devnet</div>
          </div>
          <div className="dashboard-body">
            <div className="dashboard-nav">
              <div className="dash-nav-section">
                <div className="dash-nav-label">Navigation</div>
                <div className="dash-nav-item active">{"\u229e"} Dashboard</div>
                <div className="dash-nav-item">{"\u25ce"} My Cases</div>
                <div className="dash-nav-item">{"\u2b21"} Credentials</div>
              </div>
              <div className="dash-nav-section">
                <div className="dash-nav-label">Actions</div>
                <div className="dash-nav-item">{"\u2197"} Claim Payment</div>
                <div className="dash-nav-item">{"\u25c9"} Verify</div>
              </div>
              <div className="dash-nav-section">
                <div className="dash-nav-label">Wallet</div>
                <div
                  className="dash-nav-item"
                  style={{ fontFamily: "var(--mono)", fontSize: "0.7rem" }}
                >
                  C35K...7wkU
                </div>
              </div>
            </div>
            <div className="dashboard-content">
              <div className="dash-content-header">
                <div className="dash-content-title">Active Cases</div>
                <div className="dash-filters">
                  <button className="dash-filter">{"\u2195"} Sort</button>
                  <button className="dash-filter">{"\u2298"} Filter</button>
                </div>
              </div>
              <div className="dash-table">
                <div className="dash-table-header">
                  <span>Case ID</span>
                  <span>Status</span>
                  <span>Jurisdiction</span>
                  <span>Document Hash</span>
                  <span>Date</span>
                </div>
                <div className="dash-table-row">
                  <span>E2E-DEMO-1748</span>
                  <span>
                    <span className="status-badge status-paid">Paid</span>
                  </span>
                  <span>DE</span>
                  <span className="hash-text">a3b2c1d4...</span>
                  <span>2025-05-01</span>
                </div>
                <div className="dash-table-row">
                  <span>CASE-DE-2847</span>
                  <span>
                    <span className="status-badge status-closed">Closed</span>
                  </span>
                  <span>DE</span>
                  <span className="hash-text">f7e8d9c0...</span>
                  <span>2025-04-28</span>
                </div>
                <div className="dash-table-row">
                  <span>CASE-FR-9103</span>
                  <span>
                    <span className="status-badge status-progress">
                      In Progress
                    </span>
                  </span>
                  <span>FR</span>
                  <span className="hash-text">b1c2d3e4...</span>
                  <span>2025-04-25</span>
                </div>
                <div className="dash-table-row">
                  <span>CASE-BR-4521</span>
                  <span>
                    <span className="status-badge status-open">Open</span>
                  </span>
                  <span>BR</span>
                  <span className="hash-text">&mdash;</span>
                  <span>2025-04-22</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="how-section">
        <h2>
          Disburse legal aid,
          <br />
          not manual invoices.
        </h2>
        <div className="how-steps">
          <div className="how-step">
            <div className="how-step-num">01</div>
            <h3>Issue the credential.</h3>
            <p>
              Define the jurisdiction and eligibility. The court issues a
              digital, tamper-proof legal aid certificate directly to the
              citizen.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-num">02</div>
            <h3>Anchor the proof.</h3>
            <p>
              The lawyer accepts the case. Zero-knowledge architecture verifies
              the court filings on-chain instantly, without ever exposing
              private case data.
            </p>
          </div>
          <div className="how-step">
            <div className="how-step-num">03</div>
            <h3>Settle instantly.</h3>
            <p>
              Case closed. The x402 gateway verifies the proof and transfers
              USDC to the lawyer. No waiting. Monitor budgets directly from
              the dashboard.
            </p>
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features-section" id="features">
        <div className="features-label">Features</div>
        <h2>
          One artifact on a public rail.
          <br />
          Everything else stays.
        </h2>
        <p className="subtitle" />
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">{"\u2b21"}</div>
            <h3>Verifiable Credentials</h3>
            <p>
              The entitlement certificate becomes a QEAA &mdash; issued by one
              authority, consumed by another, verifiable across institutional
              boundaries without phone calls.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">{"\u25ce"}</div>
            <h3>Instant Settlement</h3>
            <p>
              USDC disbursement in 400ms via x402. Payment only flows when
              the credential is valid, unused, and unrevoked. Double-spend
              prevention built into the protocol.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">{"\u2b21"}</div>
            <h3>ZK Compression</h3>
            <p>
              Light Protocol compressed state. 98.8% cheaper than standard
              storage. Layer 1 security through zero-knowledge proofs.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">{"\u2298"}</div>
            <h3>Legacy Compatible</h3>
            <p>
              Case content stays in your existing national system. Adduce
              slots in underneath one specific workflow &mdash; the
              entitlement certificate &mdash; not a full-stack replacement.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">{"\u25c8"}</div>
            <h3>Tamper-Proof Audit</h3>
            <p>
              The chain is the neutral, auditable, multi-party-readable
              substrate. Any participating lawyer in any jurisdiction can
              verify an entitlement without calling the issuing authority.
            </p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">{"\u229e"}</div>
            <h3>EUDI-Ready</h3>
            <p>
              Positioned as a specialized QEAA issuer compatible with W3C VC
              and ARF specs. Not an alternative to EUDI &mdash; a reference
              implementation for legal aid.
            </p>
          </div>
        </div>
      </section>

      {/* JURISDICTION */}
      <section className="jurisdiction-section">
        <div className="jurisdiction-layout">
          {/* Left: copy */}
          <div className="jurisdiction-copy">
            <div className="jurisdiction-label">Bring Your Own Jurisdiction</div>
            <h2>Bring your own jurisdiction.</h2>
            <p>
              Legal frameworks change across borders; your infrastructure
              shouldn&rsquo;t have to. Adduce uses a modular, multi-tenant
              architecture on Solana. Connect to our audited core engine, deploy
              your local compliance parameters, and launch.
            </p>
            <div className="jurisdiction-frameworks">
              <div className="jurisdiction-frameworks-label">
                Works with any legal framework
              </div>
              <div className="jurisdiction-icons">
                <div className="jurisdiction-icon-item">
                  <div className="jurisdiction-icon">{"\ud83c\udde9\ud83c\uddea"}</div>
                  <span>Germany</span>
                </div>
                <div className="jurisdiction-icon-item">
                  <div className="jurisdiction-icon">{"\ud83c\uddeb\ud83c\uddf7"}</div>
                  <span>France</span>
                </div>
                <div className="jurisdiction-icon-item">
                  <div className="jurisdiction-icon">{"\ud83c\uddee\ud83c\uddf3"}</div>
                  <span>India</span>
                </div>
                <div className="jurisdiction-icon-item jurisdiction-more">
                  <span>and 6 more&hellip;</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: animated architecture diagram */}
          <ArchDiagram />
        </div>
      </section>

      {/* CASE TRACKING */}
      <section className="tracking-section">
        <div className="tracking-layout">
          {/* Left: copy */}
          <div className="tracking-copy">
            <div className="tracking-label">Case Tracking</div>
            <h2>
              Every case tracked.
              <br />
              Every payment traced.
            </h2>
            <p>
              From credential issuance to final payment &mdash; every step is an
              immutable on-chain transaction. Courts, lawyers, and auditors can
              verify any case at any time. Nothing happens off the record.
            </p>

            <div className="tracking-features">
              <div className="tracking-feature">
                <div className="tracking-feature-icon">{"\u25a3"}</div>
                <div>
                  <h3>Structured lifecycle</h3>
                  <p>
                    Every case has a clear status: Open, In Progress, Closed,
                    Paid. No ambiguity.
                  </p>
                </div>
              </div>
              <div className="tracking-feature">
                <div className="tracking-feature-icon">{"\u25ce"}</div>
                <div>
                  <h3>Full trace</h3>
                  <p>
                    Every document hash, credential check, and payment is a
                    Solana transaction with a block explorer link.
                  </p>
                </div>
              </div>
              <div className="tracking-feature">
                <div className="tracking-feature-icon">{"\u25cb"}</div>
                <div>
                  <h3>Immutable audit log</h3>
                  <p>
                    Append-only. No edits, no deletions. Full accountability for
                    government auditors.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: ticket mockup */}
          <div className="tracking-ticket">
            <div className="ticket-header">
              <span className="ticket-id">#CASE-DE-2847</span>
              <span className="ticket-title">
                Legal Aid Case &mdash; Jurisdiction DE
              </span>
            </div>
            <div className="ticket-meta">
              <span className="ticket-status">Closed</span>
              <span className="ticket-assignee">
                {"\u2696"} Lawyer: C35K&hellip;7wkU
              </span>
            </div>

            <div className="ticket-timeline">
              <div className="ticket-event">
                <div className="ticket-event-dot ticket-dot-blue" />
                <div className="ticket-event-body">
                  <div className="ticket-event-header">
                    <strong>Court Authority</strong>
                    <span>2 min ago</span>
                  </div>
                  <p>Case closed. Ruling in favor of applicant.</p>
                </div>
              </div>
              <div className="ticket-event">
                <div className="ticket-event-dot ticket-dot-green" />
                <div className="ticket-event-body">
                  <div className="ticket-event-header">
                    <strong>Automation Agent</strong>
                    <span>1 min ago</span>
                  </div>
                  <p>
                    Document anchored. Compressed log created. Initiating
                    payment disbursement.
                  </p>
                </div>
              </div>
              <div className="ticket-event">
                <div className="ticket-event-dot ticket-dot-blue" />
                <div className="ticket-event-body">
                  <div className="ticket-event-header">
                    <strong>Lawyer</strong>
                    <span>just now</span>
                  </div>
                  <p>Payment claimed. 50 USDC received.</p>
                </div>
              </div>
            </div>

            <div className="ticket-trace">
              <div className="ticket-trace-label">Trace</div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>issue_credential()</code>
                <span className="ticket-trace-status trace-ok">verified</span>
              </div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>open_case()</code>
                <span className="ticket-trace-status trace-ok">done</span>
              </div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>anchor_document()</code>
                <span className="ticket-trace-status trace-ok">done</span>
              </div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>close_case()</code>
                <span className="ticket-trace-status trace-ok">done</span>
              </div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>claim_payment()</code>
                <span className="ticket-trace-status trace-settled">
                  settled
                </span>
              </div>
              <div className="ticket-trace-row">
                <span className="ticket-trace-dot ticket-dot-green" />
                <code>mark_paid()</code>
                <span className="ticket-trace-status trace-ok">confirmed</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HEARTBEATS */}
      <section className="heartbeat-section">
        <div className="heartbeat-layout">
          <div className="heartbeat-copy">
            <div className="heartbeat-label-row">
              <div className="heartbeat-label">
                {"\u2699\ufe0f"} Autonomous Heartbeats
              </div>
              <div className="heartbeat-coming-soon">Coming Soon</div>
            </div>
            <h2>
              Automate the
              <br />
              bureaucracy.
            </h2>
            <ul className="heartbeat-bullets">
              <li>
                <span className="hb-bullet-icon">{"\u2734"}</span>
                <span>
                  <strong>Extraction agents</strong> wake up on a defined
                  schedule to securely query your legacy SQL court databases for
                  newly closed cases.
                </span>
              </li>
              <li>
                <span className="hb-bullet-icon">{"\u2734"}</span>
                <span>
                  <strong>Unstructured docket data</strong> is automatically
                  parsed for required metadata &mdash; jurisdiction, lawyer ID,
                  case outcome &mdash; with zero human data entry.
                </span>
              </li>
              <li>
                <span className="hb-bullet-icon">{"\u2734"}</span>
                <span>
                  <strong>Compliance agents</strong> verify the extracted data
                  against your specific jurisdictional eligibility tiers and
                  limits.
                </span>
              </li>
              <li>
                <span className="hb-bullet-icon">{"\u2734"}</span>
                <span>
                  <strong>Settlement nodes</strong> format the verified data into
                  a JSON payload, triggering Solana ZK-compression anchoring and
                  x402 payment.
                </span>
              </li>
            </ul>
          </div>
          <div className="heartbeat-visual">
            <HeartbeatTimeline />
          </div>
        </div>
      </section>

      {/* COST */}
      <section className="cost-section" id="cost">
        <div className="cost-top">
          <div className="cost-label">OpEx vs. CapEx</div>
          <h2>
            Stop paying for idle servers.
            <br />
            Pay per cryptographic proof.
          </h2>
          <p className="cost-subtext">
            Enterprise consortium chains require massive upfront consulting fees
            and permanent server costs just to keep the network alive. Adduce
            operates on pure OpEx. You pay fractions of a cent only when a
            credential is issued or a ZK proof is anchored. No runaway IT
            contracts. No black box consulting fees.
          </p>
        </div>

        <div className="cost-breakdown-layout">
          {/* Left: table widget */}
          <div className="cost-widget">
            <div className="cost-table-header">
              <span>Infrastructure</span>
              <span>Budget Used</span>
              <span>Spend / Budget</span>
            </div>

            <div className="cost-table-row">
              <div className="cost-row-info">
                <div className="cost-row-title">ZK Document Anchoring</div>
                <div className="cost-row-sub">Light Protocol (State Compression)</div>
              </div>
              <div className="cost-bar-wrap">
                <div className="cost-bar" style={{ width: "28.4%" }} />
              </div>
              <div className="cost-row-price">
                <strong>$1.42</strong> / $5.00
              </div>
            </div>

            <div className="cost-table-row">
              <div className="cost-row-info">
                <div className="cost-row-title">Credential Issuance</div>
                <div className="cost-row-sub">Solana Attestation Service (SAS)</div>
              </div>
              <div className="cost-bar-wrap">
                <div className="cost-bar" style={{ width: "40%" }} />
              </div>
              <div className="cost-row-price">
                <strong>$0.80</strong> / $2.00
              </div>
            </div>

            <div className="cost-table-row">
              <div className="cost-row-info">
                <div className="cost-row-title">USDC Settlement Compute</div>
                <div className="cost-row-sub">x402 Gateway</div>
              </div>
              <div className="cost-bar-wrap">
                <div className="cost-bar" style={{ width: "15%" }} />
              </div>
              <div className="cost-row-price">
                <strong>$0.15</strong> / $1.00
              </div>
            </div>

            <div className="cost-table-row">
              <div className="cost-row-info">
                <div className="cost-row-title">RPC API Routing</div>
                <div className="cost-row-sub">Helius</div>
              </div>
              <div className="cost-bar-wrap">
                <div className="cost-bar" style={{ width: "49%" }} />
              </div>
              <div className="cost-row-price">
                <strong>$49.00</strong> / $100.00
              </div>
            </div>

            <div className="cost-table-total">
              <span>Total</span>
              <span>
                <strong>$51.37</strong> / $108.00
              </span>
            </div>
          </div>

          {/* Right: context copy */}
          <div className="cost-context">
            <p>
              Track your exact infrastructure burn down to the individual case.
              Because Adduce utilizes Solana state compression and public RPC
              routing, your operational costs drop from hundreds of thousands in
              legacy server maintenance to literal dollars a month. Predictable,
              transparent, and bound by hard protocol limits.
            </p>
          </div>
        </div>
      </section>

      {/* COUNTRIES */}
      <section className="countries-section" id="countries">
        <h2>Certificate-based legal aid systems.</h2>
        <p className="subtitle">
          These jurisdictions issue voucher-style legal aid certificates &mdash;
          statutory entitlements that cross institutional boundaries every time
          a private lawyer uses one. That&rsquo;s the exact verification
          problem Adduce solves.
        </p>
        <div className="cert-grid">
          {CERTIFICATE_SYSTEMS.map((s) => (
            <div key={s.country} className="cert-card">
              <div className="cert-flag">{s.flag}</div>
              <div className="cert-country">{s.country}</div>
              <div className="cert-name">{s.cert}</div>
            </div>
          ))}
        </div>
        <div className="countries-stat">
          <div className="countries-stat-row">
            <div className="stat-item">
              <div className="stat-number">9</div>
              <div className="stat-label">Certificate-based systems</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">3</div>
              <div className="stat-label">Continents</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500M+</div>
              <div className="stat-label">Citizens covered</div>
            </div>
          </div>
          <p className="cert-source">
            Reference:{" "}
            <a
              href={PRO_BONO_SURVEY_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Latham &amp; Watkins &mdash; A Survey of Pro Bono Practices and
              Opportunities (PDF)
            </a>
          </p>
        </div>
      </section>

      {/* WHY SPECIAL */}
      <section className="special-section">
        <div className="special-top">
          <div className="special-label">Under the Hood</div>
          <h2>Why Adduce is special.</h2>
          <p className="subtitle">
            Adduce handles the hard orchestration details correctly.
          </p>
        </div>
        <div className="special-grid">
          <div className="special-card">
            <h3>Single-artifact anchoring.</h3>
            <p>
              Not asking governments to put their court system on a public
              chain. Just one artifact: the legal aid entitlement certificate
              &mdash; the voucher that authorizes and pays a private lawyer.
            </p>
          </div>
          <div className="special-card">
            <h3>Cross-institutional verification.</h3>
            <p>
              The certificate is issued by one authority, consumed by another.
              Currently verified by phone or trust. Adduce makes it
              cryptographically verifiable across institutional boundaries.
            </p>
          </div>
          <div className="special-card">
            <h3>Double-spend prevention.</h3>
            <p>
              A lawyer billing the state for a certificate already used or
              revoked is a real fraud surface. The public chain makes
              double-spending structurally impossible.
            </p>
          </div>
          <div className="special-card">
            <h3>No consortium required.</h3>
            <p>
              Fabric can&rsquo;t give cross-border verification without an
              inter-ministerial consortium that doesn&rsquo;t exist and
              won&rsquo;t. A public chain does this natively.
            </p>
          </div>
          <div className="special-card">
            <h3>Non-sensitive by design.</h3>
            <p>
              The certificate data isn&rsquo;t case content. It&rsquo;s
              &ldquo;person X is entitled to Y hours for matter Z, valid until
              date D.&rdquo; Exactly what ZK + SAS handles cleanly.
            </p>
          </div>
          <div className="special-card">
            <h3>EUDI Wallet tailwind.</h3>
            <p>
              The EU mandates verifiable credentials by 2026. A legal aid
              entitlement certificate is exactly a QEAA. Adduce is the
              specialized issuer that plugs into the EUDI ecosystem.
            </p>
          </div>
          <div className="special-card">
            <h3>Vertical specialization.</h3>
            <p>
              Not a generic QTSP competing with Yousign or Gataca. Purpose-built
              for legal aid lifecycle: case workflow, lawyer billing, credential
              gating, and settlement.
            </p>
          </div>
        </div>
      </section>

      {/* WHAT WE ARE NOT */}
      <section className="not-section">
        <div className="not-top">
          <div className="not-label">Differentiation</div>
          <h2>What Adduce is not.</h2>
        </div>
        <div className="not-grid">
          <div className="not-card">
            <h3>Not a private chain.</h3>
            <p>
              No consortium setup, no dedicated nodes, no IBM consulting fees.
              One audited program on Solana, shared by all jurisdictions.
            </p>
          </div>
          <div className="not-card">
            <h3>Not a case management system.</h3>
            <p>
              Case content stays in your existing national system. Adduce
              handles one artifact: the entitlement certificate. That&rsquo;s
              it.
            </p>
          </div>
          <div className="not-card">
            <h3>Not a generic QTSP.</h3>
            <p>
              We don&rsquo;t do KYC, digital signatures, or identity wallets.
              We do legal aid entitlement issuance, verification, and
              settlement.
            </p>
          </div>
          <div className="not-card">
            <h3>Not an alternative to EUDI.</h3>
            <p>
              Adduce is a specialized QEAA issuer that plugs into the EUDI
              ecosystem. Building with the regulation, not against it.
            </p>
          </div>
          <div className="not-card">
            <h3>Not a replacement for your infrastructure.</h3>
            <p>
              Your ministry&rsquo;s database stays untouched. We slot in
              underneath one specific workflow you already hate managing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="cta-section">
        <h2>
          The entitlement certificate
          <br />
          deserves a public rail.
        </h2>
        <p>
          One artifact. Cross-border verification. Instant settlement. No
          consortium. Deploy on Solana Devnet today.
        </p>
        <div className="hero-buttons">
          <Link href="/dashboard" className="btn-primary">
            Launch App
          </Link>
          <a
            href={EXPLORER_URL}
            className="btn-secondary"
            target="_blank"
            rel="noopener noreferrer"
          >
            Verify on Explorer {"\u2197"}
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-rich">
        <div className="footer-bg">
          {/* Footer background image — add footer-bg.png to /app/public */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/footer-bg.png" alt="" />
        </div>
        <div className="footer-columns">
          <div className="footer-col">
            <div className="footer-col-title">Product</div>
            <Link href="/dashboard">Launch App</Link>
            <a href={`${GITHUB_URL}#quick-start`} target="_blank" rel="noopener noreferrer">Quickstart</a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer">GitHub</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Protocol</div>
            <a href="https://www.sas.eco/" target="_blank" rel="noopener noreferrer">SAS</a>
            <a href="https://www.lightprotocol.com/" target="_blank" rel="noopener noreferrer">Light Protocol</a>
            <a href="https://www.x402.org/" target="_blank" rel="noopener noreferrer">x402</a>
            <a href="https://solana.com" target="_blank" rel="noopener noreferrer">Solana</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Developers</div>
            <a href={`${GITHUB_URL}#readme`} target="_blank" rel="noopener noreferrer">Documentation</a>
            <a href={EXPLORER_URL} target="_blank" rel="noopener noreferrer">Explorer</a>
            <a href={`${GITHUB_URL}/blob/main/target/idl/legal_aid.json`} target="_blank" rel="noopener noreferrer">IDL Reference</a>
          </div>
          <div className="footer-col">
            <div className="footer-col-title">Resources</div>
            <a href={PRO_BONO_SURVEY_URL} target="_blank" rel="noopener noreferrer">Pro Bono Survey</a>
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">License</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Adduce. Source-available under proprietary license.</p>
          <div className="footer-bottom-links">
            <a href={`${GITHUB_URL}/blob/main/LICENSE`} target="_blank" rel="noopener noreferrer">License</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
