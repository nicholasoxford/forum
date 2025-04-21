import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { tokens, users, groupChats } from "@/src/db/schema";
import { sql } from "drizzle-orm";
import { createTelegramChannel } from "@/lib/telegram";

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
    } catch (tgError) {
      console.error("Failed to create Telegram channel", tgError);
      // Not fatal for token creation; continue.
    }

    return NextResponse.json({
      success: true,
      telegramChannelId,
      telegramUsername,
    });
  } catch (error: any) {
    console.error("[tokens POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
