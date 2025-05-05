"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { base58, base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/hooks/use-umi";
import { usePoolInfo } from "./use-pool-info";
import { server } from "@/utils/elysia";

// Get the API URL from environment variables

interface BuyTokenStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

export function useBuyToken() {
  const umi = useUmi();
  const { publicKey, connected } = useWallet();
  const {
    fetchPoolInfo,
    poolInfo,
    loading: poolInfoLoading,
    status: poolInfoStatus,
  } = usePoolInfo();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BuyTokenStatus>({
    type: null,
    message: "",
  });
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Buy token functionality
  const buyToken = useCallback(
    async (tokenMint: string, amount: string) => {
      if (!publicKey) {
        setStatus({ type: "error", message: "Wallet not connected" });
        return false;
      }

      if (!tokenMint) {
        setStatus({
          type: "error",
          message: "Please enter a token mint address",
        });
        return false;
      }

      if (!amount || parseFloat(amount) <= 0) {
        setStatus({
          type: "error",
          message: "Please enter a valid amount greater than 0",
        });
        return false;
      }

      // Check if pool info is available
      if (!poolInfo || !poolInfo.success) {
        setStatus({
          type: "error",
          message: "Pool information not available. Please try again.",
        });
        return false;
      }

      try {
        setLoading(true);
        setTxSignature(null);
        setStatus({ type: "info", message: "Preparing transaction..." });

        const { data: instructionsResponse, error: instructionsError } =
          await server.instructions.buy.post({
            tokenMintAddress: tokenMint,
            userAddress: publicKey.toString(),
            amount: parseFloat(amount),
          });

        if (instructionsError) {
          throw new Error(
            instructionsError.value.message || "Failed to prepare transaction"
          );
        }

        // Process the serialized transaction
        setStatus({
          type: "info",
          message: "Please sign the transaction in your wallet...",
        });

        // Deserialize the transaction
        const serializedTx = instructionsResponse.serializedTransaction;
        const deserializedTxAsU8 = base64.serialize(serializedTx);
        const deserializedTx = umi.transactions.deserialize(deserializedTxAsU8);

        // Sign the transaction
        const signedTx = await umi.identity.signTransaction(deserializedTx);

        // Send the transaction
        setStatus({
          type: "info",
          message: "Sending transaction to the blockchain...",
        });
        const signature = await umi.rpc.sendTransaction(signedTx);

        const signatureString = base58.deserialize(signature)[0];
        setTxSignature(signatureString);

        // Now we need to confirm the transaction
        setStatus({ type: "info", message: "Confirming transaction..." });
        const { data: confirmationResponse, error } = await server.solana[
          "wait-for-signature"
        ].post({
          signature: signatureString,
        });
        if (confirmationResponse?.success) {
          setStatus({
            type: "success",
            message: "Transaction successful! You've purchased tokens.",
          });
        } else {
          const errorMessage =
            typeof error === "string"
              ? error
              : error?.value?.message ||
                JSON.stringify(error) ||
                "Transaction failed";
          throw new Error(errorMessage);
        }
        return true;
      } catch (error: any) {
        console.error("Transaction error:", error);
        setStatus({
          type: "error",
          message: error.message || "Failed to buy token",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, umi, poolInfo]
  );

  return {
    loading: loading || poolInfoLoading,
    status: poolInfoStatus.type ? poolInfoStatus : status,
    poolInfo,
    txSignature,
    fetchPoolInfo,
    buyToken,
    connected,
  };
}
