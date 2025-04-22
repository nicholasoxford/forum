import Link from "next/link";
import { Card } from "@workspace/ui/components/card";

export const PopularChatsSection = () => {
  return (
    <section
      id="popular"
      className="container py-16 md:py-20 w-full px-4 md:px-0"
    >
      <div className="mb-10 md:mb-16 text-center">
        <div className="inline-block relative">
          <div className="absolute inset-0 blur-xl opacity-20 bg-violet-500 rounded-full transform scale-150"></div>
          <h2 className="font-display text-3xl md:text-5xl font-bold mb-4 text-center text-white relative inline-block">
            Top Communities
            <span className="absolute -bottom-2 left-0 right-0 h-1 bg-violet-500/60"></span>
          </h2>
        </div>
        <p className="text-zinc-300 max-w-xl mx-auto text-sm md:text-base mt-4">
          Join high-value communities and start earning passive income through
          token rewards.
        </p>
      </div>

      {/* Filter tabs - horizontally scrollable on mobile */}
      <div className="flex justify-start md:justify-center mb-8 md:mb-10 gap-2 overflow-x-auto pb-2 px-4 -mx-4 md:mx-0 scrollbar-hide">
        <button className="flex-none px-4 py-2 rounded-full bg-violet-500/20 text-violet-400 text-sm font-medium relative group">
          All Categories
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500/60 transform scale-x-100 origin-left"></span>
        </button>
        <button className="flex-none px-4 py-2 rounded-full bg-black/40 text-zinc-300 text-sm font-medium hover:bg-black/50 relative group">
          NFT
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500/60 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform"></span>
        </button>
        <button className="flex-none px-4 py-2 rounded-full bg-black/40 text-zinc-300 text-sm font-medium hover:bg-black/50 relative group">
          DeFi
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500/60 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform"></span>
        </button>
        <button className="flex-none px-4 py-2 rounded-full bg-black/40 text-zinc-300 text-sm font-medium hover:bg-black/50 relative group">
          Gaming
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500/60 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform"></span>
        </button>
        <button className="flex-none px-4 py-2 rounded-full bg-black/40 text-zinc-300 text-sm font-medium hover:bg-black/50 relative group">
          Trading
          <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-500/60 transform scale-x-0 group-hover:scale-x-100 origin-left transition-transform"></span>
        </button>
      </div>

      {/* Cards grid - single column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {[...Array(6)].map((_, i) => (
          <Card
            key={i}
            className="token-card p-4 md:p-5 text-zinc-200 bg-black/60 border border-zinc-800/80 hover:border-violet-500/50 transition-all duration-300 group hover:-translate-y-1 hover:shadow-lg hover:shadow-violet-500/5 rounded-xl"
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="size-10 md:size-12 rounded-full flex items-center justify-center text-base md:text-lg font-bold text-black relative"
                style={{
                  backgroundColor: [
                    "#14F195", // Solana green
                    "#9945FF", // Solana purple
                    "#F087FF", // Pink
                    "#149BF1", // Blue
                    "#FF8A57", // Orange
                    "#6EE7B7", // Teal
                  ][i % 6],
                }}
              >
                {["NT", "DA", "SF", "ME", "CS", "DU"][i % 6]}
                <div className="absolute top-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-black"></div>
              </div>
              <div>
                <span className="font-bold text-base md:text-lg text-white">
                  {
                    [
                      "NFT Traders",
                      "DeFi Alpha",
                      "Solana Founders",
                      "Meme Economy",
                      "Crypto Signals",
                      "DAOs United",
                    ][i % 6]
                  }
                </span>
                <p className="text-xs md:text-sm text-zinc-300">
                  Members: {100 + i * 50}
                </p>
              </div>
            </div>

            <div className="h-px w-full bg-gradient-to-r from-transparent via-zinc-700/50 to-transparent mb-4"></div>

            <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                <div className="size-3 md:size-4 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs md:text-sm text-zinc-300">
                  Active Now: {24 + i * 12}
                </span>
              </div>
              <div className="text-xs md:text-sm font-medium text-green-400">
                +{12 + i * 4}% APY
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="inline-block bg-black/60 text-zinc-300 px-2 md:px-3 py-1 md:py-1.5 rounded-full text-xs font-medium border border-zinc-800/80">
                {
                  ["NFT", "DeFi", "Gaming", "Trading", "Education", "Social"][
                    i % 6
                  ]
                }
              </span>
              <div className="flex flex-col items-end">
                <span className="text-base md:text-lg font-bold text-white flex items-center">
                  <span className="text-xs md:text-sm mr-1 text-green-400">
                    $
                  </span>
                  {(0.008 + i * 0.004).toFixed(3)}
                </span>
                <span className="text-[10px] md:text-xs text-zinc-400">
                  per hour / member
                </span>
              </div>
            </div>

            {/* Hover-visible join button - visible by default on mobile */}
            <div className="absolute inset-x-0 bottom-0 h-12 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center md:translate-y-4 md:group-hover:translate-y-0 duration-300">
              <Link href="/buy-token">
                <button className="bg-violet-500/20 hover:bg-violet-500/40 text-violet-400 hover:text-violet-300 w-full py-2 rounded-b-xl text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <span>Join Community</span>
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M7 17L17 7M17 7H7M17 7V17"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {/* "Show more" button with improved styling */}
      <div className="mt-8 md:mt-10 flex justify-center">
        <button className="px-5 py-2 rounded-full border border-zinc-700 text-zinc-300 hover:text-zinc-200 hover:border-violet-500/50 transition-colors text-sm font-medium group flex items-center gap-2">
          <span>Show More Communities</span>
          <svg
            className="w-4 h-4 transform group-hover:translate-y-0.5 transition-transform"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 5V19M12 19L5 12M12 19L19 12"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </section>
  );
};
