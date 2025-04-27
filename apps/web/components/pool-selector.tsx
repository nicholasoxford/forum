"use client";

import { Pool, usePools } from "@/hooks/use-pools";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table";
import { Label } from "@workspace/ui/components/label";
import { Skeleton } from "@workspace/ui/components/skeleton";
import { AlertCircle } from "lucide-react";

interface PoolSelectorProps {
  selectedPoolAddress: string | undefined;
  onSelectPool: (pool: Pool) => void;
}

export function PoolSelector({
  selectedPoolAddress,
  onSelectPool,
}: PoolSelectorProps) {
  const { pools, loading, error } = usePools();

  if (loading) {
    return (
      <div className="space-y-3">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center p-4 text-red-700 bg-red-50 dark:bg-red-900/20 dark:text-red-300 rounded-md">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>{error}</p>
      </div>
    );
  }

  if (pools.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500 bg-gray-50 dark:bg-gray-800/40 rounded-md">
        <p>
          You don&apos;t have any pools yet. Create a token first to have a
          pool.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Token</TableHead>
            <TableHead>Pool Address</TableHead>
            <TableHead className="text-right">Royalty %</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {pools.map((pool) => (
            <TableRow
              key={pool.poolAddress}
              className={`cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 ${
                selectedPoolAddress === pool.poolAddress
                  ? "bg-blue-50 dark:bg-blue-900/20"
                  : ""
              }`}
              onClick={() => onSelectPool(pool)}
            >
              <TableCell>
                <Label className="font-medium cursor-pointer">
                  {pool.tokenName} ({pool.tokenSymbol})
                </Label>
              </TableCell>
              <TableCell>
                <span className="text-xs font-mono">
                  {pool.poolAddress.substring(0, 6)}...
                  {pool.poolAddress.substring(pool.poolAddress.length - 4)}
                </span>
              </TableCell>
              <TableCell className="text-right">
                {(pool.royaltiesBps / 100).toFixed(2)}%
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
