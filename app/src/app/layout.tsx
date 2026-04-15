import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Legal Aid Plugin",
  description: "Solana-powered legal aid platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
