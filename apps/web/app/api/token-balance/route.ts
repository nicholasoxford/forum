import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getAssociatedTokenAddress,
} from "@solana/spl-token";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const walletAddress = searchParams.get("wallet");
    const mintAddress = searchParams.get("mint");

    if (!walletAddress || !mintAddress) {
      return NextResponse.json(
        { error: "Missing required parameters: wallet and mint" },
        { status: 400 }
      );
    }

    // Validate addresses
    let wallet: PublicKey;
    let mint: PublicKey;

    try {
      wallet = new PublicKey(walletAddress);
      mint = new PublicKey(mintAddress);
    } catch (error) {
      return NextResponse.json(
        { error: "Invalid wallet or mint address" },
        { status: 400 }
      );
    }

    // Connect to Solana
    const RPC_URL = process.env.RPC_URL ?? "https://api.devnet.solana.com";
    const connection = new Connection(RPC_URL, "confirmed");

    // Find the token account address (ATA)
    const tokenAccountAddress = await getAssociatedTokenAddress(
      mint,
      wallet,
      false,
      // Try with TOKEN_2022_PROGRAM_ID first, as that's what we're using for our tokens
      TOKEN_2022_PROGRAM_ID
    );

    let balance;
    // Try to get the token balance
    try {
      balance = await connection.getTokenAccountBalance(tokenAccountAddress);
    } catch (error) {
      // If getting the balance fails, the token account might not exist yet
      // which means the user has 0 tokens
      return NextResponse.json({
        wallet: walletAddress,
        mint: mintAddress,
        balance: {
          amount: "0",
          decimals: 0,
          uiAmount: 0,
          uiAmountString: "0",
        },
        tokenAccount: tokenAccountAddress.toString(),
        exists: false,
      });
    }

    // Return the balance info
    return NextResponse.json({
      wallet: walletAddress,
      mint: mintAddress,
      balance: balance.value,
      tokenAccount: tokenAccountAddress.toString(),
      exists: true,
    });
  } catch (error) {
    console.error("Error fetching token balance:", error);
    return NextResponse.json(
      { error: "Failed to get token balance" },
      { status: 500 }
    );
  }
}
