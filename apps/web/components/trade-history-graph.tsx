"use client";
import { useEffect, useState } from "react";
import { server } from "@/utils/elysia";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { Loader2 } from "lucide-react";

type TradeHistoryData = {
  id: number;
  type: string;
  status: string;
  transactionSignature?: string;
  amountA?: string;
  amountB?: string;
  createdAt: string;
};

type ProcessedDataPoint = {
  timestamp: number;
  date: string;
  price: number;
};

type TradeHistoryGraphProps = {
  tokenMint: string;
  className?: string;
};

export function TradeHistoryGraph({
  tokenMint,
  className = "",
}: TradeHistoryGraphProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [chartData, setChartData] = useState<ProcessedDataPoint[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await server["trade-stats"]({
          tokenMint,
        }).get({});

        if (response.error) {
          setError("An error occurred");
          return;
        }

        // Process the trade history data for the chart
        if (response.data && response.data.tradeHistory) {
          const processedData: ProcessedDataPoint[] = response.data.tradeHistory
            .filter((tx: TradeHistoryData) => tx.amountA && tx.amountB)
            .map((tx: TradeHistoryData) => {
              // Calculate price as SOL amount / token amount
              const solAmount = parseFloat(tx.amountA || "0");
              const tokenAmount = parseFloat(tx.amountB || "0");
              const price = tokenAmount > 0 ? solAmount / tokenAmount : 0;

              const date = new Date(tx.createdAt);

              return {
                timestamp: date.getTime(),
                date:
                  date.toLocaleDateString() + " " + date.toLocaleTimeString(),
                price,
              };
            })
            .sort(
              (a: ProcessedDataPoint, b: ProcessedDataPoint) =>
                a.timestamp - b.timestamp
            );

          setChartData(processedData);
        } else {
          setChartData([]);
        }
      } catch (err) {
        console.error("Error fetching trade history:", err);
        setError("Failed to load trade history");
      } finally {
        setLoading(false);
      }
    };

    if (tokenMint) {
      fetchData();
    }
  }, [tokenMint]);

  if (loading) {
    return (
      <div className={`flex justify-center items-center h-48 ${className}`}>
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={`text-center text-red-500 h-48 flex items-center justify-center ${className}`}
      >
        <p>Error loading trade history: {error}</p>
      </div>
    );
  }

  if (chartData.length === 0) {
    return (
      <div
        className={`text-center text-zinc-400 h-48 flex items-center justify-center ${className}`}
      >
        <p>No trade history available for this token yet</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-64 ${className}`}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={chartData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis
            dataKey="date"
            stroke="#888"
            tickFormatter={(value: string) => {
              const date = new Date(value);
              return date.toLocaleDateString();
            }}
          />
          <YAxis stroke="#888" />
          <Tooltip
            contentStyle={{ backgroundColor: "#111", border: "1px solid #333" }}
            labelStyle={{ color: "#fff" }}
            formatter={(value: any) => [`${value.toFixed(6)} SOL`, "Price"]}
          />
          <Line
            type="monotone"
            dataKey="price"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ r: 4, strokeWidth: 2, stroke: "#8b5cf6", fill: "black" }}
            activeDot={{
              r: 6,
              stroke: "#8b5cf6",
              strokeWidth: 2,
              fill: "black",
            }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
