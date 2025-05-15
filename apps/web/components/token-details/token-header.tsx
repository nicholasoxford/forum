"use client";
import { TokenPriceDisplay } from "../token-price-display";
import React from "react";

interface TokenHeaderProps {
  tokenName: string;
  tokenSymbol: string;
  description?: string;
  tokenMint: string;
}

export function TokenHeader({
  tokenName,
  tokenSymbol,
  description,
  tokenMint,
}: TokenHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-start md:justify-between mb-2 gap-2">
      <div className="mb-2 md:mb-0">
        <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white flex items-center gap-2">
          {tokenName}
          {tokenSymbol && (
            <span className="text-zinc-400 text-lg md:text-xl font-normal">
              ${tokenSymbol}
            </span>
          )}
        </h1>
        <p className="text-zinc-400 text-sm md:text-base max-w-xl">
          {description || "No description available"}
        </p>
      </div>
      <TokenPriceDisplay tokenMint={tokenMint} className="md:text-right" />
    </div>
  );
}
