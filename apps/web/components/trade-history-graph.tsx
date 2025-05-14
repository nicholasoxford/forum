"use client";
import { useEffect, useState, useRef } from "react";
import { server } from "@/utils/elysia";
import useSWR from "swr";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine,
  Area,
} from "recharts";
import { Loader2 } from "lucide-react";

type TimeFrame = "1m" | "1h" | "1d" | "1w" | "all";

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
  date: number;
  price: number;
};

type TradeHistoryGraphProps = {
  tokenMint: string;
  className?: string;
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const price = payload[0].value;
    const date = new Date(label);

    return (
      <div className="bg-zinc-900 border border-zinc-700 rounded-md p-3 shadow-lg">
        <p className="text-xs text-zinc-400">
          {date.toLocaleDateString()} {date.toLocaleTimeString()}
        </p>
        <p className="text-violet-300 font-medium text-sm mt-1">
          {price.toFixed(8)} SOL
        </p>
      </div>
    );
  }

  return null;
};

const TimeFrameButton = ({
  active,
  label,
  onClick,
}: {
  active: boolean;
  label: string;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
      active
        ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
        : "bg-zinc-800/50 text-zinc-400 border border-zinc-700/50 hover:bg-zinc-700/30 hover:text-zinc-300"
    }`}
  >
    {label}
  </button>
);

// Fetcher function for SWR
const fetcher = async (tokenMint: string) => {
  const response = await server["trade-stats"]({
    tokenMint,
  }).get({});

  if (response.error) {
    throw new Error("Failed to fetch trade history");
  }

  return response.data;
};

export function TradeHistoryGraph({
  tokenMint,
  className = "",
}: TradeHistoryGraphProps) {
  const [allChartData, setAllChartData] = useState<ProcessedDataPoint[]>([]);
  const [displayedChartData, setDisplayedChartData] = useState<
    ProcessedDataPoint[]
  >([]);
  const [timeFrame, setTimeFrame] = useState<TimeFrame>("1d");
  const [yDomain, setYDomain] = useState<[number, number] | undefined>(
    undefined
  );
  const prevDataRef = useRef<ProcessedDataPoint[]>([]);

  // Use SWR for data fetching with automatic revalidation
  const { data, error, isLoading } = useSWR(
    tokenMint ? tokenMint : null,
    fetcher,
    {
      refreshInterval: 5000, // Refresh every 5 seconds
      revalidateOnFocus: true,
    }
  );

  // Process data when it changes, merging with existing data instead of replacing
  useEffect(() => {
    if (data && data.tradeHistory) {
      const newProcessedData: ProcessedDataPoint[] = data.tradeHistory
        .filter((tx: TradeHistoryData) => tx.amountA && tx.amountB)
        .map((tx: TradeHistoryData) => {
          // Calculate price as SOL amount / token amount
          const solAmount = parseFloat(tx.amountA || "0");
          const tokenAmount = parseFloat(tx.amountB || "0");
          const price = tokenAmount > 0 ? solAmount / tokenAmount : 0;

          const date = new Date(tx.createdAt);

          return {
            timestamp: date.getTime(),
            date: date.getTime(),
            price,
          };
        });

      // Merge with existing data without duplicates
      const existingTimestamps = new Set(allChartData.map((d) => d.timestamp));
      const uniqueNewData = newProcessedData.filter(
        (d) => !existingTimestamps.has(d.timestamp)
      );

      const mergedData = [...allChartData, ...uniqueNewData].sort(
        (a, b) => a.timestamp - b.timestamp
      );

      setAllChartData(mergedData);
      prevDataRef.current = mergedData;
    }
  }, [data]);

  useEffect(() => {
    filterDataByTimeFrame(allChartData, timeFrame);
  }, [timeFrame, allChartData]);

  const filterDataByTimeFrame = (
    data: ProcessedDataPoint[],
    frame: TimeFrame
  ) => {
    if (!data.length) {
      setDisplayedChartData([]);
      return;
    }

    const now = Date.now();
    let filtered: ProcessedDataPoint[];

    switch (frame) {
      case "1m":
        // Last minute (60 seconds * 1000 milliseconds)
        filtered = data.filter((d) => now - d.timestamp <= 60 * 1000);
        break;
      case "1h":
        // Last hour (60 minutes * 60 seconds * 1000 milliseconds)
        filtered = data.filter((d) => now - d.timestamp <= 60 * 60 * 1000);
        break;
      case "1d":
        // Last day (24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
        filtered = data.filter((d) => now - d.timestamp <= 24 * 60 * 60 * 1000);
        break;
      case "1w":
        // Last week (7 days * 24 hours * 60 minutes * 60 seconds * 1000 milliseconds)
        filtered = data.filter(
          (d) => now - d.timestamp <= 7 * 24 * 60 * 60 * 1000
        );
        break;
      case "all":
      default:
        filtered = [...data];
        break;
    }

    // Ensure we have data to display
    filtered = filtered.length ? filtered : data;
    setDisplayedChartData(filtered);

    // Calculate domain with some stability - only change if values are significantly different
    if (filtered.length > 0) {
      const prices = filtered.map((d) => d.price);
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const buffer = (max - min) * 0.2; // 20% buffer

      // Only update domain if it's undefined or values are significantly different
      if (
        !yDomain ||
        min < yDomain[0] + buffer ||
        max > yDomain[1] - buffer ||
        min > yDomain[0] + buffer ||
        max < yDomain[1] - buffer
      ) {
        setYDomain([min - buffer, max + buffer]);
      }
    }
  };

  const handleTimeFrameChange = (frame: TimeFrame) => {
    setTimeFrame(frame);
    // Reset domain when timeframe changes
    setYDomain(undefined);
  };

  const formatXAxisTick = (timestamp: number) => {
    const date = new Date(timestamp);

    switch (timeFrame) {
      case "1m":
        return `${date.getSeconds()}s`;
      case "1h":
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
      case "1d":
        return `${date.getHours()}:${date.getMinutes().toString().padStart(2, "0")}`;
      case "1w":
        return date.toLocaleDateString(undefined, { weekday: "short" });
      default:
        return date.toLocaleDateString();
    }
  };

  if (isLoading) {
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
        <p>Error loading trade history</p>
      </div>
    );
  }

  if (allChartData.length === 0) {
    return (
      <div
        className={`text-center text-zinc-400 h-48 flex items-center justify-center ${className}`}
      >
        <p>No trade history available for this token yet</p>
      </div>
    );
  }

  // Calculate average for reference line
  const prices = displayedChartData.map((d) => d.price);
  const avgPrice =
    prices.reduce((sum, price) => sum + price, 0) / prices.length;

  return (
    <div className={`w-full ${className}`}>
      <div className="flex space-x-2 mb-2 justify-end">
        <TimeFrameButton
          active={timeFrame === "1m"}
          label="1M"
          onClick={() => handleTimeFrameChange("1m")}
        />
        <TimeFrameButton
          active={timeFrame === "1h"}
          label="1H"
          onClick={() => handleTimeFrameChange("1h")}
        />
        <TimeFrameButton
          active={timeFrame === "1d"}
          label="1D"
          onClick={() => handleTimeFrameChange("1d")}
        />
        <TimeFrameButton
          active={timeFrame === "1w"}
          label="1W"
          onClick={() => handleTimeFrameChange("1w")}
        />
        <TimeFrameButton
          active={timeFrame === "all"}
          label="ALL"
          onClick={() => handleTimeFrameChange("all")}
        />
      </div>

      <div className="w-full h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={displayedChartData}
            margin={{ top: 10, right: 20, left: 5, bottom: 20 }}
          >
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.6} />
            <XAxis
              dataKey="date"
              stroke="#888"
              tickFormatter={formatXAxisTick}
              minTickGap={50}
              tick={{ fontSize: 10 }}
              domain={["dataMin", "dataMax"]}
              type="number"
            />
            <YAxis
              stroke="#888"
              tickFormatter={(value) => value.toFixed(8)}
              tick={{ fontSize: 10 }}
              domain={yDomain}
              tickCount={5}
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine y={avgPrice} stroke="#666" strokeDasharray="3 3" />
            <Area
              type="monotone"
              dataKey="price"
              stroke="#9333ea"
              fillOpacity={1}
              fill="url(#colorPrice)"
              isAnimationActive={true}
              animationDuration={300}
              animationEasing="ease-in-out"
            />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#a855f7"
              strokeWidth={2.5}
              dot={false}
              isAnimationActive={true}
              animationDuration={300}
              animationEasing="ease-in-out"
              activeDot={{
                r: 6,
                stroke: "#9333ea",
                strokeWidth: 2,
                fill: "#1e1b24",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
