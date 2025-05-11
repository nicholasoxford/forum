"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useSolanaTransaction } from "./use-solana-transaction";
import { server } from "@/utils/elysia";

export interface TokenLaunchParams {
  name: string;
  symbol: string;
  uri: string;
  decimals: number;
  transferFeeBasisPoints: number;
  maximumFee: string;
  initialMintAmount?: string;
  requiredHoldings?: string;
  targetMarketCap?: string;
}

export interface TokenLaunchResult {
  success: boolean;
  error?: string;
  mintAddress?: string;
  databaseError?: string;
  poolAddress?: string;
  telegramChannelId?: string;
  telegramUsername?: string;
  transactionSignature?: string;
}

export function useTokenLaunch() {
  const { publicKey, connected } = useWallet();

  // Use our generic transaction hook for the transaction part
  const { loading, status, txSignature, executeTransaction, transactionId } =
    useSolanaTransaction();

  // Launch token functionality
  const launchToken = useCallback(
    async (params: TokenLaunchParams): Promise<TokenLaunchResult> => {
      if (!publicKey) {
        return { success: false, error: "Wallet not connected" };
      }

      try {
        // Prepare the request data for the transaction
        const requestData = {
          name: params.name,
          symbol: params.symbol,
          uri: params.uri,
          decimals: params.decimals,
          transferFeeBasisPoints: params.transferFeeBasisPoints,
          maximumFee: params.maximumFee,
          initialMintAmount: params.initialMintAmount,
          userAddress: publicKey.toString(),
        };

        // Include ALL token data needed for database in the transaction data
        const transactionData = {
          tokenName: params.name,
          tokenSymbol: params.symbol,
          metadataUri: params.uri,
          decimals: params.decimals,
          transferFeeBasisPoints: params.transferFeeBasisPoints,
          maximumFee: params.maximumFee,
          creatorWalletAddress: publicKey.toString(),
          requiredHoldings: params.requiredHoldings || "0",
          targetMarketCap: params.targetMarketCap,
        };

        // Execute the transaction with the complete token data
        const result = await executeTransaction(
          "create-token-2022",
          requestData,
          transactionData
        );

        // Check if the result contains the expected properties
        if (
          result &&
          typeof result === "object" &&
          "success" in result &&
          result.success
        ) {
          // Extract relevant information from the result
          return {
            success: true,
            mintAddress: "mint" in result ? (result.mint as string) : "",
            poolAddress:
              "poolAddress" in result ? (result.poolAddress as string) : "",
            transactionSignature: result.signature,
          };
        }

        return {
          success: false,
          error:
            typeof result === "object" && "error" in result
              ? (result.error as string)
              : "Transaction failed or required data not returned",
        };
      } catch (error: any) {
        console.error("Error launching token:", error);
        return {
          success: false,
          error: error?.message || "An unknown error occurred",
        };
      }
    },
    [publicKey, executeTransaction]
  );

  return {
    loading,
    status,
    txSignature,
    transactionId,
    launchToken,
    connected,
  };
}
