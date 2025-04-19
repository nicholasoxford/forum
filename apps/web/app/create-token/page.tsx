"use client";

import { useState } from "react";
import { TokenCreator } from "@workspace/ui/components";
import { useWallet } from "@jup-ag/wallet-adapter";
import { useUmi } from "../../lib/umi";
import { createTokenMint } from "../../lib/token-mint";

export default function CreateTokenPage() {
  const { connected } = useWallet();
  const [isCreating, setIsCreating] = useState(false);
  const [tokenMint, setTokenMint] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const umi = useUmi();

  const handleCreateToken = async (tokenConfig: {
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
  }) => {
    if (!connected) {
      setError("Please connect your wallet first");
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const result = await createTokenMint(umi, tokenConfig);
      setTokenMint(result.mint);

      // Show success notification
      console.log("Token created successfully:", result);
    } catch (err) {
      console.error("Failed to create token:", err);
      setError(err instanceof Error ? err.message : "Failed to create token");
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="container mx-auto py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold mb-4">Create Community Token</h1>
          <p className="text-lg text-muted-foreground">
            Launch your own community token with transfer fees that reward
            holders
          </p>
        </div>

        {!connected && (
          <div className="mb-8 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800 text-center">
            Please connect your wallet to create a token
          </div>
        )}

        {error && (
          <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
            {error}
          </div>
        )}

        {tokenMint && (
          <div className="mb-8 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800">
            <p className="font-bold">Token created successfully!</p>
            <p className="break-all">Mint address: {tokenMint}</p>
          </div>
        )}

        <TokenCreator
          onCreateToken={handleCreateToken}
          isLoading={isCreating}
        />

        <div className="mt-12 bg-background rounded-lg border border-border p-6">
          <h2 className="text-xl font-bold mb-4">How it works</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold">1. Create your token</h3>
              <p className="text-muted-foreground">
                Design your community token with custom parameters and transfer
                fees.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">2. Set up telegram group</h3>
              <p className="text-muted-foreground">
                Link your token to a Telegram group that token holders can
                access.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">3. Distribute or sell tokens</h3>
              <p className="text-muted-foreground">
                Share with your community or list on DEXs like Vertigo.
              </p>
            </div>
            <div>
              <h3 className="font-semibold">4. Collect transfer fees</h3>
              <p className="text-muted-foreground">
                Every transfer generates fees that are distributed to token
                holders.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
