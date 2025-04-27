import React from "react";
import { Check } from "lucide-react";
import { type Token } from "@/types/token";
import { BuyTokenDialog } from "./buy-token-dialog";
import { SellTokenDialog } from "./sell-token-dialog";

interface TokenCardProps {
  token: Token;
  isSelected?: boolean;
  onClick?: () => void;
}

export function TokenCard({ token, isSelected, onClick }: TokenCardProps) {
  const hasPool = token.pool !== null;
  const transferFeePercentage = (token.transferFeeBasisPoints / 100).toFixed(2);

  return (
    <div
      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
        isSelected
          ? "bg-primary/10 border-primary"
          : "hover:bg-gray-100 dark:hover:bg-gray-800"
      }`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">
            {token.tokenName} ({token.tokenSymbol})
          </h3>
          <p className="text-xs text-gray-500 mt-1 font-mono">
            {token.tokenMintAddress.slice(0, 8)}...
            {token.tokenMintAddress.slice(-8)}
          </p>
        </div>
        <div className="flex items-center">
          <span className="text-xs mr-2">Fee: {transferFeePercentage}%</span>
          {isSelected && <Check className="h-4 w-4 text-primary" />}
        </div>
      </div>
      {!hasPool && (
        <div className="mt-2 text-xs text-amber-600 dark:text-amber-400">
          No trading pool available
        </div>
      )}

      {hasPool && (
        <div className="flex gap-2 mt-3">
          <BuyTokenDialog
            tokenMint={token.tokenMintAddress}
            tokenName={token.tokenName}
            tokenSymbol={token.tokenSymbol}
            transferFeePercentage={transferFeePercentage}
            className="flex-1 py-1 text-sm bg-violet-600 hover:bg-violet-700 text-white"
          />

          <SellTokenDialog
            tokenMint={token.tokenMintAddress}
            tokenName={token.tokenName}
            tokenSymbol={token.tokenSymbol}
            transferFeePercentage={transferFeePercentage}
            className="flex-1 py-1 text-sm bg-emerald-600 hover:bg-emerald-700 text-white"
          />
        </div>
      )}
    </div>
  );
}
