import { useState, useEffect, useCallback } from "react";
import { Token } from "@/types/token";

// Get the API URL from environment variables
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5050";

export function useTokens(showOnlyWithPools = true) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tokens from the server's new endpoint
      const response = await fetch(`${API_URL}/tokens`);
      const data = await response.json();

      if (data.success) {
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
  }, [showOnlyWithPools]);

  useEffect(() => {
    fetchTokens();
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}
