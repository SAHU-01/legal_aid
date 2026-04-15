import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { LegalAid } from "../target/types/legal_aid";

describe("legal-aid", () => {
  anchor.setProvider(anchor.AnchorProvider.env());

  const program = anchor.workspace.legalAid as Program<LegalAid>;

  it("Is initialized!", async () => {
    const tx = await program.methods.initialize().rpc();
    console.log("Your transaction signature", tx);
  });
});
