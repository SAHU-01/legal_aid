/**
 * Create real test cases on devnet for the automation agent.
 *
 * Creates 3 cases (A=Closed, B=Closed, C=InProgress), issues SAS
 * credentials to 2 fresh lawyer keypairs, and funds USDC.
 *
 * Run:  npx ts-node scripts/create-test-cases.ts
 */

import "dotenv/config";
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import {
  getOrCreateAssociatedTokenAccount,
} from "@solana/spl-token";
import {
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  generateKeyPairSigner,
  pipe,
  createTransactionMessage,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  appendTransactionMessageInstruction,
  signTransactionMessageWithSigners,
  getBase64EncodedWireTransaction,
} from "@solana/kit";
import {
  getCreateAttestationInstruction,
  deriveAttestationPda,
  fetchSchema,
  serializeAttestationData,
} from "sas-lib";
import fs from "fs";
import path from "path";
import os from "os";

import { HELIUS_RPC_URL, connection, payer } from "./lib/connection";
import { getOrCreateUsdcMint, fundUsdcAccount } from "./lib/setup-usdc";
import { scanProgramConfigs } from "./lib/case-scanner";

import type { LegalAid } from "../target/types/legal_aid";

// ── Constants ──────────────────────────────────────────────────────

const PROGRAM_ID = new PublicKey(
  "3f1yBTY6xb6ESdzzb9LxAozv7uVsj9Y9AMEpnAwKJRNV"
);
const DEVNET_RPC = "https://api.devnet.solana.com";
const JURISDICTION = "DE";

// SAS schema from Day 2
const schemaInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "schema-address.json"), "utf-8")
);
const { schemaAddress, credentialAddress } = schemaInfo;

// Unique suffix so PDA seeds don't collide across runs
const suffix = Date.now().toString().slice(-6);

// ── Helpers ─────────────────────────────────────────────────────────

function step(n: number, label: string) {
  const pad = Math.max(1, 50 - label.length);
  console.log(`\n── Step ${n}: ${label} ${"─".repeat(pad)}`);
}

function explorerTx(sig: string): string {
  return `https://explorer.solana.com/tx/${sig}?cluster=devnet`;
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function sendSasTx(rpc: any, txMessage: any): Promise<string> {
  const signedTx = await signTransactionMessageWithSigners(txMessage);
  const base64Tx = getBase64EncodedWireTransaction(signedTx);
  const sig = await rpc
    .sendTransaction(base64Tx, { encoding: "base64" })
    .send();
  for (let i = 0; i < 30; i++) {
    const status = await rpc.getSignatureStatuses([sig]).send();
    const val = status.value[0];
    if (
      val &&
      (val.confirmationStatus === "confirmed" ||
        val.confirmationStatus === "finalized")
    ) {
      return String(sig);
    }
    await sleep(2000);
  }
  console.warn("  Warning: SAS tx not confirmed within timeout");
  return String(sig);
}

function docHash(content: string): { hex: string; array: number[] } {
  const bytes = createHash("sha256").update(content).digest();
  return { hex: bytes.toString("hex"), array: Array.from(bytes) };
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║     Create Test Cases for Legal-Aid Agent               ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log("Authority:  ", payer.publicKey.toBase58());
  console.log("Schema:     ", schemaAddress);
  console.log("Credential: ", credentialAddress);
  console.log("Suffix:     ", suffix);

  // ═══════════════════════════════════════════════════════════════════
  // Set up Anchor program
  // ═══════════════════════════════════════════════════════════════════

  const idl = JSON.parse(
    fs.readFileSync(
      path.join(__dirname, "..", "target", "idl", "legal_aid.json"),
      "utf-8"
    )
  );
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
  const program = new Program<LegalAid>(idl, provider);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Generate 2 fresh lawyer keypairs
  // ═══════════════════════════════════════════════════════════════════

  step(1, "generate lawyer keypairs");

  const lawyer1 = Keypair.generate();
  const lawyer2 = Keypair.generate();
  console.log("  Lawyer 1:", lawyer1.publicKey.toBase58());
  console.log("  Lawyer 2:", lawyer2.publicKey.toBase58());

  // Save keypairs so they can be referenced later
  const dataDir = path.join(__dirname, "data");
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  const lawyer1Path = path.join(dataDir, `lawyer1-${suffix}.json`);
  const lawyer2Path = path.join(dataDir, `lawyer2-${suffix}.json`);
  fs.writeFileSync(lawyer1Path, JSON.stringify(Array.from(lawyer1.secretKey)));
  fs.writeFileSync(lawyer2Path, JSON.stringify(Array.from(lawyer2.secretKey)));
  console.log("  Saved keypairs to scripts/data/");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Issue SAS credentials to both lawyers
  // ═══════════════════════════════════════════════════════════════════

  step(2, "issue SAS credentials");

  const sasRpc = createSolanaRpc(DEVNET_RPC);

  // Load issuer (same as authority / payer)
  const secretKey = new Uint8Array(
    JSON.parse(
      fs.readFileSync(
        path.join(os.homedir(), ".config", "solana", "id.json"),
        "utf-8"
      )
    )
  );
  const issuer = await createKeyPairSignerFromBytes(secretKey);
  console.log("  Issuer:", issuer.address);

  // Fetch schema once
  const schema = await fetchSchema(sasRpc, schemaAddress);
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;

  // Issue credential to each lawyer
  const credentialTxSigs: Record<string, string> = {};
  const attestationAddresses: Record<string, string> = {};

  for (const [label, lawyerKp] of [
    ["lawyer1", lawyer1],
    ["lawyer2", lawyer2],
  ] as const) {
    // generateKeyPairSigner creates a @solana/kit signer, but we need the
    // lawyer's address for the nonce. Since we have a web3.js Keypair, we
    // use the base58 pubkey directly as the nonce address.
    const lawyerAddress = lawyerKp.publicKey.toBase58();

    const attestationData = serializeAttestationData(schema.data, {
      jurisdiction: JURISDICTION,
      eligibility_tier: "TIER_1",
      expiry_date: BigInt(oneYearFromNow),
    });

    const [attestationAddr] = await deriveAttestationPda({
      credential: credentialAddress,
      schema: schemaAddress,
      nonce: lawyerAddress as any,
    });
    attestationAddresses[label] = String(attestationAddr);

    const createAttIx = getCreateAttestationInstruction({
      payer: issuer,
      authority: issuer,
      credential: credentialAddress,
      schema: schemaAddress,
      attestation: attestationAddr,
      nonce: lawyerAddress as any,
      data: attestationData,
      expiry: BigInt(oneYearFromNow),
    });

    const { value: blockhash } = await sasRpc.getLatestBlockhash().send();
    const txMsg = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(issuer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
      (tx) => appendTransactionMessageInstruction(createAttIx, tx)
    );

    console.log(`  Issuing credential to ${label}...`);
    const sig = await sendSasTx(sasRpc, txMsg);
    credentialTxSigs[label] = sig;
    console.log(`  ${label} credential tx: ${sig}`);
    console.log(`  ${label} attestation:   ${attestationAddr}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: Initialize jurisdiction (skip if exists)
  // ═══════════════════════════════════════════════════════════════════

  step(3, `initialize jurisdiction "${JURISDICTION}"`);

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(JURISDICTION)],
    PROGRAM_ID
  );

  // Check if config PDA already exists
  const existingConfigs = await scanProgramConfigs(connection, program);
  const configExists = existingConfigs.some(
    (c) => c.account.jurisdiction === JURISDICTION
  );

  let initTxSig: string | null = null;
  if (configExists) {
    console.log(`  Config PDA for "${JURISDICTION}" already exists, skipping`);
  } else {
    initTxSig = await program.methods
      .initialize(JURISDICTION)
      .accounts({ authority: payer.publicKey })
      .rpc();
    console.log("  tx:", initTxSig);
  }
  console.log("  Config PDA:", configPda.toBase58());

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Create 3 cases
  // ═══════════════════════════════════════════════════════════════════

  const caseA_id = `AGENT-TEST-A-${suffix}`;
  const caseB_id = `AGENT-TEST-B-${suffix}`;
  const caseC_id = `AGENT-TEST-C-${suffix}`;

  const hashA = docHash("Agent test document A");
  const hashB = docHash("Agent test document B");
  const hashC = docHash("Agent test document C");

  const cases = [
    { id: caseA_id, hash: hashA, lawyer: lawyer1, label: "Case A", close: true },
    { id: caseB_id, hash: hashB, lawyer: lawyer2, label: "Case B", close: true },
    { id: caseC_id, hash: hashC, lawyer: lawyer1, label: "Case C", close: false },
  ];

  const caseTxSigs: Record<string, Record<string, string>> = {};

  for (const c of cases) {
    step(4, `${c.label} — ${c.id}`);
    caseTxSigs[c.id] = {};

    const [casePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("case"), Buffer.from(c.id)],
      PROGRAM_ID
    );
    console.log("  Case PDA:", casePda.toBase58());

    // open_case
    console.log("  Opening case...");
    caseTxSigs[c.id].openCase = await program.methods
      .openCase(c.id, c.lawyer.publicKey)
      .accounts({
        config: configPda,
        authority: payer.publicKey,
      } as any)
      .rpc();
    console.log("  open_case tx: ", caseTxSigs[c.id].openCase);

    // anchor_document
    console.log("  Anchoring document...");
    caseTxSigs[c.id].anchorDoc = await program.methods
      .anchorDocument(c.id, c.hash.array)
      .accounts({
        caseFile: casePda,
        lawyer: c.lawyer.publicKey,
      } as any)
      .signers([c.lawyer])
      .rpc();
    console.log("  anchor_doc tx:", caseTxSigs[c.id].anchorDoc);
    console.log("  doc hash:     ", c.hash.hex);

    if (c.close) {
      // close_case
      console.log("  Closing case...");
      caseTxSigs[c.id].closeCase = await program.methods
        .closeCase(c.id)
        .accounts({
          config: configPda,
          caseFile: casePda,
          authority: payer.publicKey,
        } as any)
        .rpc();
      console.log("  close_case tx:", caseTxSigs[c.id].closeCase);
      console.log("  Status: Closed (agent should pick this up)");
    } else {
      console.log("  Status: InProgress (agent should IGNORE this)");
    }
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: Set up USDC for the test
  // ═══════════════════════════════════════════════════════════════════

  step(5, "set up USDC");

  const { mint: usdcMint } = await getOrCreateUsdcMint();
  console.log("  USDC mint:", usdcMint.toBase58());

  // Fund authority with 10,000 USDC
  console.log("  Funding authority with 10,000 USDC...");
  await fundUsdcAccount(usdcMint, payer.publicKey, 10_000);

  // Create ATAs for both lawyers
  for (const [label, kp] of [
    ["Lawyer 1", lawyer1],
    ["Lawyer 2", lawyer2],
  ] as const) {
    const ata = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      usdcMint,
      kp.publicKey
    );
    console.log(`  ${label} ATA: ${ata.address.toBase58()}`);
  }

  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: Save results
  // ═══════════════════════════════════════════════════════════════════

  step(6, "save test info");

  const result = {
    createdAt: new Date().toISOString(),
    suffix,
    jurisdiction: JURISDICTION,
    configPda: configPda.toBase58(),
    initializeTx: initTxSig,
    usdcMint: usdcMint.toBase58(),
    lawyers: {
      lawyer1: {
        publicKey: lawyer1.publicKey.toBase58(),
        keypairPath: lawyer1Path,
        attestationAddress: attestationAddresses.lawyer1,
        credentialTx: credentialTxSigs.lawyer1,
      },
      lawyer2: {
        publicKey: lawyer2.publicKey.toBase58(),
        keypairPath: lawyer2Path,
        attestationAddress: attestationAddresses.lawyer2,
        credentialTx: credentialTxSigs.lawyer2,
      },
    },
    cases: {
      caseA: {
        caseId: caseA_id,
        lawyer: lawyer1.publicKey.toBase58(),
        documentHash: hashA.hex,
        status: "Closed",
        agentShouldProcess: true,
        txSigs: caseTxSigs[caseA_id],
      },
      caseB: {
        caseId: caseB_id,
        lawyer: lawyer2.publicKey.toBase58(),
        documentHash: hashB.hex,
        status: "Closed",
        agentShouldProcess: true,
        txSigs: caseTxSigs[caseB_id],
      },
      caseC: {
        caseId: caseC_id,
        lawyer: lawyer1.publicKey.toBase58(),
        documentHash: hashC.hex,
        status: "InProgress",
        agentShouldProcess: false,
        txSigs: caseTxSigs[caseC_id],
      },
    },
    sasSchema: {
      schemaAddress,
      credentialAddress,
    },
    expected:
      "Agent processes cases A and B (Closed), skips case C (InProgress)",
  };

  const outPath = path.join(dataDir, "test-cases-info.json");
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(`  Saved to ${outPath}`);

  // ═══════════════════════════════════════════════════════════════════
  // Summary
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                    SUMMARY                             ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(`║  Case A: ${caseA_id.padEnd(30)} Closed    ║`);
  console.log(`║  Case B: ${caseB_id.padEnd(30)} Closed    ║`);
  console.log(`║  Case C: ${caseC_id.padEnd(30)} InProgress║`);
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log("║  Agent should process A + B, skip C                    ║");
  console.log("╚══════════════════════════════════════════════════════════╝");

  console.log("\n── Explorer Links ──────────────────────────────────────");
  for (const c of cases) {
    console.log(`  ${c.label}:`);
    const sigs = caseTxSigs[c.id];
    for (const [k, v] of Object.entries(sigs)) {
      console.log(`    ${k}: ${explorerTx(v)}`);
    }
  }

  console.log("\nNow run the agent:  npx ts-node scripts/agent.ts");
}

main().catch((err) => {
  console.error("\nError:", err.message ?? err);
  process.exit(1);
});
