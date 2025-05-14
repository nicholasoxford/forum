import { redirect } from "next/navigation";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { Copy, ExternalLink, MessageSquare } from "lucide-react";
import Image from "next/image";
import { BuyTokenDialog } from "@/components/buy-token-dialog";
import { SellTokenDialog } from "@/components/sell-token-dialog";
import { TokenBalance } from "@/components/token-balance";
import { server } from "@/utils/elysia";
import { TradeHistoryGraph } from "@/components/trade-history-graph";

export type paramsType = Promise<{ id: string }>;
export default async function TokenPage({ params }: { params: paramsType }) {
  const { id } = await params;

  try {
    const { data: tokenData, error } = await server.tokens({ id }).get({});
    console.log("TOKEN DATA: ", tokenData);
    console.log("ERROR: ", error?.value.message);
    if (error) {
      redirect("/");
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
      <div className="container mx-auto py-20 px-4 relative">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left column: Token image and quick actions */}
          <div className="lg:col-span-1">
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-4 shadow-lg flex flex-col">
              {tokenImage ? (
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 border border-violet-500/20 shadow-xl shadow-violet-500/10">
                  <img
                    src={tokenImage}
                    alt={tokenName}
                    className="object-cover w-full h-full"
                    width={100}
                    height={100}
                  />
                </div>
              ) : (
                <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-violet-900/20 flex items-center justify-center border border-violet-500/20">
                  <span className="text-4xl font-bold text-violet-500/50">
                    {tokenSymbol?.substring(0, 2) || "??"}
                  </span>
                </div>
              )}

              <Button className="mt-2 bg-violet-500 hover:bg-violet-600 text-white w-full flex items-center justify-center gap-2 group relative overflow-hidden">
                <span className="relative z-10 flex items-center justify-center">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Join Group Chat
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Button>

              <div className="flex gap-2 mt-2">
                <BuyTokenDialog
                  tokenMint={tokenData.id}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  transferFeePercentage={transferFeePercentage}
                  className="flex-1"
                />

                <SellTokenDialog
                  tokenMint={tokenData.id}
                  tokenName={tokenName}
                  tokenSymbol={tokenSymbol}
                  transferFeePercentage={transferFeePercentage}
                  className="flex-1"
                />
              </div>

              <div className="flex gap-2 mt-3">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400 transition-all"
                >
                  <Copy className="h-3.5 w-3.5 mr-1" />
                  Copy Address
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 text-xs border-zinc-800 hover:border-violet-500/50 text-zinc-400 hover:text-violet-400 transition-all"
                >
                  <ExternalLink className="h-3.5 w-3.5 mr-1" />
                  Explorer
                </Button>
              </div>
            </div>
          </div>

          {/* Right column: Token details */}
          <div className="lg:col-span-2">
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 shadow-lg mb-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold mb-1 text-white flex items-center gap-2">
                    {tokenName}
                    {tokenSymbol && (
                      <span className="text-zinc-400 text-lg md:text-xl font-normal">
                        ${tokenSymbol}
                      </span>
                    )}
                  </h1>
                  <p className="text-zinc-400 text-sm md:text-base max-w-xl">
                    {tokenData.content?.metadata?.description ||
                      "No description available"}
                  </p>
                </div>
              </div>

              {/* Token metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                  <p className="text-zinc-400 text-xs mb-1">Token Type</p>
                  <p className="text-white font-medium">
                    {tokenData.interface}
                  </p>
                </div>
                <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                  <p className="text-zinc-400 text-xs mb-1">Supply</p>
                  <p className="text-white font-medium">
                    {tokenData.token_info?.supply
                      ? (
                          Number(tokenData.token_info.supply) /
                          Math.pow(10, tokenData.token_info.decimals || 0)
                        ).toLocaleString()
                      : "Unknown"}
                  </p>
                </div>
                <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                  <p className="text-zinc-400 text-xs mb-1">Decimals</p>
                  <p className="text-white font-medium">
                    {tokenData.token_info?.decimals || "Unknown"}
                  </p>
                </div>
                <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                  <p className="text-zinc-400 text-xs mb-1">Transfer Fee</p>
                  <p className="text-green-400 font-medium">
                    {transferFeePercentage}%
                  </p>
                </div>
              </div>

              {/* Your Balance */}
              <div className="mb-6 bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                <h2 className="text-zinc-400 text-xs mb-1">Your Balance</h2>
                <div className="flex items-center gap-2">
                  <TokenBalance tokenMint={id} />
                  {tokenSymbol && (
                    <span className="text-zinc-400">{tokenSymbol}</span>
                  )}
                </div>
              </div>

              {/* Trade History Graph */}
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3 text-white">
                  Price History
                </h2>
                <div className="bg-black/40 border border-zinc-800/60 rounded-lg p-4">
                  <TradeHistoryGraph tokenMint={id} />
                </div>
              </div>

              {/* Token Attributes */}
              {tokenData.content?.metadata?.attributes &&
                tokenData.content.metadata.attributes.length > 0 && (
                  <div className="mb-6">
                    <h2 className="text-lg font-semibold mb-3 text-white">
                      Attributes
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {tokenData.content.metadata.attributes.map(
                        (
                          attr: { trait_type: string; value: string },
                          index: number
                        ) => (
                          <div
                            key={index}
                            className="bg-black/40 border border-zinc-800/60 rounded-lg px-3 py-2"
                          >
                            <p className="text-zinc-400 text-xs">
                              {attr.trait_type}
                            </p>
                            <p className="text-white font-medium">
                              {attr.value}
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}

              {/* Token Program Info */}
              <div className="mb-6">
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
                      <span className="text-zinc-400 text-sm">
                        Token Program
                      </span>
                      <span className="text-white text-sm font-mono truncate max-w-xs">
                        {tokenData.token_info.token_program}
                      </span>
                    </div>
                  )}
                  {tokenData.token_info?.mint_authority && (
                    <div className="flex flex-wrap justify-between items-center py-2 border-b border-zinc-800/50">
                      <span className="text-zinc-400 text-sm">
                        Mint Authority
                      </span>
                      <span className="text-white text-sm font-mono truncate max-w-xs">
                        {tokenData.token_info.mint_authority}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Raw Token Data */}
            <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 shadow-lg">
              <h2 className="text-lg font-semibold mb-3 text-white flex items-center">
                Raw Token Data
                <span className="ml-2 px-2 py-0.5 bg-violet-500/20 rounded text-violet-400 text-xs font-normal">
                  JSON
                </span>
              </h2>
              <div className="overflow-auto max-h-96 bg-black/50 rounded-lg border border-zinc-800/60">
                <pre className="text-xs whitespace-pre-wrap break-words p-4 text-zinc-300">
                  {JSON.stringify(tokenData, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
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
