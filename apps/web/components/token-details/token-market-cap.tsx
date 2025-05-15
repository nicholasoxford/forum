"use client";

import { DollarSign } from "lucide-react";
import React from "react";

interface TokenMarketCapProps {
  marketCapUsd: number | null;
}

export function TokenMarketCap({ marketCapUsd }: TokenMarketCapProps) {
  // Format market cap with appropriate suffix (K, M, B) and commas
  const formatMarketCap = (value: number) => {
    if (value >= 1000000000) {
      return `$${(value / 1000000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}B`;
    } else if (value >= 1000000) {
      return `$${(value / 1000000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}K`;
    } else {
      return `$${value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }
  };

  if (!marketCapUsd) {
    return (
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Market Cap</p>
        <p className="text-white font-medium flex items-center gap-1">
          <DollarSign className="h-3.5 w-3.5 text-zinc-400" />
          <span>N/A</span>
        </p>
      </div>
    );
  }

  return (
    <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
      <p className="text-zinc-400 text-xs mb-1">Market Cap</p>
      <p className="text-white font-medium flex items-center gap-1">
        <DollarSign className="h-3.5 w-3.5 text-green-400" />
        <span>{formatMarketCap(marketCapUsd)}</span>
      </p>
    </div>
  );
}
