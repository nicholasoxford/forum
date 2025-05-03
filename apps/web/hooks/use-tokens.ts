import { useState, useEffect, useCallback } from "react";
import { Token } from "@/types/token";
import { server } from "@/utils/elysia";

// Get the API URL from environment variables

export function useTokens(showOnlyWithPools = true) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTokens = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch tokens from the server's endpoint
      const { data } = await server.tokens.index.get();

      if (data) {
        // If showOnlyWithPools is true, filter out tokens without pools
        const filteredTokens = showOnlyWithPools
          ? data.filter((token) => token.pool !== null)
          : data;

        setTokens(filteredTokens);
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
