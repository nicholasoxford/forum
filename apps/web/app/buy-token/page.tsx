"use client";

import React, { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
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
import { Loader2, ExternalLink, ArrowRight, Check } from "lucide-react";
import { WalletButton } from "@workspace/ui/components";
import { base64 } from "@metaplex-foundation/umi/serializers";
import { useUmi } from "@/lib/umi";

export default function BuyTokenPage() {
  const umi = useUmi();
  const { publicKey, signTransaction, connected } = useWallet();

  const [tokenMint, setTokenMint] = useState("");
  const [amount, setAmount] = useState("0.1");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{
    type: "success" | "error" | "info" | null;
    message: string;
  }>({ type: null, message: "" });
  const [poolInfo, setPoolInfo] = useState<any>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [availableTokens, setAvailableTokens] = useState<any[]>([]);
  const [loadingTokens, setLoadingTokens] = useState(false);

  // Fetch all available tokens
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        setLoadingTokens(true);
        const response = await fetch("/api/tokens");
        const data = await response.json();

        if (response.ok && data.success) {
          // Filter to only include tokens with a pool address
          const tokensWithPools = data.tokens.filter(
            (token: { pool: any }) => token.pool !== null
          );
          setAvailableTokens(tokensWithPools || []);
        } else {
          console.error("Failed to fetch tokens:", data.error);
        }
      } catch (error) {
        console.error("Error fetching tokens:", error);
      } finally {
        setLoadingTokens(false);
      }
    };

    fetchTokens();
  }, []);

  // Handle URL parameters
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const mintParam = params.get("mint");
      if (mintParam) {
        setTokenMint(mintParam);
      }
    }
  }, []);

  // Fetch pool info when token mint changes
  useEffect(() => {
    async function fetchPoolInfo() {
      if (!tokenMint || tokenMint.length < 32) return;

      try {
        setStatus({ type: "info", message: "Fetching pool information..." });
        const response = await fetch(`/api/tokens/${tokenMint}/pool`);
        const data = await response.json();

        if (response.ok && data.success) {
          setPoolInfo(data);
          setStatus({ type: null, message: "" });
        } else {
          setStatus({
            type: "error",
            message: data.error || "Failed to fetch pool information",
          });
          setPoolInfo(null);
        }
      } catch (error: any) {
        console.error("Error fetching pool info:", error);
        setStatus({
          type: "error",
          message: error.message || "Failed to fetch pool information",
        });
        setPoolInfo(null);
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

    if (!amount || parseFloat(amount) <= 0) {
      setStatus({
        type: "error",
        message: "Please enter a valid amount greater than 0",
      });
      return;
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
    } catch (error: any) {
      console.error("Transaction error:", error);
      setStatus({
        type: "error",
        message: error.message || "Failed to buy token",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectToken = (mintAddress: string) => {
    setTokenMint(mintAddress);
  };

  return (
    <div className="container max-w-xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Buy Tokens</h1>
      </div>

      <div className="flex justify-center mb-6">
        <WalletButton />
      </div>

      {/* Available Tokens Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Available Tokens</CardTitle>
          <CardDescription>Select a token from the list below</CardDescription>
        </CardHeader>
        <CardContent>
          {loadingTokens ? (
            <div className="flex justify-center py-4">
              <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
            </div>
          ) : availableTokens.length > 0 ? (
            <div className="grid gap-2">
              {availableTokens.map((token) => (
                <div
                  key={token.tokenMintAddress}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    tokenMint === token.tokenMintAddress
                      ? "bg-primary/10 border-primary"
                      : "hover:bg-gray-100 dark:hover:bg-gray-800"
                  }`}
                  onClick={() => handleSelectToken(token.tokenMintAddress)}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">
                        {token.tokenName} ({token.tokenSymbol})
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 font-mono">
                        {token.tokenMintAddress.slice(0, 8)}...
                        {token.tokenMintAddress.slice(-8)}
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="text-xs mr-2">
                        Fee: {token.transferFeeBasisPoints / 100}%
                      </span>
                      {tokenMint === token.tokenMintAddress && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-4 text-gray-500">
              No tokens available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Buy Token Section */}
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
              disabled={loading}
            />
          </div>

          {poolInfo && (
            <Alert className="bg-blue-50 dark:bg-blue-950">
              <AlertTitle className="flex items-center gap-2">
                {poolInfo.token.tokenName} ({poolInfo.token.tokenSymbol})
              </AlertTitle>
              <AlertDescription>
                <div className="mt-2 space-y-1 text-sm">
                  <p>
                    <strong>Fee:</strong>{" "}
                    {poolInfo.token.transferFeeBasisPoints / 100}%
                  </p>
                  <p>
                    <strong>Pool:</strong>{" "}
                    <span className="font-mono text-xs">
                      {poolInfo.pool.poolAddress.slice(0, 8)}...
                      {poolInfo.pool.poolAddress.slice(-8)}
                    </span>
                  </p>
                </div>
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
              disabled={loading}
            />
          </div>

          {status.type && (
            <Alert
              className={
                status.type === "error"
                  ? "bg-red-50 dark:bg-red-950"
                  : status.type === "success"
                    ? "bg-green-50 dark:bg-green-950"
                    : "bg-blue-50 dark:bg-blue-950"
              }
            >
              <AlertDescription>{status.message}</AlertDescription>

              {txSignature && (
                <div className="mt-2">
                  <a
                    href={`https://explorer.solana.com/tx/${txSignature}?cluster=devnet`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    View on Solana Explorer{" "}
                    <ExternalLink className="ml-1 h-3 w-3" />
                  </a>
                </div>
              )}
            </Alert>
          )}
        </CardContent>

        <CardFooter className="flex flex-col gap-2">
          <Button
            className="w-full"
            disabled={!connected || loading || !poolInfo}
            onClick={handleBuyToken}
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...
              </>
            ) : (
              <>
                Buy {poolInfo?.token?.tokenSymbol || "Token"}{" "}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {!connected && (
            <p className="text-sm text-center text-gray-500">
              Connect your wallet to buy tokens
            </p>
          )}

          {connected && !poolInfo && tokenMint && status.type === "error" && (
            <p className="text-sm text-center text-gray-500">
              No valid pool found for this token
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
