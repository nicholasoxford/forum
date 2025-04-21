import { createConnection, buyTokens, sellTokens } from "@/lib/vertigo";
import { PublicKey } from "@solana/web3.js";
import * as dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Pool and token addresses - replace with your actual addresses
const POOL_OWNER = "YOUR_POOL_OWNER_ADDRESS";
const TOKEN_MINT_A = "So11111111111111111111111111111111111111112"; // SOL mint
const TOKEN_MINT_B = "YOUR_TOKEN_MINT_ADDRESS";
const USER_ADDRESS = "YOUR_USER_ADDRESS";
const USER_TOKEN_A_WALLET = "YOUR_USER_SOL_WALLET";
const USER_TOKEN_B_WALLET = "YOUR_USER_TOKEN_WALLET";

async function main() {
  try {
    console.log("Testing Vertigo pool trading...");

    // Test buying tokens
    console.log("\n--- Testing Buy Tokens ---");
    const buyParams = {
      poolOwner: POOL_OWNER,
      mintA: TOKEN_MINT_A,
      mintB: TOKEN_MINT_B,
      userAddress: USER_ADDRESS,
      userTaA: USER_TOKEN_A_WALLET,
      userTaB: USER_TOKEN_B_WALLET,
      amount: 0.1, // Buy with 0.1 SOL
      slippageBps: 100, // 1% slippage tolerance
    };

    console.log("Buy parameters:", buyParams);
    console.log("Executing buy transaction via API...");

    const buyResponse = await fetch(
      "http://localhost:3000/api/vertigo/buy-tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(buyParams),
      }
    );

    const buyResult = await buyResponse.json();

    if (!buyResult.success) {
      throw new Error(`Failed to buy tokens: ${buyResult.error}`);
    }

    console.log("Buy transaction successful!");
    console.log("Transaction signature:", buyResult.signature);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${buyResult.signature}?cluster=devnet`
    );

    // Test selling tokens
    console.log("\n--- Testing Sell Tokens ---");
    const sellParams = {
      poolOwner: POOL_OWNER,
      mintA: TOKEN_MINT_A,
      mintB: TOKEN_MINT_B,
      userAddress: USER_ADDRESS,
      userTaA: USER_TOKEN_A_WALLET,
      userTaB: USER_TOKEN_B_WALLET,
      amount: 10, // Sell 10 tokens
      slippageBps: 100, // 1% slippage tolerance
    };

    console.log("Sell parameters:", sellParams);
    console.log("Executing sell transaction via API...");

    const sellResponse = await fetch(
      "http://localhost:3000/api/vertigo/sell-tokens",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sellParams),
      }
    );

    const sellResult = await sellResponse.json();

    if (!sellResult.success) {
      throw new Error(`Failed to sell tokens: ${sellResult.error}`);
    }

    console.log("Sell transaction successful!");
    console.log("Transaction signature:", sellResult.signature);
    console.log(
      `Transaction: https://explorer.solana.com/tx/${sellResult.signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("Error testing Vertigo pool trading:", error);
  }
}

main();
