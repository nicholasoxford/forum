import { TokenBalance } from "../token-balance";
import React from "react";

interface TokenBalanceCardProps {
  tokenMint: string;
  tokenSymbol: string;
}

export function TokenBalanceCard({
  tokenMint,
  tokenSymbol,
}: TokenBalanceCardProps) {
  return (
    <div className="mb-2 bg-black/40 border border-zinc-800/60 rounded-lg p-4">
      <h2 className="text-zinc-400 text-xs mb-1">Your Balance</h2>
      <div className="flex items-center gap-2">
        <TokenBalance tokenMint={tokenMint} />
        {tokenSymbol && <span className="text-zinc-400">{tokenSymbol}</span>}
      </div>
    </div>
  );
}
