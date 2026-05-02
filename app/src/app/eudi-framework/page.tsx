import Link from "next/link";
import "./eudi.css";
import Navbar from "../Navbar";

const GITHUB_URL = "https://github.com/SAHU-01/legal_aid";
const EXPLORER_URL =
  "https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet";
const PRO_BONO_SURVEY_URL =
  "https://www.lw.com/admin/Upload/Documents/Global%20Pro%20Bono%20Survey/A-Survey-of-Pro-Bono-Practices-and-Opportunities.pdf";

function GitHubIcon({ size = 14 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

export default function EudiFrameworkPage() {
  return (
    <div className="eudi">
      <Navbar activePage="eudi" />

      {/* HERO */}
      <section className="eudi-hero">
        <div className="eudi-hero-image">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/eudi-hero-img.png" alt="" />
          <div className="eudi-hero-overlay" />
        </div>
        <div className="eudi-hero-content">
          <div className="eudi-hero-badge">
            <span className="badge-dot" />
            Proposal Stage
          </div>
          <h1>
            The EUDI Legal Aid
            <br />
            <em>Framework.</em>
          </h1>
          <p className="eudi-hero-sub">
            A specialized QEAA issuer/verifier for legal aid entitlements,
            anchored on Solana for cross-jurisdictional auditability and
            revocation. EUDI Wallet-compatible via W3C VC and ARF specs.
          </p>
        </div>
      </section>

      {/* QEAA SECTION */}
      <section className="qeaa-section">
        <div className="section-label">Strategic Position</div>
        <h2 className="section-h2">
          One artifact. One public rail.
          <br />
          Zero consortium overhead.
        </h2>
        <p className="section-sub">
          Legal aid entitlement certificates are state-issued attestations of
          attributes &mdash; exactly what the EU defines as a QEAA. Adduce is
          the reference implementation.
        </p>

        <div className="qeaa-layout">
          <div className="qeaa-problem">
            <h3>The problem today</h3>
            <p>
              The entitlement certificate is issued by one authority, consumed by
              another, and needs to be verifiable across institutional
              boundaries. Today it&rsquo;s a PDF, a paper form, or a row in a
              siloed database that the receiving lawyer has to phone-verify or
              trust.
            </p>
            <ul className="qeaa-bullets">
              <li>
                Low-stakes per certificate but high-volume &mdash; the
                fraud and double-spending surface is real.
              </li>
              <li>
                A lawyer can bill the state for a certificate that was already
                used, expired, or revoked.
              </li>
              <li>
                Cross-border verification requires inter-ministerial
                agreements that don&rsquo;t exist.
              </li>
              <li>
                The data on the certificate is not sensitive in the way case
                contents are &mdash; it&rsquo;s entitlement metadata, not
                private legal filings.
              </li>
            </ul>
          </div>
          <div className="qeaa-solution">
            <h3>The Adduce solution</h3>
            <p>
              The chain does one job: being the neutral, auditable,
              multi-party-readable substrate for the entitlement itself. Case
              content stays in the existing national system. You&rsquo;re not
              replacing ministry infrastructure &mdash; you&rsquo;re slotting in
              underneath one specific workflow they already hate managing.
            </p>
            <ul className="qeaa-bullets">
              <li>
                Revocation and double-spend prevention on a public rail &mdash;
                no consortium required.
              </li>
              <li>
                Any participating lawyer in any jurisdiction can verify
                &ldquo;this entitlement is valid, hasn&rsquo;t been used,
                hasn&rsquo;t been revoked&rdquo; without phoning the issuing
                authority.
              </li>
              <li>
                ZK selective disclosure proves entitlement without exposing
                private case data.
              </li>
              <li>
                Settlement in USDC/EURC the moment the case-closure attestation
                is verified.
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* TRUST MODEL */}
      <section className="trust-section">
        <div className="section-label">Trust Model</div>
        <h2 className="section-h2">Why public Solana beats private Fabric.</h2>
        <p className="section-sub">
          Private consortium chains can&rsquo;t give you cross-border
          verification without an inter-ministerial agreement. A public chain
          does this natively.
        </p>

        <div className="trust-table">
          <div className="trust-row trust-row-header">
            <div className="trust-cell trust-cell-header">Feature</div>
            <div className="trust-cell trust-cell-header">Legacy Private Chains (Fabric)</div>
            <div className="trust-cell trust-cell-header">Adduce (Solana + ZK)</div>
          </div>
          <div className="trust-row">
            <div className="trust-cell trust-cell-feature">Trust Source</div>
            <div className="trust-cell">Consortium Agreement (Legal)</div>
            <div className="trust-cell trust-cell-adduce">Cryptographic Proof (Math)</div>
          </div>
          <div className="trust-row">
            <div className="trust-cell trust-cell-feature">Infrastructure</div>
            <div className="trust-cell">Heavy, siloed nodes per country</div>
            <div className="trust-cell trust-cell-adduce">Lightweight, global public rails</div>
          </div>
          <div className="trust-row">
            <div className="trust-cell trust-cell-feature">Interoperability</div>
            <div className="trust-cell">Hard-coded walled gardens</div>
            <div className="trust-cell trust-cell-adduce">Native W3C / eIDAS 2.0 Standards</div>
          </div>
          <div className="trust-row">
            <div className="trust-cell trust-cell-feature">Revocation</div>
            <div className="trust-cell">Requires manual sync between states</div>
            <div className="trust-cell trust-cell-adduce">Instant, global on-chain check</div>
          </div>
          <div className="trust-row">
            <div className="trust-cell trust-cell-feature">Setup Cost</div>
            <div className="trust-cell">$500K+ consulting &amp; dedicated nodes</div>
            <div className="trust-cell trust-cell-adduce">$51/month pure OpEx</div>
          </div>
        </div>
      </section>

      {/* INTEGRATION MAP */}
      <section className="integration-section">
        <div className="section-label">Technical Integration</div>
        <h2 className="section-h2">
          How this MVP maps to EUDI.
        </h2>
        <p className="section-sub">
          Every component in the current MVP has a direct mapping to the
          regulated framework.
        </p>

        <div className="integration-grid">
          <div className="integration-card">
            <h3>Credential Issuance</h3>
            <div className="integration-protocol">Solana Attestation Service (SAS)</div>
            <p>
              Acts as the issuance protocol for the legal aid attribute, mapping
              directly to EU ARF (Architecture Reference Framework) standards
              for Qualified Electronic Attestations.
            </p>
          </div>
          <div className="integration-card">
            <h3>Selective Disclosure</h3>
            <div className="integration-protocol">Light Protocol (ZK Compression)</div>
            <p>
              Provides privacy-preserving verification. Proves a person has aid
              entitlement without putting their private case details on a public
              ledger. 98.8% cheaper than standard storage.
            </p>
          </div>
          <div className="integration-card">
            <h3>Instant Settlement</h3>
            <div className="integration-protocol">x402 Payment Gateway</div>
            <p>
              Solves the #1 pain point for lawyers: getting paid. Instead of
              waiting 6&ndash;12 months, the framework settles in USDC/EURC the
              moment the case-closure attestation is verified.
            </p>
          </div>
        </div>
      </section>

      {/* TAILWINDS */}
      <section className="tailwinds-section">
        <div className="tailwinds-inner">
          <div className="section-label">Market Tailwinds</div>
          <h2 className="section-h2">Why now.</h2>
          <p className="section-sub">
            The regulatory window is open, and your target jurisdictions are
            actively building the infrastructure you plug into.
          </p>

          <div className="tailwinds-grid">
            <div className="tailwind-card">
              <h3>The EUDI Deadline</h3>
              <p>
                Member states must provide at least one EUDI Wallet by{" "}
                <span className="tailwind-highlight">December 31, 2026</span>.
                Regulated businesses and public services must accept them for
                strong authentication by mid-2027.
              </p>
            </div>
            <div className="tailwind-card">
              <h3>QEAA Regulation</h3>
              <p>
                Draft Commission Implementing Regulation (EU) 2025/1569 is
                anticipated for adoption in 2025&ndash;2026, establishing
                specific requirements for{" "}
                <span className="tailwind-highlight">QEAA providers</span>{" "}
                &mdash; the exact slot Adduce fills.
              </p>
            </div>
            <div className="tailwind-card">
              <h3>Digitization Pressure</h3>
              <p>
                eIDAS 2.0, German OZG, Dutch Digitale Overheid, France
                Identit&eacute; &mdash;{" "}
                <span className="tailwind-highlight">
                  &ldquo;verifiable credential on a public rail&rdquo;
                </span>{" "}
                is a vocabulary procurement officers already speak.
              </p>
            </div>
            <div className="tailwind-card">
              <h3>Competitor Landscape</h3>
              <p>
                General QTSPs (Gataca, Dock, Lissi) are positioning for QEAA
                issuance. None offer{" "}
                <span className="tailwind-highlight">
                  vertical legal workflow + public-chain anchoring + instant
                  settlement
                </span>
                .
              </p>
            </div>
            <div className="tailwind-card">
              <h3>Statutory Entitlement</h3>
              <p>
                In all target jurisdictions, legal aid is a{" "}
                <span className="tailwind-highlight">
                  statutory right with a budget line
                </span>
                , not charity. There&rsquo;s a real issuing authority with
                procurement authority.
              </p>
            </div>
            <div className="tailwind-card">
              <h3>Cross-Boundary Need</h3>
              <p>
                Private bar lawyers participate in legal aid &mdash; so the
                certificate{" "}
                <span className="tailwind-highlight">
                  crosses an institutional boundary every time
                </span>{" "}
                it&rsquo;s used. That&rsquo;s the whole reason verifiability
                matters.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* PILOT TARGETS */}
      <section className="pilots-section">
        <div className="section-label">Pilot Targets</div>
        <h2 className="section-h2">Three entry points.</h2>
        <p className="section-sub">
          Prioritized by EUDI readiness, legal aid volume, and procurement
          accessibility.
        </p>

        <div className="pilots-grid">
          <div className="pilot-card">
            <div className="pilot-flag">{"\ud83c\uddeb\ud83c\uddf7"}</div>
            <div className="pilot-country">France</div>
            <div className="pilot-readiness">High EUDI Readiness</div>
            <div className="pilot-detail">
              Aide Juridictionnelle + France Identit&eacute; is furthest along.
              Largest certificate volume in the EU. Active EUDI Wallet pilot.
            </div>
          </div>
          <div className="pilot-card">
            <div className="pilot-flag">{"\ud83c\udde6\ud83c\uddf9"}</div>
            <div className="pilot-country">Austria</div>
            <div className="pilot-readiness">High EUDI Readiness</div>
            <div className="pilot-detail">
              Verfahrenshilfe. Smaller market, easier first sale. Strong EUDI
              preparedness. Ideal for a reference deployment.
            </div>
          </div>
          <div className="pilot-card">
            <div className="pilot-flag">{"\ud83c\udde9\ud83c\uddea"}</div>
            <div className="pilot-country">Germany</div>
            <div className="pilot-readiness">Launching Jan 2027</div>
            <div className="pilot-detail">
              Berechtigungsschein. Largest market by volume. EUDI launching
              January 2027. Long procurement timeline &mdash; strategic, not
              first.
            </div>
          </div>
        </div>
      </section>

      {/* PROPOSAL BANNER */}
      <section className="proposal-section">
        <div className="proposal-box">
          <div className="proposal-badge">Proposal Stage</div>
          <h2>This framework is a proposal.</h2>
          <p>
            The technical architecture is proven on Devnet. The regulatory
            mapping is researched. The next step is a funded pilot with one
            jurisdiction.
          </p>
          <div className="proposal-buttons">
            <Link href="/dashboard" className="btn-primary">
              View Live Demo
            </Link>
            <a
              href={GITHUB_URL}
              className="btn-secondary"
              target="_blank"
              rel="noopener noreferrer"
            >
              <GitHubIcon size={14} />
              Star on GitHub
            </a>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer-rich">
        <div className="footer-bg">
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
