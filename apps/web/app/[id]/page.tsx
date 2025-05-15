import { redirect } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { Copy, ExternalLink, MessageSquare } from "lucide-react";
import { BuyTokenDialog } from "@/components/buy-token-dialog";
import { SellTokenDialog } from "@/components/sell-token-dialog";
import { TokenBalance } from "@/components/token-balance";
import { server } from "@/utils/elysia";
import { TradeHistoryGraph } from "@/components/trade-history-graph";
import { TokenPriceDisplay } from "@/components/token-price-display";
import { TokenQuickActions } from "@/components/token-details/token-quick-actions";
import { TokenHeader } from "@/components/token-details/token-header";
import { TokenMetrics } from "@/components/token-details/token-metrics";
import { TokenBalanceCard } from "@/components/token-details/token-balance-card";
import { TokenAttributes } from "@/components/token-details/token-attributes";
import { TokenOnchainDetails } from "@/components/token-details/token-onchain-details";
import { TokenRawData } from "@/components/token-details/token-raw-data";
import { TradeTable } from "@/components/token-details/trade-table";

export type paramsType = Promise<{ id: string }>;
export default async function TokenPage({ params }: { params: paramsType }) {
  const { id } = await params;

  try {
    const { data: tokenData, error } = await server.tokens({ id }).get({});
    if (error || !tokenData) {
      console.error(
        "Error fetching token data or tokenData is null:",
        error,
        tokenData
      );
      redirect("/");
      return;
    }

    const tokenName = tokenData.content?.metadata?.name || "Unnamed Token";
    const tokenSymbol = tokenData.content?.metadata?.symbol || "";
    const tokenImage =
      tokenData.content?.files?.[0]?.uri ||
      tokenData.content?.links?.image ||
      tokenData.content?.files?.[0]?.cdn_uri ||
      "";
    const transferFeeBasisPoints =
      tokenData.mint_extensions?.transfer_fee_config?.newer_transfer_fee
        ?.transfer_fee_basis_points || 0;
    const transferFeePercentage = (transferFeeBasisPoints / 100).toFixed(2);

    return (
      <div className="container mx-auto px-2 md:px-4 py-4 lg:py-6 relative">
        {/* Top section: Token info and quick actions */}
        <div className="flex flex-col md:flex-row gap-4 mb-4">
          {/* Token info */}
          <div className="w-full md:w-3/4 bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg">
            <div className="flex flex-col md:flex-row gap-4">
              {/* Token image */}
              <div className="flex flex-col items-center justify-center md:w-1/4">
                {tokenImage ? (
                  <div className="relative aspect-square rounded-lg overflow-hidden border border-violet-500/20 shadow-xl shadow-violet-500/10 w-full max-w-[120px]">
                    <img
                      src={tokenImage}
                      alt={tokenName}
                      className="object-cover w-full h-full"
                      width={120}
                      height={120}
                    />
                  </div>
                ) : (
                  <div className="relative aspect-square rounded-lg overflow-hidden bg-violet-900/20 flex items-center justify-center border border-violet-500/20 w-full max-w-[120px]">
                    <span className="text-4xl font-bold text-violet-500/50">
                      {tokenSymbol?.substring(0, 2) || "??"}
                    </span>
                  </div>
                )}
              </div>

              {/* Token details */}
              <div className="md:w-3/4">
                <TokenHeader
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  description={tokenData.content?.metadata?.description}
                  tokenMint={tokenData.id}
                />

                <div className="flex flex-wrap gap-2 mt-3">
                  <div className="inline-flex items-center px-2 py-1 bg-black/40 border border-zinc-800/60 rounded-lg">
                    <span className="text-zinc-400 text-xs mr-2">Type:</span>
                    <span className="text-white text-xs font-medium">
                      {tokenData.interface}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-black/40 border border-zinc-800/60 rounded-lg">
                    <span className="text-zinc-400 text-xs mr-2">Supply:</span>
                    <span className="text-white text-xs font-medium">
                      {tokenData.token_info?.supply
                        ? (
                            Number(tokenData.token_info.supply) /
                            Math.pow(10, tokenData.token_info?.decimals || 0)
                          ).toLocaleString()
                        : "Unknown"}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-black/40 border border-zinc-800/60 rounded-lg">
                    <span className="text-zinc-400 text-xs mr-2">
                      Decimals:
                    </span>
                    <span className="text-white text-xs font-medium">
                      {tokenData.token_info?.decimals || "Unknown"}
                    </span>
                  </div>
                  <div className="inline-flex items-center px-2 py-1 bg-black/40 border border-green-900/40 rounded-lg">
                    <span className="text-zinc-400 text-xs mr-2">Fee:</span>
                    <span className="text-green-400 text-xs font-medium">
                      {transferFeePercentage}%
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Quick actions */}
          <div className="w-full md:w-1/4 flex flex-col gap-2">
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg">
              <h2 className="text-zinc-400 text-xs mb-1">Your Balance</h2>
              <div className="flex items-center gap-2 mb-3">
                <TokenBalance tokenMint={id} />
                {tokenSymbol && (
                  <span className="text-zinc-400">{tokenSymbol}</span>
                )}
              </div>
            </div>

            <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
              <div className="flex gap-2 mb-2">
                <BuyTokenDialog
                  tokenMint={tokenData.id}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  transferFeePercentage={transferFeePercentage}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                />
                <SellTokenDialog
                  tokenMint={tokenData.id}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  transferFeePercentage={transferFeePercentage}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                />
              </div>
              <Button className="bg-violet-500 hover:bg-violet-600 text-white w-full flex items-center justify-center gap-2 group">
                <MessageSquare className="h-4 w-4 mr-1" />
                Join Group Chat
              </Button>
            </div>
          </div>
        </div>

        {/* Main content: Chart and trades */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          {/* Price chart - takes 2/3 of space on desktop */}
          <div className="lg:col-span-2 bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold text-white">Price Chart</h2>
              <div className="text-sm text-zinc-400">
                <span className="text-green-400 font-semibold">+24h: </span>
                <span>Updated live</span>
              </div>
            </div>
            <div className="h-[400px] md:h-[500px] bg-black/30">
              <TradeHistoryGraph tokenMint={id} />
            </div>
          </div>

          {/* Recent trades - takes 1/3 of space on desktop */}
          <div className="lg:col-span-1 bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg">
            <h2 className="text-lg font-semibold mb-3 text-white">
              Recent Trades
            </h2>
            <div className="h-[400px] md:h-[500px] overflow-y-auto">
              <TradeTable tokenMint={id} />
            </div>
          </div>
        </div>

        {/* Token details and attributes */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {/* On-chain info */}
          <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg">
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

          {/* Raw token data (collapsible) */}
          <div>
            <TokenRawData tokenData={tokenData} />
          </div>
        </div>

        {/* Token attributes if present */}
        <TokenAttributes attributes={tokenData.content?.metadata?.attributes} />
      </div>
    );
  } catch (error) {
    console.error("Error fetching token data:", error);
    return (
      <div className="container mx-auto py-8 px-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
        <p className="mb-6">
          We couldn't fetch the token information. Please try again later.
        </p>
        <Link href="/">
          <Button>Return Home</Button>
        </Link>
      </div>
    );
  }
}
