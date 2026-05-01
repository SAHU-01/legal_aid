"use client";

import { useEffect, useState } from "react";
import { createSolanaRpc, address } from "@solana/kit";
import {
  deriveAttestationPda,
  fetchMaybeAttestation,
  fetchSchema,
  deserializeAttestationData,
} from "sas-lib";

const CREDENTIAL_ADDRESS = "4chJRmgzUcbDCgmcToYmNZdMjdNgEK3jktZMo1SUdy9o";
const SCHEMA_ADDRESS = "7uKMGSgup1UZ26MnptCCMCac6rqpe6vBNXET338cDeid";

const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC_URL || "https://api.devnet.solana.com";

type CredentialState =
  | { status: "loading" }
  | {
      status: "verified";
      jurisdiction: string;
      tier: string;
      expires: string;
      issuer: string;
    }
  | { status: "not_found" }
  | { status: "invalid"; reason: string };

function truncateAddress(addr: string): string {
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
}

export default function CredentialStatus({
  walletAddress,
}: {
  walletAddress: string;
}) {
  const [state, setState] = useState<CredentialState>({ status: "loading" });

  useEffect(() => {
    let cancelled = false;

    async function check() {
      try {
        // Separate @solana/kit RPC — do not mix with wallet-adapter's v1 Connection
        const rpc = createSolanaRpc(HELIUS_RPC);

        const nonce = address(walletAddress);
        const credential = address(CREDENTIAL_ADDRESS);
        const schema = address(SCHEMA_ADDRESS);

        const [attestationAddr] = await deriveAttestationPda({
          credential,
          schema,
          nonce,
        });

        const maybe = await fetchMaybeAttestation(rpc, attestationAddr);
        if (cancelled) return;

        if (!maybe.exists) {
          setState({ status: "not_found" });
          return;
        }

        const attestation = maybe.data;

        const schemaAccount = await fetchSchema(rpc, schema);
        const decoded = deserializeAttestationData<{
          jurisdiction: string;
          eligibility_tier: string;
          expiry_date: bigint;
        }>(schemaAccount.data, Uint8Array.from(attestation.data));

        if (cancelled) return;

        const now = Math.floor(Date.now() / 1000);
        const expiryTs = Number(decoded.expiry_date);

        if (expiryTs <= now) {
          setState({ status: "invalid", reason: "Expired" });
          return;
        }

        setState({
          status: "verified",
          jurisdiction: decoded.jurisdiction,
          tier: decoded.eligibility_tier,
          expires: new Date(expiryTs * 1000).toISOString().split("T")[0],
          issuer: truncateAddress(String(attestation.signer)),
        });
      } catch {
        if (!cancelled) setState({ status: "not_found" });
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [walletAddress]);

  if (state.status === "loading") {
    return (
      <div className="flex items-center gap-2 text-sm text-zinc-400">
        <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-600 border-t-zinc-300" />
        Checking credential…
      </div>
    );
  }

  if (state.status === "verified") {
    return (
      <div className="space-y-1.5">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-400">
          <span>✓</span> Credential Verified
        </p>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm text-zinc-300">
          <dt className="text-zinc-500">Jurisdiction</dt>
          <dd>{state.jurisdiction}</dd>
          <dt className="text-zinc-500">Tier</dt>
          <dd>{state.tier}</dd>
          <dt className="text-zinc-500">Expires</dt>
          <dd>{state.expires}</dd>
          <dt className="text-zinc-500">Issuer</dt>
          <dd className="font-mono">{state.issuer}</dd>
        </dl>
      </div>
    );
  }

  if (state.status === "invalid") {
    return (
      <div className="space-y-1">
        <p className="flex items-center gap-2 text-sm font-medium text-red-400">
          <span>✗</span> Credential Invalid
        </p>
        <p className="text-sm text-zinc-400">
          Status: {state.reason}
        </p>
        <p className="text-sm text-zinc-500">
          Contact issuer for renewal.
        </p>
      </div>
    );
  }

  // not_found
  return (
    <div className="space-y-1">
      <p className="flex items-center gap-2 text-sm font-medium text-yellow-400">
        <span>⚠</span> No Credential Found
      </p>
      <p className="text-sm text-zinc-400">
        Your wallet does not have a legal aid credential.
      </p>
      <p className="text-sm text-zinc-500">
        Contact your court or NGO to get verified.
      </p>
    </div>
  );
}
