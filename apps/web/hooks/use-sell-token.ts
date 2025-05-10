"use client";

import { useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { usePoolInfo } from "./use-pool-info";
import { useSolanaTransaction } from "./use-solana-transaction";

export function useSellToken() {
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

  // Sell token functionality
  const sellToken = useCallback(
    async (tokenMint: string, amount: string) => {
      if (!publicKey) {
        return false;
      }

      if (!tokenMint) {
        return false;
      }

      if (!amount || parseFloat(amount) <= 0) {
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
        };

        // Transaction-specific data for database recording
        const transactionData = {
          tokenMintAddress: tokenMint,
          poolAddress: poolInfo.poolAddress,
          mintA: "11111111111111111111111111111111", // Default to SOL
          mintB: tokenMint,
          amount: amount,
        };

        // Execute the transaction with both request data and transaction-specific data
        return await executeTransaction(
          "instructions.sell",
          requestData,
          transactionData
        );
      } catch (error) {
        console.error("Error selling token:", error);
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
    sellToken,
    connected,
  };
}
