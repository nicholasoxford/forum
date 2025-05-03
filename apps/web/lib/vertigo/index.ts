import * as anchor from "@coral-xyz/anchor";
import { Connection, Keypair } from "@solana/web3.js";
import { VertigoSDK } from "@vertigo-amm/vertigo-sdk/";
import bs58 from "bs58";
// Configuration
const VERTIGO_CONFIG = {
  FEE_WALLET: process.env.VERTIGO_SECRET_KEY || "",
  PAYER_PRIVATE_KEY: process.env.VERTIGO_SECRET_KEY || "",
};

// Helper function to get payer keypair
export function getPayerKeypair(): Keypair {
  if (!VERTIGO_CONFIG.PAYER_PRIVATE_KEY) {
    throw new Error("PAYER_PRIVATE_KEY is not set");
  }
  const secretKey = bs58.decode(VERTIGO_CONFIG.PAYER_PRIVATE_KEY);
  return Keypair.fromSecretKey(secretKey);
}

// Helper function to create Vertigo SDK instance
function createVertigoSDK(connection: Connection): VertigoSDK {
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

// Helper function to create a connection
export async function createConnection(): Promise<Connection> {
  return new Connection(
    process.env.RPC_URL || "https://api.devnet.solana.com",
    {
      commitment: "confirmed",
      confirmTransactionInitialTimeout: 60000, // 60 seconds timeout for confirmation
    }
  );
  // return new Connection(
  //   process.env.RPC_URL || 'https://api.mainnet-beta.solana.com'
  // )
}

export * from "./vertigo-utils";
export * from "./vertigo-claim";
