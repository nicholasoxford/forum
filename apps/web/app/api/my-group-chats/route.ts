import { NextRequest, NextResponse } from "next/server";
import { db } from "@/src/db";
import { groupChats } from "@/src/db/schema";
import { eq } from "drizzle-orm";

// GET /api/my-group-chats?walletAddress=<string>
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get("walletAddress");

    if (!walletAddress) {
      return NextResponse.json(
        { error: "Missing walletAddress query param" },
        { status: 400 }
      );
    }

    const chats = await db
      .select()
      .from(groupChats)
      .where(eq(groupChats.creatorWalletAddress, walletAddress));

    return NextResponse.json({ chats });
  } catch (error: any) {
    console.error("[my-group-chats GET]", error);
    return NextResponse.json(
      { error: "Internal Server Error", message: error?.message },
      { status: 500 }
    );
  }
}
