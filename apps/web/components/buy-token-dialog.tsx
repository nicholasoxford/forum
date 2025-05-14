"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Alert, AlertDescription } from "@workspace/ui/components/alert";
import { WalletButton } from "@workspace/ui/components";
import { useBuyToken } from "@/hooks/use-buy-token";

interface BuyTokenDialogProps {
  tokenMint: string;
  tokenName: string;
  tokenSymbol: string;
  transferFeePercentage: string;
  className?: string;
}

export function BuyTokenDialog({
  tokenMint,
  tokenName,
  tokenSymbol,
  transferFeePercentage,
  className,
}: BuyTokenDialogProps) {
  const [open, setOpen] = useState(false);
  const [amount, setAmount] = useState("0.1");
  const {
    loading,
    status,
    poolInfo,
    txSignature,
    fetchPoolInfo,
    buyToken,
    connected,
  } = useBuyToken();

  useEffect(() => {
    if (open && tokenMint) {
      fetchPoolInfo(tokenMint);
    }
  }, [open, tokenMint, fetchPoolInfo]);

  const handleBuyToken = async () => {
    const success = await buyToken(
      tokenMint,
      amount,
      poolInfo?.poolAddress ?? ""
    );
    if (success) {
      // Auto-close after successful transaction with a delay
      setTimeout(() => setOpen(false), 3000);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          className={`bg-violet-600 hover:bg-violet-700 text-white ${className}`}
        >
          Buy {tokenSymbol}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Buy {tokenName} ({tokenSymbol})
          </DialogTitle>
          <DialogDescription>
            Purchase tokens to join the group chat and earn fees
          </DialogDescription>
        </DialogHeader>

        {!connected ? (
          <div className="flex flex-col items-center py-4 space-y-4">
            <p className="text-center text-sm text-zinc-500">
              Connect your wallet to buy tokens
            </p>
            <WalletButton />
          </div>
        ) : (
          <>
            <div className="grid gap-4 py-4">
              {status.type && (
                <Alert
                  className={
                    status.type === "error"
                      ? "bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800"
                      : status.type === "success"
                        ? "bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800"
                        : "bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800"
                  }
                >
                  <AlertDescription>{status.message}</AlertDescription>

                  {txSignature && (
                    <div className="mt-2">
                      <a
                        href={`https://explorer.solana.com/tx/${txSignature}?cluster=mainnet-beta`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        View on Solana Explorer{" "}
                        <ExternalLink className="ml-1 h-3 w-3" />
                      </a>
                    </div>
                  )}
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="amount">Amount (SOL)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  placeholder="0.1"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="text-zinc-500">Token Fee</span>
                <span className="font-medium text-green-600">
                  {transferFeePercentage}%
                </span>
              </div>

              {poolInfo?.poolAddress && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-zinc-500">Pool</span>
                  <span className="font-mono text-xs">
                    {poolInfo.poolAddress.substring(0, 6)}...
                    {poolInfo.poolAddress.substring(
                      poolInfo.poolAddress.length - 6
                    )}
                  </span>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button onClick={handleBuyToken} disabled={loading || !poolInfo}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Processing...
                  </>
                ) : (
                  `Buy ${tokenSymbol}`
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
