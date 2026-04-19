/**
 * Integration test: SAS credential + x402 payment flow.
 *
 * Prerequisites:
 *   1. cd app && npm run dev   (in a separate terminal)
 *   2. HELIUS_RPC_URL set in .env
 *   3. Schema + credential created on devnet (scripts/schema-address.json)
 */

import "dotenv/config";
import fs from "fs";
import path from "path";
import os from "os";
import { Keypair, PublicKey } from "@solana/web3.js";
import {
  createMint,
  getOrCreateAssociatedTokenAccount,
  mintTo,
  transferChecked,
  getAccount,
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
import { connection, payer } from "./lib/connection";

// ── Config ──────────────────────────────────────────────────────────

const API_BASE = process.env.API_BASE ?? "http://localhost:3000";
const ENDPOINT = `${API_BASE}/api/claim-payment`;
const DEVNET_RPC = "https://api.devnet.solana.com";
const USDC_DECIMALS = 6;
const CASE_ID = `CRED-${Date.now().toString().slice(-6)}`;

// SAS schema from Day 2
const schemaInfo = JSON.parse(
  fs.readFileSync(path.join(__dirname, "schema-address.json"), "utf-8")
);
const { schemaAddress, credentialAddress } = schemaInfo;

// ── Helpers ─────────────────────────────────────────────────────────

function step(n: number, label: string) {
  const pad = Math.max(1, 50 - label.length);
  console.log(`\n── Step ${n}: ${label} ${"─".repeat(pad)}`);
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

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║   SAS Credential + x402 Payment — Integration Test     ║");
  console.log("╚══════════════════════════════════════════════════════════╝");
  console.log();
  console.log("API endpoint:", ENDPOINT);
  console.log("Payer:       ", payer.publicKey.toBase58());
  console.log("Schema:      ", schemaAddress);
  console.log("Credential:  ", credentialAddress);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 1: Issue a fresh SAS credential to a "lawyer" keypair
  // ═══════════════════════════════════════════════════════════════════

  step(1, "issue SAS credential to lawyer");

  const sasRpc = createSolanaRpc(DEVNET_RPC);

  // Load issuer (government authority) from local keypair
  const secretKey = new Uint8Array(
    JSON.parse(
      fs.readFileSync(
        path.join(os.homedir(), ".config", "solana", "id.json"),
        "utf-8"
      )
    )
  );
  const issuer = await createKeyPairSignerFromBytes(secretKey);
  console.log("  Issuer:   ", issuer.address);

  // Generate a fresh lawyer identity
  const lawyerSigner = await generateKeyPairSigner();
  const lawyerWallet = String(lawyerSigner.address);
  console.log("  Lawyer:   ", lawyerWallet);

  // Fetch schema and serialize credential data
  const schema = await fetchSchema(sasRpc, schemaAddress);
  const oneYearFromNow = Math.floor(Date.now() / 1000) + 365 * 24 * 60 * 60;
  const attestationData = serializeAttestationData(schema.data, {
    jurisdiction: "DE",
    eligibility_tier: "TIER_1",
    expiry_date: BigInt(oneYearFromNow),
  });

  // Derive attestation PDA using lawyer wallet as nonce
  const [attestationAddress] = await deriveAttestationPda({
    credential: credentialAddress,
    schema: schemaAddress,
    nonce: lawyerSigner.address,
  });
  console.log("  Attestation PDA:", attestationAddress);

  // Build and send createAttestation tx
  const createAttestationIx = getCreateAttestationInstruction({
    payer: issuer,
    authority: issuer,
    credential: credentialAddress,
    schema: schemaAddress,
    attestation: attestationAddress,
    nonce: lawyerSigner.address,
    data: attestationData,
    expiry: BigInt(oneYearFromNow),
  });

  const { value: blockhash } = await sasRpc.getLatestBlockhash().send();
  const txMsg = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(issuer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(blockhash, tx),
    (tx) => appendTransactionMessageInstruction(createAttestationIx, tx)
  );

  console.log("  Sending attestation tx...");
  const credTxSig = await sendSasTx(sasRpc, txMsg);
  console.log("  Credential tx:", credTxSig);
  console.log(
    "  Expiry:       ",
    new Date(oneYearFromNow * 1000).toISOString()
  );

  // ═══════════════════════════════════════════════════════════════════
  // STEP 2: Set up mock USDC on devnet
  // ═══════════════════════════════════════════════════════════════════

  step(2, "set up devnet mock USDC");

  const usdcMint = await createMint(
    connection,
    payer,
    payer.publicKey,
    null,
    USDC_DECIMALS
  );
  console.log("  Mock USDC mint:", usdcMint.toBase58());

  const payerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    payer.publicKey
  );

  // Lawyer ATA (for the credentialed lawyer)
  const lawyerPubkey = new PublicKey(lawyerWallet);
  const lawyerAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    lawyerPubkey
  );

  // Mint 1000 USDC
  const mintAmount = 1000 * 10 ** USDC_DECIMALS;
  await mintTo(connection, payer, usdcMint, payerAta.address, payer, mintAmount);

  const payerBefore = Number(
    (await getAccount(connection, payerAta.address)).amount
  );
  console.log("  Payer balance: ", payerBefore / 10 ** USDC_DECIMALS, "USDC");

  // ═══════════════════════════════════════════════════════════════════
  // STEP 3: GET /api/claim-payment → 402
  // ═══════════════════════════════════════════════════════════════════

  step(3, "GET /api/claim-payment (402)");

  const getRes = await fetch(ENDPOINT);
  console.log("  HTTP status:", getRes.status);
  if (getRes.status !== 402) {
    throw new Error(
      `Expected 402, got ${getRes.status}. Is the dev server running?`
    );
  }

  const paymentReq: any = await getRes.json();
  const transferAmount = Number(paymentReq.accepts[0].amount);
  console.log("  Amount:      ", transferAmount, "atomic");
  console.log("  Required credential:", paymentReq.accepts[0].extra?.requiredCredential?.provider);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 4: Execute USDC transfer (credentialed lawyer)
  // ═══════════════════════════════════════════════════════════════════

  step(4, "USDC transfer → credentialed lawyer");

  const transferSig1 = await transferChecked(
    connection,
    payer,
    payerAta.address,
    usdcMint,
    lawyerAta.address,
    payer,
    transferAmount,
    USDC_DECIMALS
  );
  console.log("  Transfer tx:", transferSig1);
  await sleep(2000);

  // ═══════════════════════════════════════════════════════════════════
  // STEP 5: POST with credentialed lawyer → expect 200
  // ═══════════════════════════════════════════════════════════════════

  step(5, "POST credentialed lawyer (expect 200)");

  const postRes1 = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentSignature: transferSig1,
      lawyerWallet,
      caseId: CASE_ID,
    }),
  });

  console.log("  HTTP status:", postRes1.status);
  const body1: any = await postRes1.json();
  console.log("  Response:", JSON.stringify(body1, null, 4));

  const credentialedPass = postRes1.status === 200;

  // ═══════════════════════════════════════════════════════════════════
  // STEP 6: Generate uncredentialed wallet
  // ═══════════════════════════════════════════════════════════════════

  step(6, "test uncredentialed wallet (expect 403)");

  const fakeWallet = Keypair.generate();
  console.log("  Uncredentialed wallet:", fakeWallet.publicKey.toBase58());

  // Create ATA for the fake wallet and transfer USDC
  const fakeAta = await getOrCreateAssociatedTokenAccount(
    connection,
    payer,
    usdcMint,
    fakeWallet.publicKey
  );

  const transferSig2 = await transferChecked(
    connection,
    payer,
    payerAta.address,
    usdcMint,
    fakeAta.address,
    payer,
    transferAmount,
    USDC_DECIMALS
  );
  console.log("  Transfer tx:", transferSig2);
  await sleep(2000);

  // POST with uncredentialed wallet
  const postRes2 = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paymentSignature: transferSig2,
      lawyerWallet: fakeWallet.publicKey.toBase58(),
      caseId: CASE_ID,
    }),
  });

  console.log("  HTTP status:", postRes2.status);
  const body2: any = await postRes2.json();
  console.log("  Response:", JSON.stringify(body2, null, 4));

  const uncredentialedPass = postRes2.status === 403;

  // ═══════════════════════════════════════════════════════════════════
  // STEP 7: Final balance verification
  // ═══════════════════════════════════════════════════════════════════

  step(7, "verify final balances");

  const payerFinal = Number(
    (await getAccount(connection, payerAta.address)).amount
  );
  const lawyerFinal = Number(
    (await getAccount(connection, lawyerAta.address)).amount
  );
  const fakeFinal = Number(
    (await getAccount(connection, fakeAta.address)).amount
  );

  const payerUSDC = payerFinal / 10 ** USDC_DECIMALS;
  const lawyerUSDC = lawyerFinal / 10 ** USDC_DECIMALS;
  const fakeUSDC = fakeFinal / 10 ** USDC_DECIMALS;

  console.log(`  Payer:              ${payerUSDC} USDC  (started: 1000)`);
  console.log(`  Credentialed lawyer: ${lawyerUSDC} USDC  (started: 0)`);
  console.log(`  Uncredentialed:     ${fakeUSDC} USDC  (started: 0)`);

  // ═══════════════════════════════════════════════════════════════════
  // Results
  // ═══════════════════════════════════════════════════════════════════

  console.log("\n");
  console.log("╔══════════════════════════════════════════════════════════╗");
  console.log("║                     RESULTS                            ║");
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║  Credentialed lawyer:   ${credentialedPass ? "PASS (200)" : "FAIL"}${" ".repeat(credentialedPass ? 26 : 32)}║`
  );
  console.log(
    `║  Uncredentialed wallet: ${uncredentialedPass ? "PASS (403)" : "FAIL"}${" ".repeat(uncredentialedPass ? 26 : 32)}║`
  );
  console.log("╠══════════════════════════════════════════════════════════╣");
  console.log(
    `║  Payer balance:         ${String(payerUSDC).padEnd(10)} USDC (was 1000)   ║`
  );
  console.log(
    `║  Lawyer balance:        ${String(lawyerUSDC).padEnd(10)} USDC (was 0)     ║`
  );
  console.log(
    `║  Fake balance:          ${String(fakeUSDC).padEnd(10)} USDC (was 0)     ║`
  );
  console.log("╚══════════════════════════════════════════════════════════╝");

  // Save results
  const results = {
    caseId: CASE_ID,
    credentialedLawyer: {
      wallet: lawyerWallet,
      attestationAddress: String(attestationAddress),
      credentialTx: credTxSig,
      transferTx: transferSig1,
      httpStatus: postRes1.status,
      pass: credentialedPass,
      response: body1,
    },
    uncredentialedWallet: {
      wallet: fakeWallet.publicKey.toBase58(),
      transferTx: transferSig2,
      httpStatus: postRes2.status,
      pass: uncredentialedPass,
      response: body2,
    },
    balances: {
      payer: payerUSDC,
      lawyer: lawyerUSDC,
      fake: fakeUSDC,
    },
    mockUsdcMint: usdcMint.toBase58(),
  };

  const outPath = path.join(__dirname, "payment-credential-test-info.json");
  fs.writeFileSync(outPath, JSON.stringify(results, null, 2));
  console.log(`\nSaved to ${outPath}`);

  if (!credentialedPass || !uncredentialedPass) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error("\nError:", err.message ?? err);
  console.error(
    "\nMake sure the Next.js dev server is running: cd app && npm run dev"
  );
  process.exit(1);
});
