"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { server } from "@/utils/elysia";

interface TokenBalanceProps {
  tokenMint: string;
}

// Helper function to format numbers with commas
function formatNumberWithCommas(numberString: string | null | undefined) {
  if (numberString === null || numberString === undefined) {
    return "0";
  }
  const parts = numberString.split(".");
  parts[0] = parts[0]!.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  return parts.join(".");
}

export function TokenBalance({ tokenMint }: TokenBalanceProps) {
  const { publicKey } = useWallet();
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!publicKey || !tokenMint) return;

    const fetchBalance = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error } = await server.tokens.balance.get({
          query: {
            wallet: publicKey.toString(),
            mint: tokenMint,
          },
        });
        if (error) {
          throw new Error(error.value?.message || "Failed to load balance");
        }
        // Type assertion for the response

        if (data.exists) {
          setBalance(data.balance.uiAmountString);
        } else {
          setBalance("0");
        }
      } catch (err: any) {
        console.error("Error fetching token balance:", err);
        setError(err?.message || "Failed to load balance");
        setBalance(null);
      } finally {
        setLoading(false);
      }
    };

    fetchBalance();
  }, [publicKey, tokenMint]);

  if (!publicKey) {
    return (
      <div className="text-zinc-400 text-sm">
        Connect wallet to view balance
      </div>
    );
  }

  if (loading) {
    return <Skeleton className="h-6 w-24" />;
  }

  if (error) {
    return <div className="text-red-400 text-sm">{error}</div>;
  }

  return (
    <div className="font-medium">
      {balance ? (
        <span className="text-white">{formatNumberWithCommas(balance)}</span>
      ) : (
        <span className="text-zinc-400">0</span>
      )}
    </div>
  );
}
