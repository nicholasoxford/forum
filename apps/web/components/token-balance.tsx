"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { server } from "@/utils/elysia";

interface TokenBalanceProps {
  tokenMint: string;
}

interface TokenAmount {
  amount: string;
  decimals: number;
  uiAmount: number;
  uiAmountString: string;
}

interface TokenBalanceResponse {
  wallet: string;
  mint: string;
  balance: TokenAmount;
  tokenAccount: string;
  exists: boolean;
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

        const result = await server.tokens.balance.get({
          query: {
            wallet: publicKey.toString(),
            mint: tokenMint,
          },
        });

        // Type assertion for the response
        const responseData = result as unknown as TokenBalanceResponse;

        if (responseData.exists) {
          setBalance(responseData.balance.uiAmountString);
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
        <span className="text-white">{balance}</span>
      ) : (
        <span className="text-zinc-400">0</span>
      )}
    </div>
  );
}
