"use client";
import React from "react";

interface TokenMetricsProps {
  interface: string;
  supply?: string;
  decimals?: number;
  transferFeePercentage: string;
}

export function TokenMetrics({
  interface: tokenInterface,
  supply,
  decimals,
  transferFeePercentage,
}: TokenMetricsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-2">
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Token Type</p>
        <p className="text-white font-medium">{tokenInterface}</p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Supply</p>
        <p className="text-white font-medium">
          {supply ? Number(supply).toLocaleString() : "Unknown"}
        </p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
        <p className="text-zinc-400 text-xs mb-1">Decimals</p>
        <p className="text-white font-medium">{decimals ?? "Unknown"}</p>
      </div>
      <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4 col-span-2 md:col-span-1">
        <p className="text-zinc-400 text-xs mb-1">Transfer Fee</p>
        <p className="text-green-400 font-medium">{transferFeePercentage}%</p>
      </div>
    </div>
  );
}
