"use client";

import { server } from "@/utils/elysia";
import { ArrowDown, ArrowUp, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import useSWR from "swr";

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

      const currentPrice =
        parseFloat(latestTx.amountA) / parseFloat(latestTx.amountB);

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

      const oldPrice =
        parseFloat(oldestTx.amountA) / parseFloat(oldestTx.amountB);

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

  const solPrice = data.solPrice; // SOL price in USD
  let latestPrice = data.latestPrice; // Token price in SOL
  let latestPriceUsd = data.latestPriceUsd; // Token price in USD

  // If direct USD price is not available, calculate it
  if (latestPrice && solPrice && !latestPriceUsd) {
    latestPriceUsd = latestPrice * solPrice;
  }

  const formattedPrice = latestPrice
    ? latestPrice < 0.000001
      ? latestPrice.toExponential(4)
      : latestPrice.toFixed(8)
    : "N/A";

  const formattedUsdPrice = latestPriceUsd
    ? latestPriceUsd < 0.000001
      ? `$${latestPriceUsd.toExponential(2)}`
      : `$${latestPriceUsd.toFixed(latestPriceUsd < 0.01 ? 6 : 4)}`
    : "N/A";

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
      <div className="flex items-center gap-1">
        <span className="text-3xl font-bold font-mono text-white">
          {formattedPrice}
        </span>
        <span className="text-zinc-400 text-sm">SOL</span>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-lg text-zinc-300">{formattedUsdPrice}</span>

        {priceChange.percent !== null && (
          <div className={`flex items-center gap-0.5 ${getPriceChangeColor()}`}>
            {getPriceChangeIcon()}
            <span className="text-sm font-medium">
              {Math.abs(priceChange.percent).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="text-xs text-zinc-500 mt-1">
        {data?.tradeHistory?.length > 0 && data.tradeHistory[0]?.createdAt
          ? `Last trade: ${new Date(data.tradeHistory[0].createdAt).toLocaleTimeString()}`
          : "No trades yet"}
      </div>
    </div>
  );
}
