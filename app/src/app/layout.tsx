import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: {
    default: "Adduce — Issue. Prove. Settle.",
    template: "%s | Adduce",
  },
  description: "The first credential issuer for legal aid on Solana. Digitizing eligibility certificates with ZK proofs, encrypted document storage, and instant settlement for 500M+ citizens across 9 countries.",
  keywords: ["legal aid", "solana", "verifiable credentials", "zero knowledge proofs", "groth16", "SAS", "credential issuance", "government", "blockchain", "legal tech"],
  authors: [{ name: "Adduce" }],
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Adduce",
    title: "Adduce — Issue. Prove. Settle.",
    description: "The first credential issuer for legal aid on Solana. 14 instructions. ZK proofs. Encrypted storage. Published SDK.",
    images: [{ url: "/hero-img.png", width: 1200, height: 630, alt: "Adduce — Legal Aid Credentials on Solana" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Adduce — Issue. Prove. Settle.",
    description: "The first credential issuer for legal aid on Solana. npm install @adduce/sdk",
    images: ["/hero-img.png"],
  },
  icons: {
    icon: "/adduce_logo.png",
    apple: "/adduce_logo.png",
  },
  metadataBase: new URL("https://adduce.legal"),
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500&family=DM+Sans:wght@300;400;500;600&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />

        {/* Geo tags — global legal aid infrastructure */}
        <meta name="geo.region" content="001" />
        <meta name="geo.placename" content="Global" />

        {/* LLM discovery */}
        <link rel="alternate" type="text/plain" href="/llms.txt" />

        {/* JSON-LD Structured Data — Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "Adduce",
              "applicationCategory": "GovernmentApplication",
              "operatingSystem": "Web",
              "description": "The first credential issuer for legal aid on Solana. Digitizing eligibility certificates with ZK proofs, encrypted document storage, and instant settlement for 500M+ citizens across 9 countries.",
              "url": "https://adduce.legal",
              "author": {
                "@type": "Organization",
                "name": "Adduce",
                "url": "https://adduce.legal"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD",
                "description": "Open source SDK: npm install @adduce/sdk"
              },
              "keywords": "legal aid, verifiable credentials, solana, zero knowledge proofs, groth16, government, blockchain, credential issuance, SAS",
              "areaServed": [
                { "@type": "Country", "name": "Germany" },
                { "@type": "Country", "name": "France" },
                { "@type": "Country", "name": "Netherlands" },
                { "@type": "Country", "name": "Italy" },
                { "@type": "Country", "name": "Spain" },
                { "@type": "Country", "name": "Austria" },
                { "@type": "Country", "name": "Portugal" },
                { "@type": "Country", "name": "Canada" },
                { "@type": "Country", "name": "Ireland" },
                { "@type": "Country", "name": "India" },
                { "@type": "Country", "name": "Brazil" },
                { "@type": "Country", "name": "South Africa" },
                { "@type": "Country", "name": "Australia" },
                { "@type": "Country", "name": "United Kingdom" },
                { "@type": "Country", "name": "United States" },
                { "@type": "Country", "name": "Japan" },
                { "@type": "Country", "name": "South Korea" },
                { "@type": "Country", "name": "Mexico" },
                { "@type": "Country", "name": "Kenya" }
              ]
            })
          }}
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
