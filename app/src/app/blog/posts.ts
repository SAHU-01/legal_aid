export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  image: string;
  content: string;
}

export const posts: BlogPost[] = [
  {
    slug: "why-paper-certificates-fail",
    title: "The Credential Issuance Problem: Why Paper Certificates Still Run Legal Aid in 2026",
    excerpt: "6-12 month payment delays across the EU. 40% lawyer dropout. The asymmetry between digital storage and paper issuance is the root cause.",
    date: "2026-05-06",
    readTime: "5 min",
    image: "/hero-img.png",
    content: `
<p>In 2026, European legal aid systems are facing a critical operational crisis. Despite massive public sector investments in digital transformation, many jurisdictions continue to authorize and pay private lawyers using <strong>analog, voucher-style legal aid certificates</strong>. This reliance on outdated paper processes directly contributes to severe inefficiencies, frequently resulting in devastating payment delays for legal aid providers across the EU.</p>

<div class="stat-row">
  <div class="stat-card">
    <div class="stat-number">6-12</div>
    <div class="stat-label">Months average payment delay</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">40%</div>
    <div class="stat-label">Lawyers who stop taking legal aid</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">1.3M+</div>
    <div class="stat-label">Certificates issued per year (DE + FR)</div>
  </div>
  <div class="stat-card">
    <div class="stat-number">500M+</div>
    <div class="stat-label">Citizens covered by these systems</div>
  </div>
</div>

<p class="source">Sources: <a href="https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/upholding-rule-law/eu-justice-scoreboard_en" target="_blank">EU Justice Scoreboard 2024</a>, <a href="https://www.ccbe.eu/documents/publications/" target="_blank">CCBE Reports</a></p>

<h2>The Structural Bottleneck: Digital Storage, Paper Output</h2>

<p>The root of this crisis lies in a profound structural bottleneck: <em>the asymmetry between digital storage and physical issuance</em>. Citizen eligibility data is processed and stored digitally within specialized government databases. But the output, the actual certificate that authorizes representation and triggers payment, is still <strong>printed on paper and handed over physically</strong>.</p>

<blockquote>The data exists digitally. The proof of that data is still paper. This is the asymmetry that breaks the entire system.</blockquote>

<p>This disconnect creates cascading failures at every stage:</p>

<table>
  <tr>
    <th>Stage</th>
    <th>What Happens Today</th>
    <th>The Cost</th>
  </tr>
  <tr>
    <td><strong>Issuance</strong></td>
    <td>Court prints certificate, mails or hands to citizen</td>
    <td>Days to weeks before lawyer receives it</td>
  </tr>
  <tr>
    <td><strong>Verification</strong></td>
    <td>Lawyer calls issuing court to confirm authenticity</td>
    <td>Phone queues, business-hour dependency, human error</td>
  </tr>
  <tr>
    <td><strong>Fraud</strong></td>
    <td>Paper can be photocopied, reused across lawyers</td>
    <td>Unquantifiable drain on public budgets</td>
  </tr>
  <tr>
    <td><strong>Revocation</strong></td>
    <td>Citizen gains employment; certificate keeps circulating</td>
    <td>Weeks before all parties know it is invalid</td>
  </tr>
  <tr>
    <td><strong>Payment</strong></td>
    <td>Lawyer submits paper forms; clerk matches to case manually</td>
    <td>6-12 months before payment arrives</td>
  </tr>
  <tr>
    <td><strong>Cross-border</strong></td>
    <td>Court in country A cannot verify certificate from country B</td>
    <td>No interoperability without bilateral agreements</td>
  </tr>
</table>

<h2>The Numbers: EU Justice Under Strain</h2>

<p>The European Commission's <a href="https://commission.europa.eu/strategy-and-policy/policies/justice-and-fundamental-rights/upholding-rule-law/eu-justice-scoreboard_en" target="_blank">EU Justice Scoreboard</a> tracks the efficiency, quality, and independence of national justice systems. The 2024 edition underscores what practitioners already know: <strong>the uptake of digitalisation in national justice systems across EU Member States remains uneven</strong>.</p>

<p>Country-level data tells the story:</p>

<table>
  <tr>
    <th>Country</th>
    <th>Certificate</th>
    <th>Volume</th>
    <th>Digital Status</th>
  </tr>
  <tr>
    <td><strong>France</strong></td>
    <td>Aide Juridictionnelle</td>
    <td>775,300 approved in 2024 (+13% YoY)</td>
    <td>SIAJ system deployed, but certificate delivery still mixed</td>
  </tr>
  <tr>
    <td><strong>Germany</strong></td>
    <td>Berechtigungsschein</td>
    <td>~600,000 applications/year</td>
    <td>Paper-based. Some courts accept online applications.</td>
  </tr>
  <tr>
    <td><strong>Netherlands</strong></td>
    <td>Toevoeging</td>
    <td>National system via Raad voor Rechtsbijstand</td>
    <td>Most advanced: online portal for lawyers. Verification still internal.</td>
  </tr>
  <tr>
    <td><strong>Italy</strong></td>
    <td>Patrocinio a spese dello Stato</td>
    <td>Income threshold: EUR 12,838</td>
    <td>Mandatory e-filing (PCT) but certificates still paper</td>
  </tr>
  <tr>
    <td><strong>Spain</strong></td>
    <td>Asistencia Juridica Gratuita</td>
    <td>17 autonomous communities, fragmented</td>
    <td>Electronic application in some regions only</td>
  </tr>
</table>

<p class="source">Sources: <a href="https://mon-administration.com/aide-juridictionnelle-2025/" target="_blank">France AJ 2025</a>, <a href="https://www.rechtsbijstand.nl/over-ons/about-the-dutch-legal-aid-board/" target="_blank">Raad voor Rechtsbijstand</a>, <a href="https://handbookgermany.de/en/legal-aid" target="_blank">Handbook Germany</a></p>

<h2>Why PDFs and Portals Are Not the Answer</h2>

<p>Some jurisdictions have attempted half-measures: online application forms, PDF certificates, internal verification portals. These solve the <em>application</em> problem but not the <em>verification</em> problem. A PDF certificate is just a digital photocopy of a paper certificate. It can still be:</p>

<ul>
  <li><strong>Forwarded</strong> to unauthorized parties</li>
  <li><strong>Duplicated</strong> across multiple lawyers</li>
  <li><strong>Used after revocation</strong> (no real-time status check)</li>
  <li><strong>Unverifiable cross-border</strong> (portal only works within issuing jurisdiction)</li>
</ul>

<div class="callout">
  <strong>The core requirement:</strong> A credential that is cryptographically signed by the issuing authority, instantly verifiable by any party without calling the issuer, revocable in real-time, and privacy-preserving so that verification does not require exposing the citizen's personal data.
</div>

<h2>The Regulatory Tailwind: eIDAS 2.0</h2>

<p>The EU is not waiting. <a href="https://digital-strategy.ec.europa.eu/en/policies/eudi-regulation" target="_blank">Regulation (EU) 2024/1183</a> mandates that every Member State must offer a digital identity wallet to citizens and businesses by <strong>December 2026</strong>. Legal aid certificates qualify as <em>Electronic Attestations of Attributes</em> (EAAs) under this framework.</p>

<p>The regulation explicitly requires:</p>

<ul>
  <li><strong>Selective disclosure</strong>: share only necessary attributes ("eligible in jurisdiction DE") without revealing income or family status</li>
  <li><strong>Unlinkability</strong>: two presentations from the same credential cannot be correlated by verifiers</li>
  <li><strong>Holder control</strong>: the credential runs on the citizen's device, not a government server</li>
</ul>

<p>These are not aspirational goals. They are legal requirements with a hard deadline. Every certificate-based legal aid system in Europe will need a compliant digital credential issuer.</p>

<h2>The Question</h2>

<p>The problem is validated. The regulatory mandate is set. The market is 9 countries and 500 million citizens. The question is not <em>whether</em> the paper certificate will be digitized. It is <strong>who builds the credential issuer, and on what infrastructure</strong>.</p>

<p>The next post in this series examines the technical architecture of credential issuance on a public chain, and why the enterprise consortium model that works for health certificates may not be the right fit for legal aid.</p>
`,
  },
];
