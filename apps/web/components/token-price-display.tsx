"use client";

import { server } from "@/utils/elysia";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";
import { LAMPORTS_PER_SOL } from "@solana/web3.js";

interface TokenPriceDisplayProps {
  tokenMint: string;
  className?: string;
}

// Fetcher function for SWR
const fetcher = async (tokenMint: string) => {
  const response = await server["trade-stats"]({
    tokenMint,
  }).get({});

  if (response.error) {
    throw new Error("Failed to fetch trade stats");
  }

  return response.data;
};

export function TokenPriceDisplay({
  tokenMint,
  className = "",
}: TokenPriceDisplayProps) {
  // Use SWR for data fetching with automatic revalidation
  const { data, error, isLoading } = useSWR(
    tokenMint ? `price-${tokenMint}` : null,
    () => fetcher(tokenMint),
    {
      refreshInterval: 10000, // Refresh every 10 seconds
      revalidateOnFocus: true,
    }
  );

  // Calculate 24h price change if we have trade history data
  const [priceChange, setPriceChange] = useState<{
    percent: number | null;
    absolute: number | null;
  }>({
    percent: null,
    absolute: null,
  });

  useEffect(() => {
    if (data?.tradeHistory && data.tradeHistory.length > 0) {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get current price
      const latestTx = data.tradeHistory[0];
      if (!latestTx || !latestTx.amountA || !latestTx.amountB) return;

      const tokenDecimals = data.tokenDecimals || 0;

      // Calculate per-token price properly
      const solAmount = parseFloat(latestTx.amountA) / LAMPORTS_PER_SOL;
      const tokenAmount =
        parseFloat(latestTx.amountB) / Math.pow(10, tokenDecimals);
      const currentPrice = solAmount / tokenAmount;

      // Find a transaction close to 24h ago
      let oldestIdx = data.tradeHistory.length - 1;
      for (let i = 0; i < data.tradeHistory.length; i++) {
        const txDate = new Date(data.tradeHistory[i]?.createdAt || 0);
        if (txDate < yesterday) {
          oldestIdx = i;
          break;
        }
      }

      const oldestTx = data.tradeHistory[oldestIdx];
      if (!oldestTx || !oldestTx.amountA || !oldestTx.amountB) return;

      // Calculate old per-token price properly
      const oldSolAmount = parseFloat(oldestTx.amountA) / LAMPORTS_PER_SOL;
      const oldTokenAmount =
        parseFloat(oldestTx.amountB) / Math.pow(10, tokenDecimals);
      const oldPrice = oldSolAmount / oldTokenAmount;

      if (oldPrice > 0) {
        const absoluteChange = currentPrice - oldPrice;
        const percentChange = (absoluteChange / oldPrice) * 100;

        setPriceChange({
          percent: percentChange,
          absolute: absoluteChange,
        });
      }
    }
  }, [data]);

  if (isLoading) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
        <span className="text-zinc-400">Loading price...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={`text-zinc-400 ${className}`}>
        <span>Price unavailable</span>
      </div>
    );
  }

  const tokenDecimals = data.tokenDecimals || 0;
  const solPrice = data.solPrice || 0; // SOL price in USD

  // Calculate per-token prices directly from the most recent transaction
  let latestPrice = 0;
  let latestPriceUsd = 0;

  if (data.tradeHistory && data.tradeHistory.length > 0) {
    const latestTx = data.tradeHistory[0];
    if (latestTx?.amountA && latestTx?.amountB) {
      // Convert raw token amount using decimals
      const solAmount = parseFloat(latestTx.amountA) / LAMPORTS_PER_SOL;
      const tokenAmount =
        parseFloat(latestTx.amountB) / Math.pow(10, tokenDecimals);

      // Calculate price per token
      latestPrice = solAmount / tokenAmount;

      // Calculate USD price if SOL price is available
      if (solPrice) {
        latestPriceUsd = latestPrice * solPrice;
      }
    }
  } else if (data.latestPrice) {
    // Use server-provided price as fallback
    latestPrice = data.latestPrice;
    latestPriceUsd = data.latestPriceUsd || latestPrice * solPrice;
  }

  // Format SOL price based on its magnitude
  const formatSolPrice = (price: number) => {
    if (isNaN(price) || price === 0) return "N/A";

    if (price < 0.000001) return price.toFixed(10);
    if (price < 0.0001) return price.toFixed(8);
    if (price < 0.01) return price.toFixed(6);
    if (price < 1) return price.toFixed(4);
    if (price < 1000) return price.toFixed(2);
    return price.toLocaleString(undefined, { maximumFractionDigits: 2 });
  };

  // Format USD price based on its magnitude
  const formatUsdPrice = (price: number) => {
    if (isNaN(price) || price === 0) return "N/A";

    if (price < 0.000001) return `$${price.toExponential(2)}`;
    if (price < 0.0001) return `$${price.toFixed(6)}`;
    if (price < 0.01) return `$${price.toFixed(4)}`;
    if (price < 1) return `$${price.toFixed(3)}`;
    if (price < 1000) return `$${price.toFixed(2)}`;
    return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`;
  };

  const formattedPrice = formatSolPrice(latestPrice);
  const formattedUsdPrice = formatUsdPrice(latestPriceUsd);

  const getPriceChangeColor = () => {
    if (!priceChange.percent) return "text-zinc-400";
    return priceChange.percent > 0 ? "text-green-500" : "text-red-500";
  };

  const getPriceChangeIcon = () => {
    if (!priceChange.percent) return null;
    return priceChange.percent > 0 ? (
      <ArrowUp className="h-3 w-3" />
    ) : (
      <ArrowDown className="h-3 w-3" />
    );
  };

  return (
    <div className={`flex flex-col ${className}`}>
      {/* USD price - display first and prominent */}
      <div className="flex items-center gap-1">
        <span className="text-3xl font-bold font-mono text-white">
          {formattedUsdPrice}
        </span>
      </div>

      {/* Price change percentage */}
      {priceChange.percent !== null && (
        <div className={`flex items-center gap-0.5 ${getPriceChangeColor()}`}>
          {getPriceChangeIcon()}
          <span className="text-sm font-medium">
            {Math.abs(priceChange.percent).toFixed(2)}%
          </span>
        </div>
      )}

      {/* SOL price - display second as secondary info */}
      <div className="flex items-center gap-2 mt-1">
        <span className="text-sm text-zinc-400">{formattedPrice} SOL</span>
      </div>

      <div className="text-xs text-zinc-500 mt-1">
        {data?.tradeHistory?.length > 0 && data.tradeHistory[0]?.createdAt
          ? `Last trade: ${new Date(data.tradeHistory[0].createdAt).toLocaleTimeString()}`
          : "No trades yet"}
      </div>
    </div>
  );
}
