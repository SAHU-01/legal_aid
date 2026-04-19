import "dotenv/config";
import fs from "fs";
import path from "path";
import { PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  getAccount,
} from "@solana/spl-token";
import { connection, payer } from "./connection";

const USDC_DECIMALS = 6;
const INFO_PATH = path.join(__dirname, "..", "usdc-mint-info.json");

export interface UsdcMintInfo {
  mint: string;
  decimals: number;
  mintAuthority: string;
  createdAt: string;
}

/**
 * Load the mock USDC mint address from usdc-mint-info.json.
 * Returns null if the file doesn't exist.
 */
export function loadUsdcMint(): UsdcMintInfo | null {
  if (!fs.existsSync(INFO_PATH)) return null;
  return JSON.parse(fs.readFileSync(INFO_PATH, "utf-8"));
}

/**
 * Create a new mock USDC mint on devnet (6 decimals, payer as mint authority).
 * Saves the mint info to usdc-mint-info.json and returns it.
 */
export async function createUsdcMint(): Promise<UsdcMintInfo> {
  const mint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    USDC_DECIMALS
  );

  const info: UsdcMintInfo = {
    mint: mint.toBase58(),
    decimals: USDC_DECIMALS,
    mintAuthority: payer.publicKey.toBase58(),
    createdAt: new Date().toISOString(),
  };

  fs.writeFileSync(INFO_PATH, JSON.stringify(info, null, 2));
  return info;
}

/**
 * Get or create the mock USDC mint. Reuses existing if usdc-mint-info.json exists
 * and the mint is still valid on-chain; otherwise creates a new one.
 */
export async function getOrCreateUsdcMint(): Promise<{
  mint: PublicKey;
  info: UsdcMintInfo;
}> {
  const existing = loadUsdcMint();

  if (existing) {
    // Verify it still exists on-chain
    try {
      const mintPubkey = new PublicKey(existing.mint);
      await getAccount(connection, mintPubkey).catch(() => null);
      const acct = await connection.getAccountInfo(mintPubkey);
      if (acct) {
        return { mint: mintPubkey, info: existing };
      }
    } catch {
      // Fall through to create new
    }
  }

  const info = await createUsdcMint();
  return { mint: new PublicKey(info.mint), info };
}

/**
 * Set up a funded USDC account: creates ATA and mints tokens.
 */
export async function fundUsdcAccount(
  mint: PublicKey,
  owner: PublicKey,
  amount: number
) {
  const ata = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    mint,
    owner
  );

  const atomicAmount = amount * 10 ** USDC_DECIMALS;
  await mintTo(connection, payer, mint, ata.address, payer, atomicAmount);

  return ata;
}
