import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@solana/web3.js", "sas-lib", "@solana/kit"],
};

export default nextConfig;
