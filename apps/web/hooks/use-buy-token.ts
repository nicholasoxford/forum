"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePoolInfo } from "./use-pool-info";
import { useSolanaTransaction } from "./use-solana-transaction";

export function useBuyToken() {
  const { publicKey, connected } = useWallet();
  const {
    fetchPoolInfo,
    poolInfo,
    loading: poolInfoLoading,
    status: poolInfoStatus,
  } = usePoolInfo();

  // Use our generic transaction hook for the transaction part
  const {
    loading: txLoading,
    status: txStatus,
    txSignature,
    executeTransaction,
  } = useSolanaTransaction();

  // Buy token functionality
  const buyToken = useCallback(
    async (tokenMint: string, amount: string, poolAddress: string) => {
      if (!publicKey) {
        return false;
      }

      if (!tokenMint) {
        return false;
      }

      if (!amount || parseFloat(amount) <= 0) {
        return false;
      }

      if (!poolAddress) {
        return false;
      }

      // Check if pool info is available
      if (!poolInfo || !poolInfo.success) {
        return false;
      }

      try {
        // API request data for preparing the transaction
        const requestData = {
          tokenMintAddress: tokenMint,
          userAddress: publicKey.toString(),
          amount: parseFloat(amount),
          poolAddress: poolAddress,
        };

        // Transaction-specific data for database recording
        // The last part of the path "buy" determines the transaction type
        const transactionData = {
          tokenMintAddress: tokenMint,
          poolAddress: poolAddress,
          mintA: "So11111111111111111111111111111111111111112", // Default to SOL
          mintB: tokenMint,
          amount: amount,
          // We'll leave out the estimated amount for now until we have it from the pool info
        };

        // Execute the transaction with both request data and transaction-specific data
        // The path "instructions.buy" tells the system this is a "buy" transaction
        return await executeTransaction("buy", requestData, transactionData);
      } catch (error) {
        console.error("Error buying token:", error);
        return false;
      }
    },
    [publicKey, poolInfo, executeTransaction]
  );

  return {
    loading: txLoading || poolInfoLoading,
    status: poolInfoStatus.type ? poolInfoStatus : txStatus,
    poolInfo,
    txSignature,
    fetchPoolInfo,
    buyToken,
    connected,
  };
}
