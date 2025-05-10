"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { BuyTokenDialog } from "./buy-token-dialog";
import { SellTokenDialog } from "./sell-token-dialog";
import { type Token } from "@workspace/types";
import { Check } from "lucide-react";
import Link from "next/link";

interface TokenTableProps {
  tokens: Token[];
  loading: boolean;
  selectedTokenMint?: string;
  onSelectToken?: (tokenMintAddress: string) => void;
  title?: string;
  description?: string;
}

export function TokenTable({
  tokens,
  loading,
  selectedTokenMint,
  onSelectToken,
}: TokenTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (tokens.length === 0) {
    return (
      <div className="text-center py-4 text-zinc-500">No tokens available</div>
    );
  }

  return (
    <div className="rounded-md border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-zinc-100 dark:bg-zinc-800/50">
            <TableHead>Token</TableHead>
            <TableHead className="text-center">Fee</TableHead>
            <TableHead className="text-center">Pool</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tokens.map((token) => {
            const isSelected = selectedTokenMint === token.tokenMintAddress;
            const hasPool = token.pool !== null;
            const transferFeePercentage = (
              token.transferFeeBasisPoints / 100
            ).toFixed(2);

            return (
              <TableRow
                key={token.tokenMintAddress}
                className={
                  isSelected ? "bg-violet-50 dark:bg-violet-900/10" : ""
                }
                onClick={() => onSelectToken?.(token.tokenMintAddress)}
              >
                <TableCell className="font-medium">
                  <div>
                    <div className="flex items-center">
                      <Link
                        href={`/${token.tokenMintAddress}`}
                        className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <span className="font-medium">
                          {token.tokenName}{" "}
                          <span className="text-zinc-500">
                            ({token.tokenSymbol})
                          </span>
                        </span>
                      </Link>
                      {isSelected && (
                        <Check className="h-4 w-4 ml-2 text-violet-600" />
                      )}
                    </div>
                    <Link
                      href={`/${token.tokenMintAddress}`}
                      className="text-xs text-zinc-500 font-mono hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {token.tokenMintAddress.slice(0, 8)}...
                      {token.tokenMintAddress.slice(-8)}
                    </Link>
                  </div>
                </TableCell>
                <TableCell className="text-center">
                  <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400">
                    {transferFeePercentage}%
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  {hasPool ? (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block px-2 py-1 rounded text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400">
                      None
                    </span>
                  )}
                </TableCell>
                <TableCell className="flex justify-end gap-2 p-1">
                  {hasPool && (
                    <>
                      <BuyTokenDialog
                        tokenMint={token.tokenMintAddress}
                        tokenName={token.tokenName}
                        tokenSymbol={token.tokenSymbol}
                        transferFeePercentage={transferFeePercentage}
                        className="py-1 px-3 text-xs bg-violet-600 hover:bg-violet-700 text-white"
                      />

                      <SellTokenDialog
                        tokenMint={token.tokenMintAddress}
                        tokenName={token.tokenName}
                        tokenSymbol={token.tokenSymbol}
                        transferFeePercentage={transferFeePercentage}
                        className="py-1 px-3 text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
                      />
                    </>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
