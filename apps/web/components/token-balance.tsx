"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@workspace/ui/components/skeleton";

interface TokenBalanceProps {
  tokenMint: string;
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

        const response = await fetch(
          `/api/token-balance?wallet=${publicKey.toString()}&mint=${tokenMint}`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch token balance");
        }

        const data = await response.json();

        if (data.exists) {
          setBalance(data.balance.uiAmountString);
        } else {
          setBalance("0");
        }
      } catch (err) {
        console.error("Error fetching token balance:", err);
        setError("Failed to load balance");
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
        <span className="text-white">{balance}</span>
      ) : (
        <span className="text-zinc-400">0</span>
      )}
    </div>
  );
}
