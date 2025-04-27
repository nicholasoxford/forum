import { createConnection, claimRoyalties } from "@/lib/vertigo";
import {
  ActionPostResponse,
  ACTIONS_CORS_HEADERS,
  BLOCKCHAIN_IDS,
} from "@solana/actions";
import { PublicKey } from "@solana/web3.js";
import { NextRequest } from "next/server";
import {
  NATIVE_MINT,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";

// Set blockchain (mainnet or devnet)
const blockchain =
  process.env.NEXT_PUBLIC_NETWORK === "devnet"
    ? BLOCKCHAIN_IDS.devnet
    : BLOCKCHAIN_IDS.mainnet;

// Headers for the Actions API
const headers = {
  ...ACTIONS_CORS_HEADERS,
  "x-blockchain-ids": blockchain,
  "x-action-version": "2.4",
};

// OPTIONS endpoint for CORS
export const OPTIONS = async () => {
  return new Response(null, { headers });
};

export async function POST(req: NextRequest) {
  try {
    console.log("Claiming royalties from Vertigo pool...");

    // Parse request parameters
    const url = new URL(req.url);
    const poolAddress = url.searchParams.get("poolAddress");
    const mintA = url.searchParams.get("mintA") || NATIVE_MINT.toString(); // Default to SOL native mint

    // Get user public key from request body
    const requestBody = await req.json();
    const ownerAddress = requestBody.account;

    // Validate required parameters
    if (!poolAddress || !ownerAddress) {
      return new Response(
        JSON.stringify({ error: "Missing required parameters" }),
        { status: 400, headers }
      );
    }

    // Set up the connection
    const connection = await createConnection();

    // Verify the pool exists
    try {
      const poolInfo = await connection.getAccountInfo(
        new PublicKey(poolAddress)
      );
      if (!poolInfo) {
        return new Response(
          JSON.stringify({
            error: "Invalid pool address: Pool does not exist",
          }),
          { status: 400, headers }
        );
      }
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Failed to verify pool address" }),
        { status: 400, headers }
      );
    }

    // Calculate the associated token account for the user's wallet
    const userPublicKey = new PublicKey(ownerAddress);
    const mintPublicKey = new PublicKey(mintA);

    // Calculate the proper associated token account
    const receiverTaA = getAssociatedTokenAddressSync(
      mintPublicKey,
      userPublicKey,
      false,
      TOKEN_PROGRAM_ID
    ).toString();

    console.log(`Using receiver token account: ${receiverTaA}`);

    // Try to get token account info to verify it exists
    try {
      const accountInfo = await connection.getAccountInfo(
        new PublicKey(receiverTaA)
      );
      if (!accountInfo) {
        return new Response(
          JSON.stringify({
            error:
              "Token account doesn't exist. Please create an associated token account first.",
          }),
          { status: 400, headers }
        );
      }
    } catch (error) {
      console.error("Error checking token account:", error);
    }

    // Claim royalties
    const signature = await claimRoyalties(connection, {
      poolAddress,
      mintA,
      receiverTaA,
      ownerAddress,
    });

    console.log("Royalties claimed successfully!");
    console.log(`Transaction: ${signature}`);

    // Return transaction response
    const response: ActionPostResponse = {
      type: "transaction",
      transaction: signature,
    };

    // Include additional data in the response
    const responseObj = {
      ...response,
      poolAddress,
      receiverTaA,
    };

    return new Response(JSON.stringify(responseObj), {
      status: 200,
      headers,
    });
  } catch (error: any) {
    console.error("Error claiming royalties:", error);

    // Return error response
    return new Response(
      JSON.stringify({
        error: error.message || "Failed to claim royalties",
      }),
      { status: 500, headers }
    );
  }
}
