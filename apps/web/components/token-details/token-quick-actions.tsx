"use client";
import { Button } from "@workspace/ui/components/button";
import { BuyTokenDialog } from "../buy-token-dialog";
import { SellTokenDialog } from "../sell-token-dialog";
import { Copy, ExternalLink, MessageSquare } from "lucide-react";
import React from "react";

interface TokenQuickActionsProps {
  tokenImage: string;
  tokenName: string;
  tokenSymbol: string;
  tokenMint: string;
  transferFeePercentage: string;
}

export function TokenQuickActions({
  tokenImage,
  tokenName,
  tokenSymbol,
  tokenMint,
  transferFeePercentage,
}: TokenQuickActionsProps) {
  return (
    <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col items-center">
      {tokenImage ? (
        <div className="relative aspect-square rounded-lg overflow-hidden mb-4 border border-violet-500/20 shadow-xl shadow-violet-500/10 w-full max-w-[180px] mx-auto">
          <img
            src={tokenImage}
            alt={tokenName}
            className="object-cover w-full h-full"
            width={180}
            height={180}
          />
        </div>
      ) : (
        <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-violet-900/20 flex items-center justify-center border border-violet-500/20 w-full max-w-[180px] mx-auto">
          <span className="text-4xl font-bold text-violet-500/50">
            {tokenSymbol?.substring(0, 2) || "??"}
          </span>
        </div>
      )}
      <Button className="mt-2 bg-violet-500 hover:bg-violet-600 text-white w-full flex items-center justify-center gap-2 group relative overflow-hidden">
        <span className="relative z-10 flex items-center justify-center">
          <MessageSquare className="h-4 w-4 mr-2" />
          Join Group Chat
        </span>
        <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
      </Button>
      <div className="flex gap-2 mt-2 w-full">
        <BuyTokenDialog
          tokenMint={tokenMint}
          tokenName={tokenName}
          tokenSymbol={tokenSymbol}
          transferFeePercentage={transferFeePercentage}
          className="flex-1"
        />
        <SellTokenDialog
          tokenMint={tokenMint}
          tokenName={tokenName}
          tokenSymbol={tokenSymbol}
          transferFeePercentage={transferFeePercentage}
          className="flex-1"
        />
      </div>
      <div className="flex gap-2 mt-3 w-full">
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400 transition-all"
        >
          <Copy className="h-3.5 w-3.5 mr-1" />
          Copy Address
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 text-xs border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400 transition-all"
        >
          <ExternalLink className="h-3.5 w-3.5 mr-1" />
          Explorer
        </Button>
      </div>
      <div className="mt-4 w-full text-center">
        <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
          Fee: {transferFeePercentage}%
        </span>
      </div>
    </div>
  );
}
