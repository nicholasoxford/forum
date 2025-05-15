"use client";
import React from "react";
import useSWR from "swr";
import { server } from "@/utils/elysia";
import { Loader2, ExternalLink } from "lucide-react";

interface TradeTableProps {
  tokenMint: string;
}

export function TradeTable({ tokenMint }: TradeTableProps) {
  const { data, error, isLoading } = useSWR(
    tokenMint ? `trade-table-${tokenMint}` : null,
    async () => {
      const response = await server["trade-stats"]({ tokenMint }).get({});
      if (response.error) throw new Error("Failed to fetch trade history");
      return response.data;
    },
    { refreshInterval: 10000, revalidateOnFocus: true }
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[200px]">
        <Loader2 className="h-5 w-5 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center text-red-500 h-full min-h-[200px] flex items-center justify-center">
        Error loading trades
      </div>
    );
  }

  const trades = data.tradeHistory.slice(0, 15); // Show only the most recent 15 trades
  const tokenDecimals = data.tokenDecimals || 0;
  const SOL_DECIMALS = 9; // SOL has 9 decimals

  if (!trades.length) {
    return (
      <div className="text-center text-zinc-400 h-full min-h-[200px] flex items-center justify-center">
        No trades yet
      </div>
    );
  }

  // Process trades to calculate adjusted amounts
  const processedTrades = trades.map((trade: any) => {
    // Token amount adjusted for decimals
    const tokenAmount =
      parseFloat(trade.amountB || "0") / Math.pow(10, tokenDecimals);
    // SOL amount adjusted for 9 decimals
    const solAmount =
      parseFloat(trade.amountA || "0") / Math.pow(10, SOL_DECIMALS);

    return {
      ...trade,
      tokenAmount,
      solAmount,
    };
  });

  // Format number with consistent decimal places
  const formatNumber = (
    value: number,
    minimumFractionDigits = 4,
    maximumFractionDigits = 4
  ) => {
    return value.toLocaleString("en-US", {
      minimumFractionDigits,
      maximumFractionDigits,
    });
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs md:text-sm">
        <thead className="bg-zinc-900/60 sticky top-0 z-10">
          <tr>
            <th className="px-2 py-2 text-left font-semibold">Time</th>
            <th className="px-2 py-2 text-center font-semibold">Type</th>
            <th className="px-2 py-2 text-right font-semibold">Amount</th>
            <th className="px-2 py-2 text-right font-semibold">SOL</th>
            <th className="px-2 py-2 text-right font-semibold">Tx</th>
          </tr>
        </thead>
        <tbody>
          {processedTrades.map((trade: any) => {
            const date = new Date(trade.createdAt);
            const isBuy = trade.type === "buy";
            const typeColor = isBuy
              ? "text-green-500 bg-green-900/20"
              : "text-red-500 bg-red-900/20";

            return (
              <tr
                key={trade.id}
                className="border-b border-zinc-800/30 hover:bg-zinc-900/30 transition-colors"
              >
                <td className="px-2 py-2 whitespace-nowrap">
                  {date.toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </td>
                <td
                  className={`px-2 py-2 text-center font-bold uppercase rounded ${typeColor}`}
                >
                  {trade.type}
                </td>
                <td className="px-2 py-2 text-right font-mono">
                  {formatNumber(trade.tokenAmount)}
                </td>
                <td className="px-2 py-2 text-right font-mono">
                  ◎{formatNumber(trade.solAmount)}
                </td>
                <td className="px-2 py-2 text-right">
                  {trade.transactionSignature && (
                    <a
                      href={`https://explorer.solana.com/tx/${trade.transactionSignature}?cluster=mainnet-beta`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center text-violet-400 hover:text-violet-300"
                    >
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
