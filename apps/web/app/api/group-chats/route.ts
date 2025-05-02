import { NextRequest, NextResponse } from "next/server";
import { groupChats, users, tokens, getDb } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * POST /api/group-chats
 *
 * Expected JSON body:
 * {
 *   tokenMintAddress: string,
 *   telegramChatId: string,
 *   requiredHoldings: string, // send as string to preserve precision
 *   creatorWalletAddress: string,
 *   creatorUsername?: string,
 *   creatorTelegramUserId?: string
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const {
      tokenMintAddress,
      telegramChatId,
      requiredHoldings,
      creatorWalletAddress,
      creatorUsername,
      creatorTelegramUserId,
    } = body ?? {};

    // Basic validation
    if (
      !tokenMintAddress ||
      !telegramChatId ||
      !requiredHoldings ||
      !creatorWalletAddress
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }
    const db = getDb();
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

    // 2. Get token information from the database
    const tokenInfo = await db.query.tokens.findFirst({
      where: eq(tokens.tokenMintAddress, tokenMintAddress),
    });

    if (!tokenInfo) {
      return NextResponse.json(
        { error: "Token not found in database" },
        { status: 404 }
      );
    }

    // 3. Insert the new group chat / token definition
    await db.insert(groupChats).values({
      tokenMintAddress,
      telegramChatId,
      tokenSymbol: tokenInfo.tokenSymbol,
      tokenName: tokenInfo.tokenName,
      requiredHoldings,
      creatorWalletAddress,
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[group-chats POST]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
