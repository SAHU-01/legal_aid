"use client";

import Link from "next/link";
import "../docs/docs.css";
import Navbar from "../Navbar";

const GITHUB_URL = "https://github.com/SAHU-01/legal_aid";

export default function StoryPage() {
  return (
    <div className="docs">
      <Navbar activePage="home" />

      <section className="docs-hero">
        <div className="docs-hero-badge">Our Story</div>
        <h1>
          From government research
          <br />
          <em>to on-chain infrastructure.</em>
        </h1>
        <p className="docs-hero-sub">
          Adduce was not born from a hackathon prompt. It was born from
          watching a paper certificate fail an entire justice system.
        </p>
      </section>

      <div className="docs-layout">
        <aside className="docs-sidebar">
          <div className="docs-sidebar-title">Timeline</div>
          <ul className="docs-sidebar-nav">
            <li><a href="#2022">2022: The Research</a></li>
            <li><a href="#prototype">The Centralized Prototype</a></li>
            <li><a href="#findings">12 Findings, 12 Features</a></li>
            <li><a href="#signal">The Signal</a></li>
            <li><a href="#landscape">Enterprise vs Adduce</a></li>
            <li><a href="#discovery">The Discovery</a></li>
            <li><a href="#why-solana">Why Solana</a></li>
            <li><a href="#solana">2 Years in Solana</a></li>
            <li><a href="#adduce">Adduce Today</a></li>
            <li><a href="#market">Market Scope</a></li>
            <li><a href="#whats-next">What Comes Next</a></li>
          </ul>
        </aside>

        <div className="docs-content">

          <section id="2022" className="docs-section">
            <div className="docs-section-label">2022</div>
            <h2>It started with a real government problem.</h2>
            <p>
              In 2022, we collaborated with a Bavarian state ministry and a
              leading technology entrepreneurship center on a research
              project: how do you validate government entitlement documents
              digitally while maintaining strict data integrity and
              compliance?
            </p>
            <p>
              The specific artifact was the legal aid eligibility
              certificate. A paper document issued by a court, presented by
              a citizen to a lawyer, and used to trigger payment from the
              state. One document. Three institutions. Zero interoperability.
            </p>
            <p>
              We spent months inside the workflow. We watched court clerks
              print certificates. We watched lawyers verify them by phone.
              We watched payment offices process claims that were 6 to 12
              months old. The friction was not technological. The courts had
              databases. The data existed digitally. But the OUTPUT, the
              certificate itself, was still paper.
            </p>
          </section>

          <section id="prototype" className="docs-section">
            <div className="docs-section-label">Prototype</div>
            <h2>We built the centralized version first.</h2>
            <p>
              The first prototype was a standard web application. Digital
              certificate issuance, database-backed verification, role-based
              access control. It worked. It validated the idea: digitizing
              this one artifact eliminates the friction.
            </p>
            <p>
              But it had the same problem every government IT project has:
              it only worked inside one institution. A court in Munich could
              issue a digital certificate, but a lawyer in Hamburg could not
              verify it without calling Munich. Cross-border? Impossible
              without bilateral agreements that do not exist.
            </p>
          </section>

          <section id="findings" className="docs-section">
            <div className="docs-section-label">Research Findings</div>
            <h2>What we found. What we built for each.</h2>
            <p>
              Our NDAs prevent us from sharing user interviews, design
              artifacts, or internal documents from the 2022 collaboration.
              What follows is reconstructed from handwritten notes and
              memory of the problems we observed firsthand. Every finding
              below directly shaped an Adduce feature.
            </p>

            <div className="live-case-table" style={{ marginTop: "1.5rem" }}>
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Problem Observed (2022)</div>
                <div className="live-case-cell live-case-cell-header">What Adduce Built (2025)</div>
              </div>
              {[
                {
                  p: "Certificates were forged or photocopied. Courts had no way to detect reuse across lawyers.",
                  s: "Credential-case binding (link_credential). One credential per case, enforced at the protocol level. Cannot be duplicated or reused.",
                },
                {
                  p: "Verification required phone calls between institutions. A lawyer in one city could not instantly verify a certificate issued in another.",
                  s: "On-chain SAS attestation. Any party reads the PDA directly. One RPC call. No phone calls. Cross-border native.",
                },
                {
                  p: "Citizens were locked to one lawyer with no easy way to switch. Reassignment required restarting the paper process.",
                  s: "reassign_lawyer instruction. Authority or reviewer switches the lawyer on an active case with full audit trail. No restart.",
                },
                {
                  p: "Eligibility changes (citizen gets a job) were not reflected for weeks. Revoked certificates continued circulating.",
                  s: "Instant revocation via account deletion. Every downstream instruction re-checks credential liveness. Zero stale window.",
                },
                {
                  p: "Lawyers waited 6-12 months for payment. Many stopped taking legal aid cases entirely.",
                  s: "mark_paid with authorized_amount enforcement and payment_reference. On-chain or off-chain settlement, but verification is instant.",
                },
                {
                  p: "Court clerks manually matched billing forms to cases. Error-prone and slow.",
                  s: "anchor_document with credential liveness re-check. Document hash anchored on-chain, linked to the case PDA. Automated matching.",
                },
                {
                  p: "No audit trail. Parliamentary oversight required manual file requests from each court.",
                  s: "Every state transition is a Solana transaction. 4 on-chain events. Any auditor reads the case PDA without permission.",
                },
                {
                  p: "Sensitive citizen data (income, family status) was exposed during verification. Privacy was an afterthought.",
                  s: "Groth16 ZK proofs. Prove eligibility without revealing tier, dates, or identity. Mathematical privacy, not access-control privacy.",
                },
                {
                  p: "Citizens without digital literacy were excluded from any digital solution.",
                  s: "Custodial model (open_case_custodial). Court acts on behalf of citizen using hashed national ID. Citizen never touches blockchain.",
                },
                {
                  p: "Different case types had different fee schedules, but the system treated all payments as flat amounts.",
                  s: "authorized_amount set per case during open_case. mark_paid enforces disbursed <= authorized. Payment reference tracked for audit.",
                },
                {
                  p: "Cases did not follow a linear path. Appeals, stays, remands were common but the system could not represent them.",
                  s: "8-status enum: Open, InProgress, Closed, Paid, Stayed, Appealed, Withdrawn, Remanded. Validated transitions via update_case_status.",
                },
                {
                  p: "When a reviewer was absent, cases were stuck. No escalation path, no delegation.",
                  s: "Up to 3 delegate reviewers via add_delegate. Timeout escalation: if case exceeds case_timeout_days, authority can close directly.",
                },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell">{row.p}</div>
                  <div className="live-case-cell" style={{ color: "var(--accent)" }}>{row.s}</div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              12 problems observed during government research. 12 features
              built into the Adduce protocol. Every instruction in the
              program traces back to a real workflow failure we witnessed.
            </p>
          </section>

          <section id="signal" className="docs-section">
            <div className="docs-section-label">The Signal</div>
            <h2>The ministry said blockchain was the direction.</h2>
            <p>
              During the research collaboration, the ministry team flagged
              that a blockchain-based solution was what they were actively
              exploring. Not as hype. As infrastructure. They needed a
              credential that could be issued by one authority, verified by
              another, and audited by a third, without any of them sharing
              a database or joining a consortium.
            </p>
            <p>
              We shelved the centralized prototype. The idea was validated.
              The architecture was wrong.
            </p>
          </section>

          <section id="landscape" className="docs-section">
            <div className="docs-section-label">Research</div>
            <h2>We studied what exists. Then we built something different.</h2>
            <p>
              After the centralized MVP was approved but before we chose
              a chain, we researched how governments globally were
              approaching blockchain-based credentials. The enterprise
              standard was clear: Hyperledger Fabric for the ledger,
              Hyperledger Aries for identity, IBM as the integrator.
              Bavaria itself had adopted a blockchain strategy
              (Block-Chain-Trust, 2020). IBM had won a $3.2M contract
              for digital health certificates in Germany. Cert4Trust was
              verifying 375,000+ professional certificates per year on
              blockchain. The technology was proven.
            </p>
            <p>
              But no one had applied it to legal aid. And the enterprise
              stack had gaps that mattered specifically for this use case.
              Here is the architecture comparison that led us to Solana.
            </p>

            <h3>Enterprise stack (Hyperledger) vs Adduce (Solana)</h3>
            <div className="live-case-table" style={{ marginTop: "1rem" }}>
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Concern</div>
                <div className="live-case-cell live-case-cell-header">Enterprise Stack</div>
                <div className="live-case-cell live-case-cell-header">Adduce</div>
              </div>
              {[
                { c: "Credential storage", e: "Off-chain wallet (holder's phone). Phone lost = credential gone.", a: "On-chain PDA. Survives server failure and phone loss." },
                { c: "Privacy model", e: "Private Data Collections (access control: trust the admin).", a: "Groth16 ZK proofs (mathematical: trust the math)." },
                { c: "Selective disclosure", e: "CL signatures (~500 bytes). Elegant but rigid: only range proofs.", a: "Custom Circom circuit (256 bytes). Arbitrary predicates." },
                { c: "Credential-case binding", e: "Middleware (application-level, misconfigurable).", a: "link_credential: atomic, protocol-enforced, cannot bypass." },
                { c: "Revocation", e: "Registry + accumulator + non-revocation proofs. Latency exists.", a: "Account deletion. Instant. Global. Zero complexity." },
                { c: "Cross-border", e: "Requires inter-ministerial consortium per country pair.", a: "Public chain. Any Solana node. No agreements." },
                { c: "Verification", e: "Requires Indy ledger access + Aries agent running.", a: "Single RPC call. Any language. Any system." },
                { c: "Credential liveness", e: "Application-level (may or may not re-check at each step).", a: "Re-checked on every anchor_document and close_case. Cannot skip." },
                { c: "Lawyer reassignment", e: "Application-level (if built). No audit trail.", a: "reassign_lawyer with LawyerReassigned event." },
                { c: "Lawyer privacy", e: "Fabric channels (access control).", a: "SHA-256 commitment (hash on-chain, not pubkey)." },
                { c: "Case status model", e: "Custom chaincode (consultant builds per deployment).", a: "8-status enum with validated transitions. Built in." },
                { c: "Escalation/delegation", e: "Custom chaincode (if built).", a: "add_delegate + case_timeout_days. Built in." },
                { c: "Payment validation", e: "Application-level (SAP handles).", a: "authorized_amount enforced on-chain. Cannot overpay." },
                { c: "Custodial (no wallet)", e: "Aries custodial wallet (complex setup).", a: "citizen_id_hash (one field, one instruction)." },
                { c: "Infrastructure", e: "Kubernetes + Fabric peers + ordering nodes + CA servers.", a: "Public Solana validators. No servers to maintain." },
                { c: "Deploy cost", e: "Multi-million dollar contracts + ongoing CapEx.", a: "$0.004/credential. Pure OpEx." },
                { c: "Deploy time", e: "6-18 months (consortium formation).", a: "Hours (anchor deploy)." },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.c}</span></div>
                  <div className="live-case-cell">{row.e}</div>
                  <div className="live-case-cell" style={{ color: "var(--accent)" }}>{row.a}</div>
                </div>
              ))}
            </div>

            <p style={{ marginTop: "1.5rem", fontSize: "0.82rem", color: "var(--text-muted)", fontStyle: "italic" }}>
              The enterprise stack works. It is proven for health passes and
              professional certificates. But for legal aid, where credentials
              cross borders, cases need non-linear status management, lawyers
              need reassignment, and citizens may not have wallets, the
              public chain architecture is a better fit. That is why we
              chose Solana.
            </p>
          </section>

          <section id="discovery" className="docs-section">
            <div className="docs-section-label">Discovery</div>
            <h2>Then we found 9 countries with the same problem.</h2>
            <p>
              Germany was not unique. The Netherlands has the Toevoeging.
              France has the Aide Juridictionnelle. Italy, Spain, Austria,
              Portugal, Canada, Ireland, all have certificate-based legal
              aid systems. Same paper artifact. Same institutional friction.
              Same 6 to 12 month payment delays. 500 million citizens
              covered by systems that run on paper.
            </p>
            <p>
              This was not a German problem. It was a structural problem
              in every jurisdiction that uses voucher-style legal aid.
              One protocol could serve all of them.
            </p>
          </section>

          <section id="why-solana" className="docs-section">
            <div className="docs-section-label">Architecture Decision</div>
            <h2>Why Solana.</h2>
            <p>
              The ministry wanted a credential that works across
              institutions without a shared database. That rules out
              centralized systems. It also rules out private consortium
              chains: while EU blockchain consortiums exist for diplomas
              and Social Security (EUROPEUM-EDIC, EBSI), none covers
              legal aid certificates. Building one from scratch takes
              years of inter-ministerial negotiation. A public chain
              skips that entirely.
            </p>
            <p>Among public chains, Solana was the only one with all five
              requirements met at the same time:</p>
            <ul className="req-list">
              <li><strong>Native ZK verification.</strong> The alt_bn128
                syscall lets us verify Groth16 proofs on-chain in ~200k
                compute units. No precompile contracts. No L2 bridges.
                Same cost as a token transfer.</li>
              <li><strong>Credential infrastructure.</strong> The Solana
                Attestation Service (SAS) launched May 2025 with schema
                registry, deterministic PDA addressing, expiry, and
                revocation built in. We build on it, not around it.</li>
              <li><strong>State compression.</strong> Light Protocol
                reduces on-chain storage costs by 98.8%. At government
                scale (100K+ cases/year), this is the difference between
                feasible and not.</li>
              <li><strong>Sub-second finality.</strong> 400ms slot time
                means credential verification and payment settlement
                happen in a single user interaction. No block
                confirmations to wait for.</li>
              <li><strong>No consortium.</strong> Public validators. Any
                court in any country verifies a credential issued by any
                other country. No bilateral agreements. No shared
                infrastructure.</li>
            </ul>
          </section>

          <section id="solana" className="docs-section">
            <div className="docs-section-label">2024-2026</div>
            <h2>Two years building in the Solana ecosystem.</h2>
            <p>
              Between the 2022 research and now, the time went into
              production Solana work across privacy infrastructure,
              autonomous agents, and credential systems. Not theory.
              Shipped code.
            </p>

            <h3>Solana production experience</h3>
            <div className="live-case-table" style={{ marginTop: "1rem" }}>
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Project</div>
                <div className="live-case-cell live-case-cell-header">Stack</div>
              </div>
              {[
                { p: "Privacy wallet (multi-chain Solana + Zcash)", s: "Oasis ROFL TEE, FROST 2-of-2 threshold signing, seedless custody, TOTP recovery" },
                { p: "Autonomous agent economy on Solana", s: "Lit Protocol PKPs for agent wallets, Realms governance, DRiP integration" },
                { p: "Video generation pipeline with agent payments", s: "MCP servers, x402 protocol, agent payment flows" },
                { p: "Adduce (this project)", s: "Anchor 0.32, SAS, Light Protocol, Circom/Groth16, x402, Solana Agent Kit" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.p}</span></div>
                  <div className="live-case-cell">{row.s}</div>
                </div>
              ))}
            </div>

            <h3>Production stack</h3>
            <p>
              Anchor 0.30+, Next.js 16, wallet-adapter (Phantom + email
              login), Helius RPC, Photon indexer, Solana web3.js, SPL
              tokens, Metaplex. Frontend: React, TypeScript, Turborepo
              monorepo architecture.
            </p>

            <h3>Track record</h3>
            <ul className="req-list">
              <li>Top-10 finish on a major DoraHacks privacy track</li>
              <li>Multiple shipped submissions across HashKey Chain, Starknet, and Solana ecosystems</li>
              <li>Google Summer of Code (Memorial Sloan Kettering)</li>
              <li>Linux Foundation LFX Mentorship (Meshery)</li>
              <li>Sustained open-source contributions to Protocol Labs IPFS core repos (helia-verified-fetch, service-worker-gateway, IPFS Companion, Boxo)</li>
            </ul>

            <p style={{ marginTop: "1.5rem" }}>
              When the Solana Attestation Service launched in May 2025, the
              final piece fell into place. SAS provides exactly what the
              ministry described in 2022: credential issuance on a public
              ledger, schema-validated, expiry-aware, revocable by account
              deletion. No DIDComm agents. No Indy ledger. No consortium.
            </p>
          </section>

          <section id="adduce" className="docs-section">
            <div className="docs-section-label">Today</div>
            <h2>Adduce: the idea rebuilt from scratch on Solana.</h2>
            <p>
              Adduce is the product of that 2022 government research,
              validated by real ministry collaboration, expanded by the
              discovery of 9 countries sharing the same problem, and
              rebuilt from scratch using the Solana stack.
            </p>
            <div className="live-case-table" style={{ marginTop: "1.5rem" }}>
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">What</div>
                <div className="live-case-cell live-case-cell-header">Status</div>
              </div>
              {[
                { w: "Anchor program (14 instructions, 4 events, 26 errors)", s: "Deployed on Devnet", l: "https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet" },
                { w: "Groth16 ZK circuit (7,883 constraints, 256-byte proofs)", s: "Compiled + tested", l: "" },
                { w: "SAS credential issuance + custodial model", s: "Live", l: "https://explorer.solana.com/address/7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid?cluster=devnet" },
                { w: "Encrypted document storage (Arweave + Irys)", s: "Live", l: "https://devnet.irys.xyz/2Cyx7gpJgDmivrgDiaCnwsrVCAWqkUMRVWCyDaNAVymn" },
                { w: "ZK compression (Light Protocol, 98.8% savings)", s: "Live", l: "" },
                { w: "x402 credential-gated payment", s: "Live", l: "" },
                { w: "Lawyer privacy (SHA-256 commitment)", s: "Live", l: "" },
                { w: "Delegation, escalation, extended case status", s: "Live", l: "" },
                { w: "Landing page + technical docs + demo dashboard", s: "Deployed", l: "/docs" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell">{row.w}</div>
                  <div className="live-case-cell" style={{ color: "var(--accent)", fontWeight: 600 }}>
                    {row.l ? <a href={row.l} target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent)", textDecoration: "underline" }}>{row.s}</a> : row.s}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="market" className="docs-section">
            <div className="docs-section-label">Market</div>
            <h2>The scope of the problem.</h2>
            <p>
              Certificate-based legal aid is not a niche. It is how the
              majority of developed nations provide access to justice for
              citizens who cannot afford private representation.
            </p>

            <div className="live-case-table" style={{ marginTop: "1.5rem" }}>
              <div className="live-case-row live-case-row-header">
                <div className="live-case-cell live-case-cell-header">Country</div>
                <div className="live-case-cell live-case-cell-header">Certificate</div>
                <div className="live-case-cell live-case-cell-header">Scale</div>
              </div>
              {[
                { c: "Germany", cert: "Berechtigungsschein", sc: "~600K applications/year" },
                { c: "France", cert: "Aide Juridictionnelle", sc: "775K approved in 2024 (+13% YoY)" },
                { c: "Netherlands", cert: "Toevoeging", sc: "Raad voor Rechtsbijstand: national system" },
                { c: "Italy", cert: "Patrocinio a spese dello Stato", sc: "Income threshold: EUR 12,838" },
                { c: "Spain", cert: "Asistencia Juridica Gratuita", sc: "17 autonomous communities, fragmented" },
                { c: "Austria", cert: "Verfahrenshilfe", sc: "Mandatory electronic legal communication (ERV)" },
                { c: "Portugal", cert: "Apoio Judiciario", sc: "Applications via Social Security portal" },
                { c: "Canada", cert: "Legal Aid Certificate", sc: "Province-specific (Ontario LAO, BC LSS)" },
                { c: "Ireland", cert: "Legal Aid Certificate", sc: "Legal Aid Board under Dept of Justice" },
              ].map((row, idx) => (
                <div key={idx} className="live-case-row">
                  <div className="live-case-cell"><span className="cell-label">{row.c}</span></div>
                  <div className="live-case-cell">{row.cert}</div>
                  <div className="live-case-cell">{row.sc}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: "2rem", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem", textAlign: "center" }}>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>9</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Countries with certificate-based legal aid</div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>500M+</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Citizens covered by these systems</div>
              </div>
              <div>
                <div style={{ fontSize: "2rem", fontWeight: 700, color: "var(--text-primary)" }}>1.3M+</div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>Certificates issued per year (DE + FR alone)</div>
              </div>
            </div>

            <p style={{ marginTop: "2rem" }}>
              Every one of these countries has the same structural problem:
              a paper certificate that gets forged, reused, verified by
              phone, and takes months to turn into payment. One protocol,
              parameterized by jurisdiction, serves all of them.
            </p>
          </section>

          <section id="whats-next" className="docs-section">
            <div className="docs-section-label">Commitment</div>
            <h2>This is not a hackathon exit.</h2>
            <p>
              I am stepping back from my current role to commit full-time
              to building and maintaining Adduce. The research validated the
              problem. The prototype validated the solution. The Solana
              ecosystem provides the infrastructure. What remains is
              execution: government integration APIs, pilot deployments,
              and expanding to the jurisdictions that need this most.
            </p>
            <p>
              The legal aid certificate is one document. But it decides
              whether a lawyer takes the case, whether a citizen gets
              representation, and whether justice is accessible or just
              theoretical. Making that document unforgeable, private, and
              instant is worth building for.
            </p>
            <div style={{ marginTop: "2rem", display: "flex", gap: "1rem", flexWrap: "wrap" }}>
              <Link
                href="/dashboard"
                style={{
                  display: "inline-block",
                  fontSize: "0.85rem",
                  padding: "0.65rem 1.8rem",
                  background: "#1a1a1a",
                  color: "#fff",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 500,
                }}
              >
                Try the Demo
              </Link>
              <a
                href={GITHUB_URL}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-block",
                  fontSize: "0.85rem",
                  padding: "0.65rem 1.8rem",
                  background: "transparent",
                  color: "#1a1a1a",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: 500,
                  border: "1px solid #ddd",
                }}
              >
                View the Code
              </a>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
