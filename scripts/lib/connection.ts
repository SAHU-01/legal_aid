import "dotenv/config";
import { Connection, Keypair } from "@solana/web3.js";
import fs from "fs";
import path from "path";

// --- Helius RPC (required for Light Protocol compressed accounts) ---

const raw = process.env.HELIUS_RPC_URL;
if (!raw) {
  throw new Error(
    "HELIUS_RPC_URL is not set. Add it to .env — standard devnet RPC won't work for compressed accounts."
  );
}

// Accept either a full URL or a bare API key
export const HELIUS_RPC_URL = raw.startsWith("http")
  ? raw
  : `https://devnet.helius-rpc.com/?api-key=${raw}`;

export const connection = new Connection(HELIUS_RPC_URL, "confirmed");

// --- Local keypair loader (~/.config/solana/id.json) ---

export function loadKeypair(
  filePath = path.join(
    process.env.HOME ?? "~",
    ".config",
    "solana",
    "id.json"
  )
): Keypair {
  const raw = fs.readFileSync(filePath, "utf-8");
  const secret = Uint8Array.from(JSON.parse(raw));
  return Keypair.fromSecretKey(secret);
}

export const payer = loadKeypair();
