"use client";
import React from "react";
import useSWR from "swr";
import { server } from "@/utils/elysia";
import { Loader2, ExternalLink, TrendingUp, TrendingDown } from "lucide-react";

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

  if (!trades.length) {
    return (
      <div className="text-center text-zinc-400 h-full min-h-[200px] flex items-center justify-center">
        No trades yet
      </div>
    );
  }

  // Calculate price changes between trades
  const tradesWithChanges = trades.map(
    (trade: any, index: number, arr: any[]) => {
      if (index === arr.length - 1)
        return { ...trade, priceChange: 0, priceImpact: 0 };

      const currentPrice =
        parseFloat(trade.amountA || "0") / parseFloat(trade.amountB || "1");
      const nextPrice =
        parseFloat(arr[index + 1].amountA || "0") /
        parseFloat(arr[index + 1].amountB || "1");

      if (nextPrice === 0) return { ...trade, priceChange: 0, priceImpact: 0 };

      const priceChange = currentPrice - nextPrice;
      const priceImpact = (priceChange / nextPrice) * 100;

      return {
        ...trade,
        price: currentPrice,
        priceChange,
        priceImpact: priceImpact,
      };
    }
  );

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full text-xs md:text-sm">
        <thead className="bg-zinc-900/60 sticky top-0 z-10">
          <tr>
            <th className="px-2 py-2 text-left font-semibold">Time</th>
            <th className="px-2 py-2 text-center font-semibold">Type</th>
            <th className="px-2 py-2 text-right font-semibold">Size</th>
            <th className="px-2 py-2 text-right font-semibold hidden md:table-cell">
              Price
            </th>
            <th className="px-2 py-2 text-right font-semibold">Impact</th>
          </tr>
        </thead>
        <tbody>
          {tradesWithChanges.map((trade: any) => {
            const date = new Date(trade.createdAt);
            const isBuy = trade.type === "buy";
            const typeColor = isBuy
              ? "text-green-500 bg-green-900/20"
              : "text-red-500 bg-red-900/20";

            const impactColor =
              trade.priceImpact > 0
                ? "text-green-500"
                : trade.priceImpact < 0
                  ? "text-red-500"
                  : "text-zinc-400";

            const formattedImpact = Math.abs(trade.priceImpact).toFixed(2);
            const impactIcon =
              trade.priceImpact > 0 ? (
                <TrendingUp className="h-3 w-3 inline mr-1" />
              ) : trade.priceImpact < 0 ? (
                <TrendingDown className="h-3 w-3 inline mr-1" />
              ) : null;

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
                  <div className="flex flex-col">
                    <span>
                      {parseFloat(trade.amountB || "0").toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 4,
                        }
                      )}
                    </span>
                    <span className="text-zinc-500 text-2xs hidden md:block">
                      $
                      {parseFloat(trade.amountA || "0").toLocaleString(
                        undefined,
                        {
                          maximumFractionDigits: 2,
                        }
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-2 py-2 text-right font-mono hidden md:table-cell">
                  {trade.price
                    ? trade.price.toFixed(8)
                    : (
                        parseFloat(trade.amountA || "0") /
                        parseFloat(trade.amountB || "1")
                      ).toFixed(8)}
                </td>
                <td className={`px-2 py-2 text-right ${impactColor}`}>
                  {impactIcon}
                  {formattedImpact !== "0.00" ? `${formattedImpact}%` : "-"}
                  {trade.transactionSignature && (
                    <a
                      href={`https://explorer.solana.com/tx/${trade.transactionSignature}?cluster=mainnet-beta`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="ml-2 inline-flex items-center text-violet-400 hover:text-violet-300"
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
