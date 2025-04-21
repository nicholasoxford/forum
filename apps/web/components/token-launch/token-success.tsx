import { Button } from "@workspace/ui/components/button";
import { Check } from "lucide-react";
import Link from "next/link";

export interface TokenSuccessProps {
  name: string;
  symbol: string;
  mintAddress: string;
  initialMint: string;
  requiredHoldings: string;
  decimals: number;
  telegramChannelId: string | null;
  telegramUsername?: string | null;
}

export const TokenSuccess = ({
  name,
  symbol,
  mintAddress,
  initialMint,
  requiredHoldings,
  decimals,
  telegramChannelId,
  telegramUsername,
}: TokenSuccessProps) => {
  const requiredTokensForChat =
    parseFloat(requiredHoldings) / Math.pow(10, decimals);

  return (
    <div className="flex flex-col items-center justify-center text-center p-6">
      <div className="size-16 bg-green-500/20 text-green-500 rounded-full flex items-center justify-center mb-6">
        <Check className="size-8" />
      </div>
      <h3 className="text-2xl font-display font-bold text-white mb-2">
        Success! Your Token is Live
      </h3>
      <p className="text-zinc-400 max-w-md">
        Congratulations! You've successfully created your token and community.
        Users can now join your community by acquiring your token.
      </p>

      <div className="w-full max-w-md mt-8 space-y-4">
        <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
          <div className="text-xs text-zinc-500 mb-1">Token Name</div>
          <div className="text-white font-medium">{name}</div>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
          <div className="text-xs text-zinc-500 mb-1">Token Symbol</div>
          <div className="text-white font-medium">{symbol}</div>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
          <div className="text-xs text-zinc-500 mb-1">Token Address</div>
          <div className="text-white font-medium break-all text-sm">
            {mintAddress}
          </div>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
          <div className="text-xs text-zinc-500 mb-1">Initial Supply</div>
          <div className="text-white font-medium">
            {(
              parseFloat(initialMint) / Math.pow(10, decimals)
            ).toLocaleString()}{" "}
            {symbol}
          </div>
        </div>

        <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
          <div className="text-xs text-zinc-500 mb-1">
            Required Token Balance
          </div>
          <div className="text-white font-medium">
            {requiredTokensForChat.toLocaleString()} {symbol}
          </div>
        </div>

        {telegramChannelId && (
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
            <div className="text-xs text-zinc-500 mb-1">Telegram Channel</div>
            <div className="text-white font-medium break-all">
              {telegramChannelId}
            </div>
          </div>
        )}

        {telegramUsername && (
          <div className="bg-black/40 border border-zinc-800 rounded-lg p-4 text-left">
            <div className="text-xs text-zinc-500 mb-1">Telegram Username</div>
            <div className="text-white font-medium">
              <a
                href={`https://t.me/${telegramUsername}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-400 hover:text-violet-300 transition-colors"
              >
                @{telegramUsername}
              </a>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mt-8">
        <Button
          className="bg-violet-500 hover:bg-violet-600 text-white"
          onClick={() =>
            window.open(
              `https://explorer.solana.com/address/${mintAddress}`,
              "_blank"
            )
          }
        >
          View on Explorer
        </Button>
        <Link href={`/${mintAddress}`}>
          <Button className="bg-blue-500 hover:bg-blue-600 text-white">
            View Token Details
          </Button>
        </Link>
        <Button
          variant="outline"
          className="border-zinc-700 bg-black/40 hover:bg-black/60 text-zinc-200"
          onClick={() => (window.location.href = "/")}
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
};
