import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { pools, tokens } from "@/src/db/schema";
import { eq } from "drizzle-orm";

/**
 * GET /api/tokens/[tokenMint]/pool
 *
 * Returns pool information for a specific token
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { tokenMint: string } }
) {
  try {
    const tokenMint = params.tokenMint;

    if (!tokenMint) {
      return NextResponse.json(
        { error: "Token mint address is required" },
        { status: 400 }
      );
    }

    // Get token information
    const token = await db.query.tokens.findFirst({
      where: eq(tokens.tokenMintAddress, tokenMint),
    });

    if (!token) {
      return NextResponse.json({ error: "Token not found" }, { status: 404 });
    }

    // Get pool information
    const pool = await db.query.pools.findFirst({
      where: eq(pools.tokenMintAddress, tokenMint),
    });

    if (!pool) {
      return NextResponse.json(
        { error: "Pool not found for this token" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      token: {
        tokenMintAddress: token.tokenMintAddress,
        tokenSymbol: token.tokenSymbol,
        tokenName: token.tokenName,
        decimals: token.decimals,
      },
      pool: {
        poolAddress: pool.poolAddress,
        ownerAddress: pool.ownerAddress,
        mintA: pool.mintA,
        mintB: pool.mintB,
        shift: pool.shift,
        initialTokenReserves: pool.initialTokenReserves,
        royaltiesBps: pool.royaltiesBps,
      },
    });
  } catch (error: any) {
    console.error("[tokens/[tokenMint]/pool GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
