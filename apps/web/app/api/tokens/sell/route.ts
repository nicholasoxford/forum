import { NextRequest, NextResponse } from "next/server";
import { getDb, pools } from "@workspace/db";
import { createConnection } from "@/lib/vertigo";
import { sellTokens } from "@workspace/vertigo";
import { eq } from "drizzle-orm";
import { NATIVE_MINT } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

/**
 * POST /api/tokens/sell
 *
 * Returns serialized transaction instructions for selling a token
 *
 * Expected JSON body:
 * {
 *   tokenMintAddress: string,  // Address of the token to sell
 *   userAddress: string,       // User's wallet address
 *   amount: number,            // Amount of tokens to sell (in tokens, not smallest units)
 *   slippageBps?: number       // Slippage tolerance in basis points (optional, default 100 = 1%)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tokenMintAddress,
      userAddress,
      amount,
      slippageBps = 100, // Default 1% slippage
    } = body ?? {};

    // Basic validation
    if (!tokenMintAddress || !userAddress || !amount) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const db = getDb();
    // Get pool information from database
    const poolInfo = await db.query.pools.findFirst({
      where: eq(pools.tokenMintAddress, tokenMintAddress),
    });

    if (!poolInfo) {
      return NextResponse.json(
        { error: "Pool not found for this token" },
        { status: 404 }
      );
    }

    console.log(`[tokens/sell] Found pool in DB:`, poolInfo);

    const connection = await createConnection();

    // --- Verification Step ---
    try {
      const poolAccountAddress = new PublicKey(poolInfo.poolAddress);
      console.log(
        `[tokens/sell] Verifying pool account existence: ${poolAccountAddress.toString()}`
      );
      const poolAccountInfo =
        await connection.getAccountInfo(poolAccountAddress);
      if (!poolAccountInfo) {
        console.error(
          `[tokens/sell] Pool account NOT FOUND on-chain: ${poolAccountAddress.toString()}`
        );
        throw new Error(
          `Pool account ${poolAccountAddress.toString()} not found on-chain. DB record might be incorrect or pool creation failed.`
        );
      }
      console.log(
        `[tokens/sell] Pool account found on-chain. Lamports: ${poolAccountInfo.lamports}, Owner: ${poolAccountInfo.owner.toString()}`
      );
    } catch (verificationError: any) {
      console.error(
        `[tokens/sell] Error verifying pool account:`,
        verificationError
      );
      return NextResponse.json(
        {
          error: "Pool Verification Failed",
          message:
            verificationError?.message ||
            "Could not verify pool account on-chain.",
        },
        { status: 500 }
      );
    }

    // Get serialized transaction for selling tokens
    const serializedTx = await sellTokens(connection, {
      poolOwner: poolInfo.ownerAddress,
      mintA: NATIVE_MINT.toString(),
      mintB: tokenMintAddress,
      userAddress,
      amount,
      slippageBps,
    });

    console.log(
      `[tokens/sell] Successfully generated sell transaction for pool: ${poolInfo.poolAddress}`
    );

    return NextResponse.json({
      success: true,
      serializedTransaction: serializedTx,
      poolAddress: poolInfo.poolAddress,
    });
  } catch (error: any) {
    console.error("[tokens/sell POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
