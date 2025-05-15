"use client";
import React from "react";
import { TokenMarketCap } from "./token-market-cap";

interface TokenMetricsProps {
  interface: string;
  supply?: string;
  decimals?: number;
  transferFeePercentage: string;
  marketCapUsd: number | null;
}

export function TokenMetrics({
  interface: tokenInterface,
  supply,
  decimals,
  transferFeePercentage,
  marketCapUsd,
}: TokenMetricsProps) {
  // Helper to format large supply numbers into human-readable words
  const formatSupply = (value: number) => {
    if (value >= 1_000_000_000_000) {
      return `${(value / 1_000_000_000_000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} trillion`;
    }
    if (value >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} billion`;
    }
    if (value >= 1_000_000) {
      return `${(value / 1_000_000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} million`;
    }
    if (value >= 1_000) {
      return `${(value / 1_000).toLocaleString(undefined, {
        maximumFractionDigits: 2,
      })} thousand`;
    }
    return value.toLocaleString();
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-2">
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Token Type</p>
        <p className="text-white font-medium">{tokenInterface}</p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Supply</p>
        <p className="text-white font-medium">
          {supply && decimals
            ? formatSupply(Number(supply) / Math.pow(10, decimals))
            : "Unknown"}
        </p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Decimals</p>
        <p className="text-white font-medium">{decimals ?? "Unknown"}</p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Transfer Fee</p>
        <p className="text-green-400 font-medium">{transferFeePercentage}%</p>
      </div>
      <div className="col-span-2 md:col-span-1">
        <TokenMarketCap marketCapUsd={marketCapUsd} />
      </div>
    </div>
  );
}
