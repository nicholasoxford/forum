import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Token } from "@/types/token";

export interface Pool {
  poolAddress: string;
  ownerAddress: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMintAddress: string;
  mintA: string; // SOL mint
  royaltiesBps: number;
}

export function usePools() {
  const [pools, setPools] = useState<Pool[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const wallet = useWallet();

  const fetchPools = async () => {
    if (!wallet.publicKey) {
      setPools([]);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch all tokens with pools
      const response = await fetch("/api/tokens");
      const data = await response.json();

      if (response.ok && data.success) {
        const allTokens: Token[] = data.tokens || [];

        // Filter tokens with pools where the connected wallet is the owner
        const ownerAddress = wallet.publicKey.toString();
        const userPools = allTokens
          .filter(
            (token) =>
              token.pool !== null &&
              token.pool.ownerAddress.toLowerCase() ===
                ownerAddress.toLowerCase()
          )
          .map((token) => ({
            poolAddress: token.pool!.poolAddress,
            ownerAddress: token.pool!.ownerAddress,
            tokenName: token.tokenName,
            tokenSymbol: token.tokenSymbol,
            tokenMintAddress: token.tokenMintAddress,
            mintA: token.pool!.mintA,
            royaltiesBps: token.pool!.royaltiesBps,
          }));

        setPools(userPools);
      } else {
        throw new Error(data.error || "Failed to fetch pools");
      }
    } catch (err: any) {
      console.error("Error fetching pools:", err);
      setError(err.message || "An error occurred while fetching pools");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPools();
  }, [wallet.publicKey]);

  return {
    pools,
    loading,
    error,
    refetch: fetchPools,
  };
}
