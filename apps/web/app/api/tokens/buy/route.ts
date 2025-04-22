import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { pools } from "@/src/db/schema";
import { buyTokens, createConnection } from "@/lib/vertigo";
import { eq } from "drizzle-orm";
import { NATIVE_MINT } from "@solana/spl-token";

/**
 * POST /api/tokens/buy
 *
 * Returns serialized transaction instructions for buying a token
 *
 * Expected JSON body:
 * {
 *   tokenMintAddress: string,  // Address of the token to buy
 *   userAddress: string,       // User's wallet address
 *   userTaA?: string,          // User's SOL token account (optional, uses ATA if not provided)
 *   userTaB?: string,          // User's token account (optional, uses ATA if not provided)
 *   amount: number,            // Amount of SOL to spend (in SOL, not lamports)
 *   slippageBps?: number       // Slippage tolerance in basis points (optional, default 100 = 1%)
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tokenMintAddress,
      userAddress,
      userTaA,
      userTaB,
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

    const connection = await createConnection();

    // Calculate token accounts if not provided
    // In a real implementation, these would be derived properly
    const derivedUserTaA = userTaA || "SOL-TOKEN-ACCOUNT"; // This is a placeholder
    const derivedUserTaB = userTaB || "TOKEN-ACCOUNT"; // This is a placeholder

    // Get serialized transaction for buying tokens
    const serializedTx = await buyTokens(connection, {
      poolOwner: poolInfo.ownerAddress,
      mintA: NATIVE_MINT.toString(),
      mintB: tokenMintAddress,
      userAddress,
      userTaA: derivedUserTaA,
      userTaB: derivedUserTaB,
      amount,
      slippageBps,
    });

    return NextResponse.json({
      success: true,
      serializedTransaction: serializedTx,
      poolAddress: poolInfo.poolAddress,
    });
  } catch (error: any) {
    console.error("[tokens/buy POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
