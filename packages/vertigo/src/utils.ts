import * as anchor from "@coral-xyz/anchor";
import { Connection } from "@solana/web3.js";
import { VertigoSDK } from "@vertigo-amm/vertigo-sdk/";
import { getPayerKeypair } from "@workspace/solana";

// Helper function to create Vertigo SDK instance
export function createVertigoSDK(connection: Connection): VertigoSDK {
  const payer = getPayerKeypair();
  const wallet = new anchor.Wallet(payer);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  try {
    return new VertigoSDK(provider);
  } catch (error) {
    console.error("Error creating VertigoSDK:", error);
    throw error;
  }
}
