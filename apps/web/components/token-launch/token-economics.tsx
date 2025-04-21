import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Slider } from "@workspace/ui/components/slider";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";
import { DollarSign, Info, Users } from "lucide-react";

export interface TokenEconomicsProps {
  feeBps: number;
  setFeeBps: (feeBps: number) => void;
  initialMint: string;
  setInitialMint: (initialMint: string) => void;
  requiredHoldings: string;
  setRequiredHoldings: (requiredHoldings: string) => void;
  customMarketCap: string;
  setCustomMarketCap: (customMarketCap: string) => void;
  isCustomMarketCap: boolean;
  setIsCustomMarketCap: (isCustomMarketCap: boolean) => void;
  decimals: number;
  symbol: string;
  onBack: () => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const TokenEconomics = ({
  feeBps,
  setFeeBps,
  initialMint,
  setInitialMint,
  requiredHoldings,
  setRequiredHoldings,
  customMarketCap,
  setCustomMarketCap,
  isCustomMarketCap,
  setIsCustomMarketCap,
  decimals,
  symbol,
  onBack,
  onSubmit,
  isLoading,
}: TokenEconomicsProps) => {
  // Helper functions
  const setMarketCap = (amount: number) => {
    setIsCustomMarketCap(false);
    // Calculate total supply to achieve target market cap of $amount
    const supply = amount * Math.pow(10, decimals);
    setInitialMint(supply.toString());
  };

  const handleCustomMarketCapChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setCustomMarketCap(e.target.value);
    const value = parseFloat(e.target.value) || 0;
    const supply = value * Math.pow(10, decimals);
    setInitialMint(supply.toString());
  };

  const setRequiredTokens = (amount: number) => {
    setRequiredHoldings((amount * Math.pow(10, decimals)).toString());
  };

  // Derived values for display
  const estimatedMarketCap = parseFloat(initialMint) / Math.pow(10, decimals);
  const requiredTokensForChat =
    parseFloat(requiredHoldings) / Math.pow(10, decimals);
  const ownershipPercentage =
    (requiredTokensForChat /
      (parseFloat(initialMint) / Math.pow(10, decimals))) *
      100 || 0;

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-6">
        {/* Market Cap / Initial Supply Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-zinc-300 flex items-center gap-2">
              <DollarSign className="size-4 text-violet-400" />
              Target Market Cap
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-zinc-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-60 text-xs">
                      This sets your initial token supply to achieve the target
                      market cap.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={
                !isCustomMarketCap && estimatedMarketCap === 500
                  ? "default"
                  : "outline"
              }
              onClick={() => setMarketCap(500)}
              className={
                !isCustomMarketCap && estimatedMarketCap === 500
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              $500
            </Button>
            <Button
              variant={
                !isCustomMarketCap && estimatedMarketCap === 5000
                  ? "default"
                  : "outline"
              }
              onClick={() => setMarketCap(5000)}
              className={
                !isCustomMarketCap && estimatedMarketCap === 5000
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              $5,000
            </Button>
            <Button
              variant={
                !isCustomMarketCap && estimatedMarketCap === 10000
                  ? "default"
                  : "outline"
              }
              onClick={() => setMarketCap(10000)}
              className={
                !isCustomMarketCap && estimatedMarketCap === 10000
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              $10,000
            </Button>
            <Button
              variant={isCustomMarketCap ? "default" : "outline"}
              onClick={() => setIsCustomMarketCap(true)}
              className={
                isCustomMarketCap
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              Custom
            </Button>
          </div>

          {isCustomMarketCap && (
            <div className="pt-2">
              <div className="flex items-center gap-2">
                <span className="text-zinc-400 text-sm">$</span>
                <Input
                  value={customMarketCap}
                  onChange={handleCustomMarketCapChange}
                  type="number"
                  min="100"
                  placeholder="Enter market cap"
                  className="bg-black/40 border-zinc-800 focus:border-violet-500/50 text-white"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between">
            <p className="text-xs text-zinc-500">Total Supply:</p>
            <p className="text-violet-400 text-sm">
              {(
                parseFloat(initialMint) / Math.pow(10, decimals)
              ).toLocaleString()}{" "}
              {symbol || "Tokens"}
            </p>
          </div>
        </div>

        {/* Transaction Fee Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label
              htmlFor="feeBps"
              className="text-zinc-300 flex items-center gap-2"
            >
              Transaction Fee
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-zinc-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-60 text-xs">
                      Percentage fee applied to each token transfer. These fees
                      are distributed to token holders hourly.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
            <div className="text-sm text-violet-400 font-medium">
              {(feeBps / 100).toFixed(2)}%
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={feeBps === 50 ? "default" : "outline"}
              onClick={() => setFeeBps(50)}
              className={
                feeBps === 50
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              0.5%
            </Button>
            <Button
              variant={feeBps === 100 ? "default" : "outline"}
              onClick={() => setFeeBps(100)}
              className={
                feeBps === 100
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              1%
            </Button>
            <Button
              variant={feeBps === 250 ? "default" : "outline"}
              onClick={() => setFeeBps(250)}
              className={
                feeBps === 250
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              2.5%
            </Button>
            <Button
              variant={![50, 100, 250].includes(feeBps) ? "default" : "outline"}
              onClick={() => setFeeBps(300)}
              className={
                ![50, 100, 250].includes(feeBps)
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              Custom
            </Button>
          </div>

          {![50, 100, 250].includes(feeBps) && (
            <div className="pt-2">
              <Slider
                value={[feeBps]}
                min={10}
                max={500}
                step={10}
                onValueChange={(values) => setFeeBps(values[0] ?? 100)}
                disabled={isLoading}
                className="py-2"
              />
              <div className="flex justify-between text-xs text-zinc-500">
                <span>0.1%</span>
                <span>2.5%</span>
                <span>5%</span>
              </div>
            </div>
          )}
        </div>

        {/* Required Chat Ownership Section */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <Label className="text-zinc-300 flex items-center gap-2">
              <Users className="size-4 text-violet-400" />
              Required Chat Ownership
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info className="size-4 text-zinc-500" />
                  </TooltipTrigger>
                  <TooltipContent>
                    <p className="w-60 text-xs">
                      Minimum number of tokens a user must hold to join your
                      community chat.
                    </p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </Label>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              variant={requiredTokensForChat === 100 ? "default" : "outline"}
              onClick={() => setRequiredTokens(100)}
              className={
                requiredTokensForChat === 100
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              100 tokens
            </Button>
            <Button
              variant={requiredTokensForChat === 10000 ? "default" : "outline"}
              onClick={() => setRequiredTokens(10000)}
              className={
                requiredTokensForChat === 10000
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              10K tokens
            </Button>
            <Button
              variant={
                requiredTokensForChat === 1000000 ? "default" : "outline"
              }
              onClick={() => setRequiredTokens(1000000)}
              className={
                requiredTokensForChat === 1000000
                  ? "bg-violet-600"
                  : "border-zinc-800 bg-black/20 text-zinc-300"
              }
              size="sm"
            >
              1M tokens
            </Button>
          </div>

          <div className="flex justify-between">
            <p className="text-xs text-zinc-500">Share of Total Supply:</p>
            <p className="text-xs text-zinc-400">
              {ownershipPercentage.toFixed(4)}%
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between pt-4">
        <Button
          onClick={onBack}
          variant="outline"
          className="border-zinc-800 bg-black/20 text-zinc-300"
        >
          Back
        </Button>
        <Button
          onClick={onSubmit}
          disabled={isLoading}
          className="bg-violet-500 hover:bg-violet-600 text-white"
        >
          Create Token
        </Button>
      </div>
    </div>
  );
};
