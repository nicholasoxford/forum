"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Connection, PublicKey, Transaction } from "@solana/web3.js";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Input } from "@workspace/ui/components/input";
import { Button } from "@workspace/ui/components/button";
import { Label } from "@workspace/ui/components/label";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@workspace/ui/components/alert";
import { Loader2 } from "lucide-react";
import { WalletButton } from "@workspace/ui/components";

export default function BuyTokenPage() {
  const { publicKey, signTransaction, connected } = useWallet();

  const [tokenMint, setTokenMint] = useState("");
  const [amount, setAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [poolInfo, setPoolInfo] = useState<any>(null);

  // Fetch pool info when token mint changes
  useEffect(() => {
    async function fetchPoolInfo() {
      if (!tokenMint || tokenMint.length < 32) return;

      try {
        setStatus({ type: "info", message: "Fetching pool information..." });
        const response = await fetch(`/api/tokens/${tokenMint}/pool`);
        const data = await response.json();

        if (data.success) {
          setPoolInfo(data);
          setStatus({ type: null, message: "" });
        } else {
          setStatus({
            type: "error",
            message: data.error || "Failed to fetch pool information",
          });
        }
      } catch (error: any) {
        setStatus({
          type: "error",
          message: error.message || "Failed to fetch pool information",
        });
      }
    }

    fetchPoolInfo();
  }, [tokenMint]);

  const handleBuyToken = async () => {
    if (!publicKey || !signTransaction) {
      setStatus({ type: "error", message: "Wallet not connected" });
      return;
    }

    if (!tokenMint) {
      setStatus({
        type: "error",
        message: "Please enter a token mint address",
      });
      return;
    }

    try {
      setLoading(true);
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

      const data = await response.json();

      if (!data.success) {
        throw new Error(data.error || "Failed to prepare transaction");
      }

      // Process the serialized transaction
      setStatus({ type: "info", message: "Please sign the transaction..." });

      // In a real implementation, we'd deserialize the transaction here
      // and sign it with the wallet, then send it to the network
      // This is a simplified example
      const serializedTx = data.serializedTransaction;

      // Simulate a successful transaction for demo purposes
      await new Promise((resolve) => setTimeout(resolve, 1500));

      setStatus({
        type: "success",
        message:
          "Transaction simulation successful! In a real implementation, the transaction would be signed and sent to the network.",
      });
    } catch (error: any) {
      setStatus({
        type: "error",
        message: error.message || "Failed to buy token",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Buy Token Test Page
      </h1>

      <div className="flex justify-center mb-6">
        <WalletButton />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Buy Tokens</CardTitle>
          <CardDescription>
            Enter a token mint address and the amount of SOL to spend
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenMint">Token Mint Address</Label>
            <Input
              id="tokenMint"
              placeholder="Enter token mint address"
              value={tokenMint}
              onChange={(e) => setTokenMint(e.target.value)}
            />
          </div>

          {poolInfo && (
            <Alert className="bg-blue-50">
              <AlertTitle>Pool Information</AlertTitle>
              <AlertDescription>
                <p>
                  <strong>Token:</strong> {poolInfo.token.tokenName} (
                  {poolInfo.token.tokenSymbol})
                </p>
                <p>
                  <strong>Pool Address:</strong>{" "}
                  {poolInfo.pool.poolAddress.slice(0, 8)}...
                  {poolInfo.pool.poolAddress.slice(-8)}
                </p>
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="amount">Amount (SOL)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          {status.type && (
            <Alert
              className={
                status.type === "error"
                  ? "bg-red-50"
                  : status.type === "success"
                    ? "bg-green-50"
                    : "bg-blue-50"
              }
            >
              <AlertDescription>{status.message}</AlertDescription>
            </Alert>
          )}
        </CardContent>

        <CardFooter>
          <Button
            className="w-full"
            disabled={!connected || loading}
            onClick={handleBuyToken}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              "Buy Token"
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
