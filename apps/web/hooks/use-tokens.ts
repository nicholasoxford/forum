import { useState, useEffect } from "react";
import { Token } from "@/types/token";

export function useTokens(showOnlyWithPools = true) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/tokens");
      const data = await response.json();

      if (response.ok && data.success) {
        const allTokens = data.tokens || [];
        // If showOnlyWithPools is true, filter out tokens without pools
        const filteredTokens = showOnlyWithPools
          ? allTokens.filter((token: Token) => token.pool !== null)
          : allTokens;

        setTokens(filteredTokens);
      } else {
        throw new Error(data.error || "Failed to fetch tokens");
      }
    } catch (err: any) {
      console.error("Error fetching tokens:", err);
      setError(err.message || "An error occurred while fetching tokens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTokens();
  }, [showOnlyWithPools]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}
