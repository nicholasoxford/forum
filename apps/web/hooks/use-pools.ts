import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { Token } from "@/types/token";
import { server } from "@/utils/elysia";

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

      const { data, error } = await server.tokens.index.get();

      if (!error && data) {
        const allTokens: Token[] = data || [];

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
        throw new Error(error?.value.message || "Failed to fetch pools");
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
