import { Connection, Keypair } from "@solana/web3.js";
import bs58 from "bs58";
// Helper function to get payer keypair
export function getPayerKeypair(): Keypair {
  if (!process.env.VERTIGO_SECRET_KEY) {
    throw new Error("PAYER_PRIVATE_KEY is not set");
  }
  const secretKey = bs58.decode(process.env.VERTIGO_SECRET_KEY);
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Creates a connection to the Solana network.
 * Consider moving this to a shared utility if used elsewhere.
 */
export async function createSolanaConnection(): Promise<Connection> {
  const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
  return new Connection(RPC_URL, "confirmed");
}
