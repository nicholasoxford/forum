"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/hooks/use-umi";
import { usePoolInfo } from "./use-pool-info";
import { server } from "@/utils/elysia";

interface SellTokenStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

export function useSellToken() {
  const umi = useUmi();
  const { publicKey, connected } = useWallet();
  const {
    fetchPoolInfo,
    poolInfo,
    loading: poolInfoLoading,
    status: poolInfoStatus,
  } = usePoolInfo();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<SellTokenStatus>({
    type: null,
    message: "",
  });
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Sell token functionality
  const sellToken = useCallback(
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

      try {
        setLoading(true);
        setTxSignature(null);
        setStatus({ type: "info", message: "Preparing transaction..." });

        // Call API to get transaction instructions
        const { data: instructionsResponse, error: instructionsError } =
          await server.instructions.sell.post({
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
        const signatureString = base64.deserialize(signature)[0];
        setTxSignature(signatureString);

        // Now we need to confirm the transaction
        setStatus({ type: "info", message: "Confirming transaction..." });
        const confirmation = await umi.rpc.confirmTransaction(signature, {
          strategy: {
            type: "blockhash",
            ...(await umi.rpc.getLatestBlockhash()),
          },
        });

        if (confirmation.value.err) {
          throw new Error(
            `Transaction confirmed but failed: ${confirmation.value.err}`
          );
        }

        setStatus({
          type: "success",
          message: "Transaction successful! You've sold tokens.",
        });
        return true;
      } catch (error: any) {
        console.error("Transaction error:", error);
        setStatus({
          type: "error",
          message: error.message || "Failed to sell token",
        });
        return false;
      } finally {
        setLoading(false);
      }
    },
    [publicKey, umi]
  );

  return {
    loading: loading || poolInfoLoading,
    status: poolInfoStatus.type ? poolInfoStatus : status,
    poolInfo,
    txSignature,
    fetchPoolInfo,
    sellToken,
    connected,
  };
}
