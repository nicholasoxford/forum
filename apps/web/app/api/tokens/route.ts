import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { tokens, users, groupChats, pools } from "@/src/db/schema";
import { createTelegramChannel } from "@/lib/telegram";
import { createConnection, launchPool } from "@/lib/vertigo";
import { Keypair, PublicKey } from "@solana/web3.js";
import { eq } from "drizzle-orm";
import { base58 } from "@metaplex-foundation/umi/serializers";

/**
 * POST /api/tokens
 *
 * Expected JSON body:
 * {
 *   tokenMintAddress: string,
 *   tokenSymbol: string,
 *   tokenName: string,
 *   decimals: number,
 *   transferFeeBasisPoints: number,
 *   maximumFee: string, // send as string to preserve precision
 *   metadataUri?: string,
 *   creatorWalletAddress: string,
 *   creatorUsername?: string,
 *   creatorTelegramUserId?: string,
 *   requiredHoldings: string,
 *   targetMarketCap?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tokenMintAddress,
      tokenSymbol,
      tokenName,
      decimals,
      transferFeeBasisPoints,
      maximumFee,
      metadataUri,
      creatorWalletAddress,
      creatorUsername,
      creatorTelegramUserId,
      requiredHoldings,
      targetMarketCap,
    } = body ?? {};

    // Basic validation
    if (
      !tokenMintAddress ||
      !tokenSymbol ||
      !tokenName ||
      decimals === undefined ||
      transferFeeBasisPoints === undefined ||
      !maximumFee ||
      !creatorWalletAddress
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // 1. Ensure the user (creator) exists in the `users` table (idempotent)
    await db
      .insert(users)
      .values({
        walletAddress: creatorWalletAddress,
        username: creatorUsername,
        telegramUserId: creatorTelegramUserId,
      })
      // Ignore if user already exists
      .onConflictDoNothing({ target: users.walletAddress });

    // 2. Insert the new token
    await db.insert(tokens).values({
      tokenMintAddress,
      tokenSymbol,
      tokenName,
      decimals,
      transferFeeBasisPoints,
      maximumFee,
      metadataUri,
      targetMarketCap: targetMarketCap || null,
      creatorWalletAddress,
    });

    // 3. Create a dedicated Telegram channel for this token
    let telegramChannelId: string | null = null;
    let telegramUsername: string | null = null;
    try {
      const { channelId, username } = await createTelegramChannel(
        `${tokenSymbol} Holders`,
        `Official chat for ${tokenName} (${tokenSymbol}) token holders.`
      );
      telegramChannelId = channelId;
      telegramUsername = username;
      console.log("ARE WE HERE?");
      // Persist channel info in group_chats table with requiredHoldings from input or default "0"
      await db.insert(groupChats).values({
        tokenMintAddress,
        telegramChatId: channelId,
        telegramUsername: username,
        tokenSymbol,
        tokenName,
        requiredHoldings: requiredHoldings || "0", // Use provided value or default
        creatorWalletAddress,
      });
      console.log("POST INSERT?");
    } catch (tgError) {
      console.error("Failed to create Telegram channel", tgError);
      // Not fatal for token creation; continue.
    }
    // Load wallet keypair from local file
    const walletKeypair = Keypair.fromSecretKey(
      base58.serialize(process.env.VERTIGO_SECRET_KEY!)
    );
    console.log("ABOUT TO CREATE CONNECTION");
    const connection = await createConnection();
    // Default pool settings
    const DEFAULT_SHIFT = 100; // 100 virtual SOL
    const DEFAULT_ROYALTIES_BPS = 100; // 1%
    const OWNER_ADDRESS = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";
    console.log("ABOUT TO LAUNCH POOL");
    const result = await launchPool(connection, {
      tokenName,
      tokenSymbol,
      poolParams: {
        shift: DEFAULT_SHIFT,
        // These parameters need to be set but will be fetched from the blockchain for existing tokens
        initialTokenReserves: 1_000,
        decimals: 6,
        feeParams: {
          normalizationPeriod: 20,
          decay: 10,
          royaltiesBps: DEFAULT_ROYALTIES_BPS,
          feeExemptBuys: 1,
        },
      },
      ownerAddress: walletKeypair.publicKey.toString(),
      existingToken: {
        mintB: new PublicKey(tokenMintAddress),
        tokenWallet: new PublicKey(OWNER_ADDRESS),
        // Use the loaded wallet keypair as the authority since it likely owns the token account
        walletAuthority: walletKeypair,
      },
    });
    console.log("Pool launched successfully!");
    console.log(`Pool address: ${result.poolAddress}`);
    console.log(`Transaction: ${result.signature}`);

    // Save pool information to the new pools table
    await db.insert(pools).values({
      poolAddress: result.poolAddress,
      tokenMintAddress,
      ownerAddress: walletKeypair.publicKey.toString(),
      mintA: "So11111111111111111111111111111111111111112", // Native SOL mint
      mintB: tokenMintAddress,
      shift: DEFAULT_SHIFT.toString(),
      initialTokenReserves: "1000",
      royaltiesBps: DEFAULT_ROYALTIES_BPS,
      transactionSignature: result.signature,
    });

    return NextResponse.json({
      success: true,
      telegramChannelId,
      telegramUsername,
      poolAddress: result.poolAddress,
      transactionSignature: result.signature,
    });
  } catch (error: any) {
    console.error("[tokens POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tokens
 *
 * Returns all tokens with their relevant pool information
 */
export async function GET(request: NextRequest) {
  try {
    // Query all tokens and join with their respective pools
    const allTokens = await db
      .select({
        token: tokens,
        pool: pools,
      })
      .from(tokens)
      .leftJoin(pools, eq(tokens.tokenMintAddress, pools.tokenMintAddress));

    // Format the response
    const formattedTokens = allTokens.map(({ token, pool }) => ({
      // Token info
      tokenMintAddress: token.tokenMintAddress,
      tokenName: token.tokenName,
      tokenSymbol: token.tokenSymbol,
      decimals: token.decimals,
      transferFeeBasisPoints: token.transferFeeBasisPoints,
      metadataUri: token.metadataUri,
      creatorWalletAddress: token.creatorWalletAddress,
      createdAt: token.createdAt,

      // Pool info
      pool: pool
        ? {
            poolAddress: pool.poolAddress,
            ownerAddress: pool.ownerAddress,
            mintA: pool.mintA,
            mintB: pool.mintB,
            shift: pool.shift,
            initialTokenReserves: pool.initialTokenReserves,
            royaltiesBps: pool.royaltiesBps,
          }
        : null,
    }));

    return NextResponse.json({
      success: true,
      tokens: formattedTokens,
    });
  } catch (error: any) {
    console.error("[tokens GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
