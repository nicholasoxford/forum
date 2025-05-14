"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useTokens } from "@/hooks/use-tokens";
import { TokenTable } from "@/components/token-table";
import { Button } from "@workspace/ui/components/button";
import { ExternalLink, PlusCircle } from "lucide-react";
import Link from "next/link";

export default function TokensPage() {
  const [selectedTokenMint, setSelectedTokenMint] = useState<
    string | undefined
  >();
  const router = useRouter();
  const { tokens, loading, error } = useTokens();

  const handleSelectToken = (tokenMintAddress: string) => {
    setSelectedTokenMint(tokenMintAddress);
  };

  const navigateToBuy = () => {
    if (selectedTokenMint) {
      router.push(`/buy-token?mint=${selectedTokenMint}`);
    }
  };

  return (
    <div className="container max-w-4xl mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Available Tokens</h1>
        <Link href="/launch">
          <Button>
            <PlusCircle className="h-4 w-4 mr-2" />
            Create Token
          </Button>
        </Link>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-md mb-6 text-red-700 dark:text-red-300">
          {error}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-lg font-medium mb-3">Tradable Tokens</h2>
        <p className="text-sm text-zinc-500 mb-3">
          Tokens with active trading pools where you can buy and earn fees
        </p>
        <TokenTable
          tokens={tokens}
          loading={loading}
          selectedTokenMint={selectedTokenMint}
          onSelectToken={handleSelectToken}
        />
      </div>

      {selectedTokenMint && (
        <div className="flex justify-center gap-4">
          <Button
            variant="outline"
            onClick={() =>
              window.open(
                `https://explorer.solana.com/address/${selectedTokenMint}?cluster=mainnet-beta`,
                "_blank"
              )
            }
          >
            View on Explorer <ExternalLink className="ml-2 h-4 w-4" />
          </Button>
          <Button onClick={navigateToBuy}>Buy Token</Button>
        </div>
      )}
    </div>
  );
}
