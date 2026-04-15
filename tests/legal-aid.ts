import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LegalAid } from "../target/types/legal_aid";
import { Keypair, PublicKey } from "@solana/web3.js";
import { createHash } from "crypto";
import { expect } from "chai";

describe("legal-aid full flow", () => {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.legalAid as Program<LegalAid>;
  const authority = provider.wallet;

  // Use a unique suffix so PDAs don't collide across devnet runs
  const suffix = Date.now().toString().slice(-6);
  const jurisdiction = "DE";
  const caseId = `CASE-${suffix}`;

  const lawyerKeypair = Keypair.generate();

  const documentHash = Array.from(
    createHash("sha256").update("test document").digest()
  ) as number[];

  // Derive PDAs
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config"), Buffer.from(jurisdiction)],
    program.programId
  );
  const [casePda] = PublicKey.findProgramAddressSync(
    [Buffer.from("case"), Buffer.from(caseId)],
    program.programId
  );

  // Lawyer keypair only signs anchor_document — provider wallet pays all fees,
  // so no airdrop needed.

  it("1. initialize — creates ProgramConfig", async () => {
    const tx = await program.methods
      .initialize(jurisdiction)
      .accounts({
        authority: authority.publicKey,
      })
      .rpc();
    console.log("  initialize tx:", tx);

    const config = await program.account.programConfig.fetch(configPda);
    expect(config.authority.toBase58()).to.equal(
      authority.publicKey.toBase58()
    );
    expect(config.jurisdiction).to.equal(jurisdiction);
    expect(config.totalCases.toNumber()).to.equal(0);
  });

  it("2. open_case — creates CaseFile with status Open", async () => {
    const tx = await program.methods
      .openCase(caseId, lawyerKeypair.publicKey)
      .accounts({
        config: configPda,
        authority: authority.publicKey,
      })
      .rpc();
    console.log("  open_case tx:", tx);

    const caseFile = await program.account.caseFile.fetch(casePda);
    expect(caseFile.caseId).to.equal(caseId);
    expect(caseFile.lawyer.toBase58()).to.equal(
      lawyerKeypair.publicKey.toBase58()
    );
    expect(JSON.stringify(caseFile.status)).to.equal(
      JSON.stringify({ open: {} })
    );
    expect(caseFile.createdAt.toNumber()).to.be.greaterThan(0);
    expect(caseFile.updatedAt.toNumber()).to.be.greaterThan(0);

    // total_cases should be 1
    const config = await program.account.programConfig.fetch(configPda);
    expect(config.totalCases.toNumber()).to.equal(1);
  });

  it("3. anchor_document — stores hash, status InProgress", async () => {
    const tx = await program.methods
      .anchorDocument(caseId, documentHash)
      .accounts({
        caseFile: casePda,
        lawyer: lawyerKeypair.publicKey,
      })
      .signers([lawyerKeypair])
      .rpc();
    console.log("  anchor_document tx:", tx);

    const caseFile = await program.account.caseFile.fetch(casePda);
    expect(JSON.stringify(caseFile.status)).to.equal(
      JSON.stringify({ inProgress: {} })
    );
    expect(Array.from(caseFile.documentHash)).to.deep.equal(documentHash);
    expect(caseFile.updatedAt.toNumber()).to.be.greaterThanOrEqual(
      caseFile.createdAt.toNumber()
    );
  });

  it("4. close_case — status Closed", async () => {
    const tx = await program.methods
      .closeCase(caseId)
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: authority.publicKey,
      })
      .rpc();
    console.log("  close_case tx:", tx);

    const caseFile = await program.account.caseFile.fetch(casePda);
    expect(JSON.stringify(caseFile.status)).to.equal(
      JSON.stringify({ closed: {} })
    );
    expect(caseFile.updatedAt.toNumber()).to.be.greaterThanOrEqual(
      caseFile.createdAt.toNumber()
    );
  });

  it("5. mark_paid — status Paid", async () => {
    const tx = await program.methods
      .markPaid(caseId)
      .accounts({
        config: configPda,
        caseFile: casePda,
        authority: authority.publicKey,
      })
      .rpc();
    console.log("  mark_paid tx:", tx);

    const caseFile = await program.account.caseFile.fetch(casePda);
    expect(JSON.stringify(caseFile.status)).to.equal(
      JSON.stringify({ paid: {} })
    );
    expect(caseFile.updatedAt.toNumber()).to.be.greaterThanOrEqual(
      caseFile.createdAt.toNumber()
    );
  });
});
