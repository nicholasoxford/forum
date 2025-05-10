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
        // Use our generic transaction hook to execute the transaction
        return await executeTransaction("instructions.buy", {
          tokenMintAddress: tokenMint,
          userAddress: publicKey.toString(),
          amount: parseFloat(amount),
        });
      } catch (error) {
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
