"use client";
import React from "react";

interface TokenOnchainDetailsProps {
  tokenData: any;
}

export function TokenOnchainDetails({ tokenData }: TokenOnchainDetailsProps) {
  return (
    <div className="mb-2">
      <h2 className="text-lg font-semibold mb-3 text-white">
        On-chain Details
      </h2>
      <div className="space-y-2">
        <div className="flex flex-wrap justify-between items-center py-2 border-b border-zinc-800/50">
          <span className="text-zinc-400 text-sm">Token ID</span>
          <span className="text-white text-sm font-mono truncate max-w-xs">
            {tokenData.id}
          </span>
        </div>
        {tokenData.token_info?.token_program && (
          <div className="flex flex-wrap justify-between items-center py-2 border-b border-zinc-800/50">
            <span className="text-zinc-400 text-sm">Token Program</span>
            <span className="text-white text-sm font-mono truncate max-w-xs">
              {tokenData.token_info.token_program}
            </span>
          </div>
        )}
        {tokenData.token_info?.mint_authority && (
          <div className="flex flex-wrap justify-between items-center py-2 border-b border-zinc-800/50">
            <span className="text-zinc-400 text-sm">Mint Authority</span>
            <span className="text-white text-sm font-mono truncate max-w-xs">
              {tokenData.token_info.mint_authority}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
