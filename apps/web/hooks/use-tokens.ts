import { useState, useEffect, useCallback, useRef } from "react";
import { Token } from "@workspace/types";
import { server } from "@/utils/elysia";

// Get the API URL from environment variables

export function useTokens(showOnlyWithPools = true) {
  const [tokens, setTokens] = useState<Token[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Use a ref to track if initial fetch has happened
  const initialFetchDone = useRef(false);

  const fetchTokens = useCallback(async () => {
    // Skip if we're already loading
    if (loading) return;

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
  }, [showOnlyWithPools, loading]);

  useEffect(() => {
    // Only fetch if we haven't done the initial fetch yet
    if (!initialFetchDone.current) {
      fetchTokens();
      initialFetchDone.current = true;
    }
  }, [fetchTokens]);

  return {
    tokens,
    loading,
    error,
    refetch: fetchTokens,
  };
}
