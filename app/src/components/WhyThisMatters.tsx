const explorerLinks = [
  {
    label: "Program",
    href: "https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet",
  },
  {
    label: "SAS Schema",
    href: "https://explorer.solana.com/address/7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid?cluster=devnet",
  },
  {
    label: "Sample Case",
    href: "https://explorer.solana.com/address/23kjFise2XnUgwYbv3ka5R2VQP8uE1FGBGfZBEDie5n9?cluster=devnet",
  },
];

export default function WhyThisMatters() {
  return (
    <div className="border-t border-zinc-800 bg-zinc-900/40">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-6">
        <h4 className="text-xs uppercase tracking-wider text-purple-400/70 mb-2">
          Why this matters
        </h4>
        <p className="text-[11px] text-zinc-500 max-w-3xl mb-3">
          All three roles — applicant, lawyer, court operator — interact with the
          same on-chain CaseFile. Every action is a Solana transaction visible on
          Explorer, immutable, instantly verifiable across jurisdictions. This is
          what private blockchains cannot offer.
        </p>
        <div className="flex items-center gap-4">
          {explorerLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] font-mono text-emerald-500/60 hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
