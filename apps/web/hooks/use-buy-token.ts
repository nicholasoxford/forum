"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/lib/umi";

interface BuyTokenStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

interface PoolInfo {
  success: boolean;
  token?: {
    tokenName: string;
    tokenSymbol: string;
    transferFeeBasisPoints: number;
  };
  pool?: {
    poolAddress: string;
  };
  error?: string;
}

export function useBuyToken() {
  const umi = useUmi();
  const { publicKey, connected } = useWallet();

  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<BuyTokenStatus>({
    type: null,
    message: "",
  });
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  // Fetch pool info for a token
  const fetchPoolInfo = useCallback(async (tokenMint: string) => {
    if (!tokenMint || tokenMint.length < 32) {
      setPoolInfo(null);
      return;
    }

    try {
      setStatus({ type: "info", message: "Fetching pool information..." });
      const response = await fetch(`/api/tokens/${tokenMint}/pool`);
      const data = await response.json();

      if (response.ok && data.success) {
        setPoolInfo(data);
        setStatus({ type: null, message: "" });
        return data;
      } else {
        setStatus({
          type: "error",
          message: data.error || "Failed to fetch pool information",
        });
        setPoolInfo(null);
        return null;
      }
    } catch (error: any) {
      console.error("Error fetching pool info:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to fetch pool information",
      });
      setPoolInfo(null);
      return null;
    }
  }, []);

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

      try {
        setLoading(true);
        setTxSignature(null);
        setStatus({ type: "info", message: "Preparing transaction..." });

        // Call API to get transaction instructions
        const response = await fetch("/api/tokens/buy", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenMintAddress: tokenMint,
            userAddress: publicKey.toString(),
            amount: parseFloat(amount),
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to prepare transaction");
        }

        const data = await response.json();

        if (!data.success) {
          throw new Error(data.error || "Failed to prepare transaction");
        }

        // Process the serialized transaction
        setStatus({
          type: "info",
          message: "Please sign the transaction in your wallet...",
        });

        // Deserialize the transaction
        const serializedTx = data.serializedTransaction;
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
          message: "Transaction successful! You've purchased tokens.",
        });
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
    [publicKey, umi]
  );

  return {
    loading,
    status,
    poolInfo,
    txSignature,
    fetchPoolInfo,
    buyToken,
    connected,
  };
}
