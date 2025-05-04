"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PoolSelector } from "./pool-selector";
import { Pool } from "@/hooks/use-pools";
import { NATIVE_MINT } from "@solana/spl-token";
import { server } from "@/utils/elysia";

export function ClaimRoyaltiesForm() {
  const wallet = useWallet();
  const [selectedPool, setSelectedPool] = useState<Pool | null>(null);
  const [poolAddress, setPoolAddress] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Update the poolAddress when a pool is selected
  useEffect(() => {
    if (selectedPool) {
      setPoolAddress(selectedPool.poolAddress);
    }
  }, [selectedPool]);

  const handleSelectPool = (pool: Pool) => {
    setSelectedPool(pool);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!wallet.publicKey) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!poolAddress) {
      toast.error("Please select a pool or enter a pool address");
      return;
    }

    setIsLoading(true);

    try {
      // Build the URL with query parameters
      const queryParams = new URLSearchParams({
        poolAddress,
        // Use the native SOL mint if selected from a pool
        mintA: selectedPool?.mintA || NATIVE_MINT.toString(),
      });

      const { data, error } = await server.instructions["claim-royalties"].post(
        {
          poolAddress,
          mintA: selectedPool?.mintA || NATIVE_MINT.toString(),
          ownerAddress: wallet.publicKey.toString(),
        }
      );

      if (error) {
        throw new Error(error.value.message || "Failed to claim royalties");
      }

      // Success - show transaction details
      toast.success("Royalties claimed successfully!");

      // Optionally show link to transaction
      if (data) {
        const network = process.env.NEXT_PUBLIC_NETWORK || "devnet";
        const explorerUrl = `https://explorer.solana.com/tx/${data.signature}?cluster=${network}`;
        toast.success(
          <div className="flex flex-col gap-2">
            <span>Transaction confirmed!</span>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 underline"
            >
              View on Solana Explorer
            </a>
          </div>
        );
      }
    } catch (error: any) {
      console.error("Error claiming royalties:", error);
      toast.error(error.message || "Failed to claim royalties");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-2 mb-6">
        <h3 className="text-lg font-medium">Your Pools</h3>
        <p className="text-sm text-gray-500 mb-4">
          Select a pool to claim royalties from:
        </p>
        <PoolSelector
          selectedPoolAddress={poolAddress}
          onSelectPool={handleSelectPool}
        />
      </div>

      {selectedPool && (
        <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-4 mb-4">
          <h4 className="font-medium mb-2">Selected Pool</h4>
          <p className="text-sm">
            <span className="font-semibold">Token:</span>{" "}
            {selectedPool.tokenName} ({selectedPool.tokenSymbol})
          </p>
          <p className="text-sm">
            <span className="font-semibold">Pool Address:</span>{" "}
            <span className="font-mono text-xs">
              {selectedPool.poolAddress}
            </span>
          </p>
          <p className="text-sm">
            <span className="font-semibold">Royalty Rate:</span>{" "}
            {(selectedPool.royaltiesBps / 100).toFixed(2)}%
          </p>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="poolAddress">Pool Address</Label>
        <Input
          id="poolAddress"
          placeholder="Enter the pool address"
          value={poolAddress}
          onChange={(e) => setPoolAddress(e.target.value)}
          required
        />
        <p className="text-xs text-gray-500">
          This address should be populated if you selected a pool above, or you
          can enter it manually.
        </p>
      </div>

      <div className="rounded-md bg-amber-50 dark:bg-amber-900/20 p-4 my-4">
        <p className="text-sm">
          <strong>Note:</strong> Royalties will be sent to your connected
          wallet's associated token account. Make sure your wallet is connected
          and has an associated token account for SOL.
        </p>
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || !wallet.publicKey}
      >
        {isLoading ? "Claiming Royalties..." : "Claim Royalties"}
      </Button>
    </form>
  );
}
