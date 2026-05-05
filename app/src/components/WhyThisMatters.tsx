const links = [
  { label: "Program", href: "https://explorer.solana.com/address/3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV?cluster=devnet" },
  { label: "SAS Schema", href: "https://explorer.solana.com/address/7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid?cluster=devnet" },
  { label: "SDK", href: "https://www.npmjs.com/package/@adduce/sdk" },
  { label: "Docs", href: "/docs" },
  { label: "GitHub", href: "https://github.com/SAHU-01/legal_aid" },
];

export default function WhyThisMatters() {
  return (
    <div className="border-t border-zinc-800 bg-zinc-900/40">
      <div className="max-w-7xl mx-auto w-full px-6 lg:px-10 py-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <p className="text-[11px] text-zinc-500">
          Preview data. All three roles interact with the same on-chain CaseFile.
          Integrate for real via{" "}
          <a href="https://www.npmjs.com/package/@adduce/sdk" target="_blank" rel="noopener noreferrer" className="text-emerald-500/80 hover:text-emerald-400">
            @adduce/sdk
          </a>
        </p>
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              target={link.href.startsWith("/") ? undefined : "_blank"}
              rel={link.href.startsWith("/") ? undefined : "noopener noreferrer"}
              className="text-[10px] font-mono text-zinc-500 hover:text-emerald-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
