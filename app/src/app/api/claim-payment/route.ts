export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { createSolanaRpc, address, type Address } from "@solana/kit";
import {
  fetchMaybeAttestation,
  fetchSchema,
  deserializeAttestationData,
  deriveAttestationPda,
} from "sas-lib";
import {
  getDefaultTokenAsset,
  toAtomicUnits,
} from "x402-solana/utils";
import { SOLANA_DEVNET_CAIP2 } from "x402-solana/types";

// ── Config ──────────────────────────────────────────────────────────

const NETWORK = SOLANA_DEVNET_CAIP2;
const USDC = getDefaultTokenAsset("solana:devnet");

const RECIPIENT =
  process.env.LAWYER_WALLET ?? "C35KAMuYGrkCf1nw5c4qQ1137pJT1zQnkbrCzrpm7wkU";

const AMOUNT_USDC = 50;
const AMOUNT_ATOMIC = toAtomicUnits(AMOUNT_USDC, USDC.decimals);

const DESCRIPTION = "Legal aid case disbursement";

// SAS credential addresses (from Day 2 schema creation)
const SCHEMA_ADDRESS = "7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid";
const CREDENTIAL_ADDRESS = "4chJRmgzUcbDCgmcToYmNZdMjdNgEK3jktZMo1SUdy9o";

// ── RPC helpers ─────────────────────────────────────────────────────

function getRpcUrl(): string {
  const raw = process.env.HELIUS_RPC_URL;
  if (!raw) {
    throw new Error("HELIUS_RPC_URL not set");
  }
  return raw.startsWith("http")
    ? raw
    : `https://devnet.helius-rpc.com/?api-key=${raw}`;
}

// ── SAS credential verification ─────────────────────────────────────

interface CredentialResult {
  valid: boolean;
  error?: string;
  jurisdiction?: string;
  eligibilityTier?: string;
  expiryDate?: number;
}

async function verifyLawyerCredential(
  lawyerWallet: string
): Promise<CredentialResult> {
  // Use standard devnet RPC for SAS (it doesn't need Helius)
  const rpc = createSolanaRpc("https://api.devnet.solana.com");

  // Derive the attestation PDA for this lawyer
  const [attestationAddress] = await deriveAttestationPda({
    credential: address(CREDENTIAL_ADDRESS),
    schema: address(SCHEMA_ADDRESS),
    nonce: address(lawyerWallet),
  });

  // Fetch the attestation account
  const maybeAttestation = await fetchMaybeAttestation(
    rpc,
    attestationAddress
  );

  if (!maybeAttestation.exists) {
    return {
      valid: false,
      error: `No SAS credential found for wallet ${lawyerWallet}`,
    };
  }

  const attestation = maybeAttestation.data;

  // Fetch schema and deserialize data fields
  const schema = await fetchSchema(rpc, address(SCHEMA_ADDRESS));
  const decoded = deserializeAttestationData<{
    jurisdiction: string;
    eligibility_tier: string;
    expiry_date: bigint;
  }>(schema.data, Uint8Array.from(attestation.data));

  const expiryTs = Number(decoded.expiry_date);
  const now = Math.floor(Date.now() / 1000);

  // Check expiry
  if (expiryTs <= now) {
    return {
      valid: false,
      error: `Credential expired at ${new Date(expiryTs * 1000).toISOString()}`,
      jurisdiction: decoded.jurisdiction,
      eligibilityTier: decoded.eligibility_tier,
      expiryDate: expiryTs,
    };
  }

  // Check jurisdiction is set
  const jurisdiction = decoded.jurisdiction.trim();
  if (!jurisdiction) {
    return {
      valid: false,
      error: "Credential has empty jurisdiction",
    };
  }

  return {
    valid: true,
    jurisdiction,
    eligibilityTier: decoded.eligibility_tier.trim(),
    expiryDate: expiryTs,
  };
}

// ── GET → 402 Payment Required ──────────────────────────────────────

export async function GET() {
  const body = {
    x402Version: 2,
    resource: {
      url: "/api/claim-payment",
      description: DESCRIPTION,
      mimeType: "application/json",
    },
    accepts: [
      {
        scheme: "exact",
        network: NETWORK,
        amount: AMOUNT_ATOMIC,
        asset: USDC.address,
        payTo: RECIPIENT,
        maxTimeoutSeconds: 300,
        extra: {
          description: DESCRIPTION,
          mimeType: "application/json",
          requiredCredential: {
            provider: "SAS",
            schema: SCHEMA_ADDRESS,
            credential: CREDENTIAL_ADDRESS,
            fields: ["jurisdiction", "eligibility_tier", "expiry_date"],
          },
        },
      },
    ],
    error: "Payment required",
  };

  return NextResponse.json(body, {
    status: 402,
    headers: { "X-Payment-Protocol": "x402" },
  });
}

// ── POST → verify credential + payment, then confirm ────────────────

export async function POST(req: NextRequest) {
  try {
    // ── 1. Parse request body ────────────────────────────────────────

    let paymentSignature: string | undefined;
    let lawyerWallet: string | undefined;
    let caseId: string | undefined;

    const contentType = req.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      const body = await req.json();
      paymentSignature = body.paymentSignature;
      lawyerWallet = body.lawyerWallet;
      caseId = body.caseId;
    }

    // Fall back to header for payment signature (x402 v2 compat)
    paymentSignature =
      paymentSignature ??
      req.headers.get("PAYMENT-SIGNATURE") ??
      req.headers.get("payment-signature") ??
      undefined;

    // Fall back to query params
    caseId = caseId ?? req.nextUrl.searchParams.get("caseId") ?? undefined;
    lawyerWallet =
      lawyerWallet ??
      req.nextUrl.searchParams.get("lawyerWallet") ??
      undefined;

    if (!paymentSignature) {
      return NextResponse.json(
        { error: "Missing paymentSignature in body or PAYMENT-SIGNATURE header" },
        { status: 400 }
      );
    }

    if (!lawyerWallet) {
      return NextResponse.json(
        { error: "Missing lawyerWallet in body or query params" },
        { status: 400 }
      );
    }

    // ── 2. Verify SAS credential ─────────────────────────────────────

    const credential = await verifyLawyerCredential(lawyerWallet);

    if (!credential.valid) {
      return NextResponse.json(
        {
          error: "Credential verification failed",
          detail: credential.error,
          lawyerWallet,
          schema: SCHEMA_ADDRESS,
          credential: CREDENTIAL_ADDRESS,
        },
        { status: 403 }
      );
    }

    // ── 3. Verify payment on-chain ───────────────────────────────────

    const connection = new Connection(getRpcUrl(), "confirmed");

    const tx = await connection.getTransaction(paymentSignature, {
      maxSupportedTransactionVersion: 0,
    });

    if (!tx) {
      return NextResponse.json(
        { error: "Transaction not found on devnet", txSignature: paymentSignature },
        { status: 404 }
      );
    }

    if (tx.meta?.err) {
      return NextResponse.json(
        {
          error: "Transaction failed on-chain",
          txSignature: paymentSignature,
          txError: tx.meta.err,
        },
        { status: 422 }
      );
    }

    const slot = await connection.getSlot();
    const age = slot - tx.slot;
    if (age > 600) {
      return NextResponse.json(
        { error: "Transaction too old", txSignature: paymentSignature, ageSlots: age },
        { status: 410 }
      );
    }

    // ── 4. Return success ────────────────────────────────────────────

    return NextResponse.json(
      {
        status: "paid",
        txSignature: paymentSignature,
        caseId: caseId ?? "CASE-UNKNOWN",
        network: NETWORK,
        recipient: RECIPIENT,
        amount: String(AMOUNT_USDC),
        asset: USDC.address,
        credential: {
          verified: true,
          lawyerWallet,
          jurisdiction: credential.jurisdiction,
          eligibilityTier: credential.eligibilityTier,
          expiryDate: credential.expiryDate,
        },
      },
      { status: 200 }
    );
  } catch (err: any) {
    return NextResponse.json(
      { error: "Verification failed", detail: err.message },
      { status: 500 }
    );
  }
}
