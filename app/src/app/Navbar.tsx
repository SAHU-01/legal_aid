import Link from "next/link";

const GITHUB_URL = "https://github.com/SAHU-01/legal_aid";

function GitHubIcon() {
  return (
    <svg
      width={14}
      height={14}
      viewBox="0 0 24 24"
      fill="currentColor"
      style={{ verticalAlign: "-2px" }}
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 .587l3.668 7.431 8.332 1.21-6.03 5.874 1.424 8.305L12 19.187l-7.394 3.889 1.424-8.305L0 8.228l8.332-1.21z" />
    </svg>
  );
}

export default function Navbar({ activePage }: { activePage?: "home" | "eudi" | "docs" }) {
  return (
    <nav className="shared-nav">
      <div className="shared-nav-pill">
        <div className="shared-nav-col shared-nav-left">
          <span className="shared-nav-disabled">Blog</span>
          <Link
            href="/docs"
            className={`shared-nav-link${activePage === "docs" ? " shared-nav-active" : ""}`}
          >
            Docs
          </Link>
          <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="shared-nav-link">
            <GitHubIcon />
            GitHub
          </a>
        </div>
        <Link href="/" className="shared-nav-brand">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/adduce_logo.png" alt="Adduce" className="shared-nav-logo" />
          Adduce
        </Link>
        <div className="shared-nav-col shared-nav-right">
          <span className="shared-nav-disabled">Our Story</span>
          <Link
            href="/eudi-framework"
            className={`shared-nav-link${activePage === "eudi" ? " shared-nav-active" : ""}`}
          >
            EUDI Framework
          </Link>
          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="shared-nav-star"
          >
            <StarIcon />
            Star
          </a>
        </div>
      </div>
    </nav>
  );
}
