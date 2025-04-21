import { createConnection, claimRoyalties } from "@/lib/vertigo";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Pool and token addresses - replace with your actual addresses
const POOL_ADDRESS = "YOUR_POOL_ADDRESS";
const TOKEN_MINT_A = "So11111111111111111111111111111111111111112"; // SOL mint
const RECEIVER_TOKEN_A_WALLET = "YOUR_RECEIVER_SOL_WALLET";
const OWNER_ADDRESS = "YOUR_OWNER_ADDRESS";

async function main() {
  try {
    console.log("Testing Vertigo pool royalty claiming...");

    // Test claiming royalties
    console.log("\n--- Testing Claim Royalties ---");
    const claimParams = {
      poolAddress: POOL_ADDRESS,
      mintA: TOKEN_MINT_A,
      receiverTaA: RECEIVER_TOKEN_A_WALLET,
      ownerAddress: OWNER_ADDRESS,
    };

    console.log("Claim parameters:", claimParams);
    console.log("Executing claim transaction via API...");

    const claimResponse = await fetch(
      "http://localhost:3000/api/vertigo/claim-royalties",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(claimParams),
      }
    );

    const claimResult = await claimResponse.json();

    if (!claimResult.success) {
      throw new Error(`Failed to claim royalties: ${claimResult.error}`);
    }

    console.log("Claim transaction successful!");
    console.log("Transaction signature:", claimResult.signature);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${claimResult.signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("Error testing Vertigo pool royalty claiming:", error);
  }
}

main();
