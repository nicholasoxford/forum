import { NextRequest, NextResponse } from "next/server";
import { Connection } from "@solana/web3.js";
import { createUnwrapSolTransaction } from "@/lib/vertigo/vertigo-utils";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { userAddress } = body;

    if (!userAddress) {
      return NextResponse.json(
        { error: "Missing required parameter: userAddress" },
        { status: 400 }
      );
    }

    // Set up connection to Solana
    const RPC_URL = process.env.RPC_URL || "https://api.devnet.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");

    // Create transaction to unwrap SOL
    const serializedTransaction = await createUnwrapSolTransaction(
      connection,
      userAddress
    );

    return NextResponse.json(
      {
        transaction: serializedTransaction,
        message: "SOL unwrap transaction created successfully",
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error unwrapping SOL:", error);

    // Handle specific error cases
    if (
      error.message.includes("No wSOL account found") ||
      error.message.includes("zero balance")
    ) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(
      { error: `Failed to create unwrap transaction: ${error.message}` },
      { status: 500 }
    );
  }
}
