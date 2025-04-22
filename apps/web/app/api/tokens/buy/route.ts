import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { pools } from "@/src/db/schema";
import { buyTokens, createConnection, getPayerKeypair } from "@/lib/vertigo";
import { eq } from "drizzle-orm";
import {
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";

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

    console.log(`[tokens/buy] Found pool in DB:`, poolInfo);

    const connection = await createConnection();

    // --- Verification Step ---
    try {
      const poolAccountAddress = new PublicKey(poolInfo.poolAddress);
      console.log(
        `[tokens/buy] Verifying pool account existence: ${poolAccountAddress.toString()}`
      );
      const poolAccountInfo =
        await connection.getAccountInfo(poolAccountAddress);
      if (!poolAccountInfo) {
        console.error(
          `[tokens/buy] Pool account NOT FOUND on-chain: ${poolAccountAddress.toString()}`
        );
        throw new Error(
          `Pool account ${poolAccountAddress.toString()} not found on-chain. DB record might be incorrect or pool creation failed.`
        );
      }
      console.log(
        `[tokens/buy] Pool account found on-chain. Lamports: ${poolAccountInfo.lamports}, Owner: ${poolAccountInfo.owner.toString()}`
      );
    } catch (verificationError: any) {
      console.error(
        `[tokens/buy] Error verifying pool account:`,
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
    // --- End Verification Step ---

    console.log("ABOUT TO GET PAYER");
    const payer = getPayerKeypair();
    console.log("ABOUT TO GET USER TA A");
    const userTaA = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      NATIVE_MINT,
      payer.publicKey,
      false,
      "confirmed",
      { commitment: "confirmed" }
    );
    console.log("ABOUT TO GET USER TA B: ", tokenMintAddress);
    const userTaB = await getOrCreateAssociatedTokenAccount(
      connection,
      payer,
      new PublicKey(tokenMintAddress),
      payer.publicKey,
      false,
      "confirmed",
      { commitment: "confirmed" },
      TOKEN_2022_PROGRAM_ID
    );
    console.log({
      userTaA: userTaA.address.toString(),
      userTaB: userTaB.address.toString(),
    });
    // Calculate token accounts if not provided
    // In a real implementation, these would be derived properly
    console.log("ABOUT TO BUY TOKENS");
    // Get serialized transaction for buying tokens
    const serializedTx = await buyTokens(connection, {
      poolOwner: poolInfo.ownerAddress,
      mintA: NATIVE_MINT.toString(),
      mintB: tokenMintAddress,
      userAddress,
      userTaA: userTaA.address.toString(),
      userTaB: userTaB.address.toString(),
      amount,
      slippageBps,
    });

    console.log(
      `[tokens/buy] Successfully generated buy transaction for pool: ${poolInfo.poolAddress}`
    );

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
