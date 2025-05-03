"use client";

import { server } from "@/utils/elysia";
import { useState, useCallback } from "react";

export interface PoolInfo {
  success: boolean;
  token?: {
    tokenName: string;
    tokenSymbol: string;
    transferFeeBasisPoints: number;
    tokenMintAddress: string;
    decimals: number;
    maximumFee: string;
    metadataUri: string;
    targetMarketCap: string;
  };
  poolAddress?: string;
  pool?: any; // Adding pool property that's being checked in the component
  error?: string;
}

export interface PoolInfoStatus {
  type: "success" | "error" | "info" | null;
  message: string;
}

export function usePoolInfo() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<PoolInfoStatus>({
    type: null,
    message: "",
  });
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);

  // Fetch pool info for a token
  const fetchPoolInfo = useCallback(async (tokenMint: string) => {
    if (!tokenMint || tokenMint.length < 32) {
      setPoolInfo(null);
      return null;
    }

    try {
      setLoading(true);
      setStatus({ type: "info", message: "Fetching pool information..." });

      const { data, error } = await server.tokens({ tokenMint }).pool.get();

      if (error) {
        setStatus({
          type: "error",
          message: error.value?.message || "Failed to fetch pool information",
        });
        setPoolInfo(null);
        return null;
      }

      if (data) {
        setPoolInfo(data);
        setStatus({ type: null, message: "" });
        return data;
      }

      setStatus({
        type: "error",
        message: "No data returned from server",
      });
      setPoolInfo(null);
      return null;
    } catch (error: unknown) {
      setStatus({
        type: "error",
        message:
          error instanceof Error
            ? error.message
            : "Failed to fetch pool information",
      });
      setPoolInfo(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    status,
    poolInfo,
    fetchPoolInfo,
  };
}
