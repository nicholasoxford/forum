"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Button } from "@workspace/ui/components/button";
import { Card } from "@workspace/ui/components/card";
import { ArrowRight } from "lucide-react";
import Link from "next/link";

// Particles component - client-only
const Particles = () => {
  // Define the particle type
  type Particle = {
    id: number;
    width: number;
    height: number;
    top: number;
    left: number;
    animationDuration: number;
    animationDelay: number;
  };

  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    // Generate particles only on the client side
    const newParticles: Particle[] = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      width: 2 + Math.floor(Math.random() * 6),
      height: 2 + Math.floor(Math.random() * 6),
      top: Math.floor(Math.random() * 100),
      left: Math.floor(Math.random() * 100),
      animationDuration: 10 + Math.floor(Math.random() * 10),
      animationDelay: Math.floor(Math.random() * 5),
    }));

    setParticles(newParticles);
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-violet-500/10"
          style={{
            width: `${particle.width}px`,
            height: `${particle.height}px`,
            top: `${particle.top}%`,
            left: `${particle.left}%`,
            animation: `float ${particle.animationDuration}s linear infinite`,
            animationDelay: `${particle.animationDelay}s`,
          }}
        />
      ))}
    </div>
  );
};

// Interface for community card props
interface CommunityCardProps {
  style?: React.CSSProperties;
  className: string;
  name: string;
  members: string;
  apy: string;
  tokenSymbol: string;
  rate: string;
  bgColor: string;
}

// Improve component with advanced styling and better contrast
const CommunityCard = ({
  style,
  className,
  name,
  members,
  apy,
  tokenSymbol,
  rate,
  bgColor,
}: CommunityCardProps) => (
  <div className={`absolute z-10 ${className}`} style={style}>
    <div className="token-card p-4 bg-black/70 backdrop-blur-md border border-violet-500/40 shadow-xl shadow-violet-500/10 hover:shadow-2xl hover:shadow-violet-500/15 transition-all duration-500 rounded-lg">
      <div className="flex items-center gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-full flex items-center justify-center relative"
          style={{ backgroundColor: bgColor }}
        >
          <span className="text-xs font-bold text-black">
            {name
              .split(" ")
              .map((word) => word[0])
              .join("")}
          </span>
          {/* Add subtle pulsing effect */}
          <div
            className="absolute inset-0 rounded-full animate-ping opacity-20"
            style={{ backgroundColor: bgColor }}
          ></div>
        </div>
        <div>
          <div className="font-semibold text-white">{name}</div>
          <div className="text-xs text-zinc-300">{members} members</div>
        </div>
      </div>
      <div
        className="bg-opacity-10 text-sm px-2 py-1 rounded-md inline-block mb-2"
        style={{ backgroundColor: `${bgColor}30`, color: bgColor }}
      >
        +{apy}% APY
      </div>
      <div className="text-white text-xl font-bold mt-2 flex items-center">
        <span className="mr-1" style={{ color: bgColor }}>
          $
        </span>
        {tokenSymbol} {rate}{" "}
        <span className="text-zinc-400 text-sm ml-1">/ hr</span>
      </div>
    </div>
  </div>
);

// Component for the new hero section inspired by time.fun
const HeroSection = () => {
  return (
    <section className="relative flex flex-col w-full pt-20 md:pt-32 pb-20 md:pb-32 overflow-hidden">
      {/* Enhanced background effects */}
      <div className="absolute inset-0 bg-gradient-radial from-violet-900/20 via-transparent to-transparent"></div>
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(124,58,237,0.15),transparent_50%)]"></div>

      {/* Added subtle grid pattern for depth */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cGF0aCBkPSJNNjAgNjBIMFYwaDYwdjYwek01OSAxSDFWNTloNThWMXoiIGZpbGw9IiM1NTUiIGZpbGwtb3BhY2l0eT0iLjAyIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')] opacity-20"></div>

      {/* Client-side only particles */}
      <Particles />

      {/* Main content */}
      <div className="container mx-auto px-4 z-10">
        <div className="max-w-4xl mx-auto">
          {/* Main heading with large bold text */}
          <h1 className="font-display text-6xl md:text-8xl font-bold tracking-tight text-white mb-6 relative">
            CHAT IS{" "}
            <span className="text-violet-500 inline-block relative">
              MONEY<span className="text-violet-500">.</span>
              <span className="absolute -right-1 -bottom-2 w-14 h-1 bg-violet-500 md:h-2 md:-bottom-3 md:-right-2 md:w-20 rounded-full"></span>
            </span>
          </h1>

          {/* Subheading with value proposition */}
          <p className="text-xl md:text-2xl text-zinc-300 mb-10 max-w-2xl">
            Get paid to participate in exclusive Telegram communities. Launch
            tokens, gate access, earn from every transaction.
          </p>

          {/* Stats row showing potential earnings - with enhanced styling */}
          <div className="flex flex-col md:flex-row gap-6 md:gap-12 mb-12">
            <div className="flex flex-col relative group">
              <span className="text-violet-500 text-4xl font-bold group-hover:scale-105 transition-transform">
                $1.2M+
              </span>
              <span className="text-zinc-300 text-sm mt-1">
                Total Distributed
              </span>
              <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-violet-500/30 group-hover:w-full transition-all duration-300"></div>
            </div>
            <div className="flex flex-col relative group">
              <span className="text-violet-500 text-4xl font-bold group-hover:scale-105 transition-transform">
                240+
              </span>
              <span className="text-zinc-300 text-sm mt-1">
                Active Communities
              </span>
              <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-violet-500/30 group-hover:w-full transition-all duration-300"></div>
            </div>
            <div className="flex flex-col relative group">
              <span className="text-violet-500 text-4xl font-bold group-hover:scale-105 transition-transform">
                $94
              </span>
              <span className="text-zinc-300 text-sm mt-1">
                Avg Monthly Earnings
              </span>
              <div className="absolute -bottom-2 left-0 w-0 h-0.5 bg-violet-500/30 group-hover:w-full transition-all duration-300"></div>
            </div>
          </div>

          {/* CTA Buttons - enhanced with better hover effects */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Link href="/launch">
              <Button
                size="lg"
                className="btn-flow bg-violet-500 hover:bg-violet-600 text-white px-8 py-6 text-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 relative overflow-hidden group"
              >
                <span className="relative z-10 flex items-center justify-center">
                  Launch Your Token
                  <ArrowRight className="size-5 ml-2 group-hover:translate-x-1 transition-transform" />
                </span>
                <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-zinc-700 bg-black/40 hover:bg-black/60 text-zinc-200 px-8 py-6 text-lg font-medium transition-all duration-300 hover:border-violet-500/50 group"
            >
              <span className="group-hover:text-violet-300 transition-colors">
                Explore Communities
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced floating chat cards with better positioning and readability */}
      <CommunityCard
        name="Solana Insiders"
        members="1,403"
        apy="18"
        tokenSymbol="SOL"
        rate="0.015"
        bgColor="#14F195"
        className="-right-12 top-20 md:-right-8 md:top-1/3 transform -translate-y-1/3 w-72 h-auto rotate-6 hidden md:block"
        style={{ zIndex: 10 }}
      />

      <CommunityCard
        name="DeFi Alpha"
        members="852"
        apy="24"
        tokenSymbol="DFI"
        rate="0.023"
        bgColor="#9945FF"
        className="-left-12 top-1/3 md:-left-8 md:top-2/3 transform -translate-y-1/2 w-64 h-auto -rotate-6 opacity-90 hidden md:block"
        style={{ zIndex: 9 }}
      />

      {/* Mobile-optimized card with adjusted position */}
      <CommunityCard
        name="NFT Traders"
        members="327"
        apy="21"
        tokenSymbol="NFT"
        rate="0.019"
        bgColor="#F087FF"
        className="right-2 top-40 transform w-56 h-auto rotate-3 md:hidden"
        style={{ zIndex: 5 }}
      />

      {/* Positioned to avoid stats overlap */}
      <CommunityCard
        name="Crypto Signals"
        members="963"
        apy="16"
        tokenSymbol="CS"
        rate="0.011"
        bgColor="#149BF1"
        className="right-4 bottom-48 transform w-52 h-auto rotate-2 opacity-80 hidden lg:block"
        style={{ zIndex: 3 }}
      />

      {/* Positioned to avoid stats overlap */}
      <CommunityCard
        name="Meme Economy"
        members="1,289"
        apy="32"
        tokenSymbol="MEME"
        rate="0.034"
        bgColor="#FF8A57"
        className="left-8 -bottom-12 transform w-48 h-auto -rotate-6 opacity-70 hidden lg:block"
        style={{ zIndex: 2 }}
      />

      {/* Decorative line elements */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
      <div className="absolute bottom-0 left-1/2 w-px h-16 -translate-x-1/2 bg-gradient-to-t from-violet-500/30 to-transparent"></div>
    </section>
  );
};

export default function Home() {
  const { connected } = useWallet();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Flow line positions for visual elements
  useEffect(() => {
    if (typeof window !== "undefined") {
      // Create animated flow lines at different positions
      const flowLinesCount = 5;
      const container = document.querySelector("main");

      // Remove existing flow lines (if any)
      document.querySelectorAll(".flow-line").forEach((el) => el.remove());

      if (container) {
        for (let i = 0; i < flowLinesCount; i++) {
          const line = document.createElement("div");
          line.className = "flow-line";
          line.style.width = "100%";
          line.style.top = `${15 + i * 20}%`;
          line.style.animationDelay = `${i * 0.7}s`;
          container.appendChild(line);
        }
      }
    }
  }, []);

  return (
    <main className="after:orb token-flow-bg flex flex-col items-center text-zinc-800 dark:text-zinc-200 min-h-screen bg-black">
      {/* Use our new hero section */}
      <HeroSection />

      {/* Enhance flow connector with animated dot */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* POPULAR CHATS - Improved readability for headings */}
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

      {/* Enhanced flow connector with animated dot */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* HOW IT WORKS - Reduced top padding */}
      <section
        id="how-it-works"
        className="container py-16 md:py-20 w-full relative px-4 md:px-0"
      >
        <div className="mb-10 md:mb-16 text-center">
          <h2 className="font-display text-3xl md:text-4xl mb-4 text-center text-zinc-900 dark:text-white relative inline-block">
            How It Works
            <span className="absolute -bottom-2 left-1/2 w-12 h-1 bg-violet-500/40 -translate-x-1/2"></span>
          </h2>
          <p className="text-zinc-400 max-w-xl mx-auto text-sm md:text-base">
            Three simple steps to start earning passive income from your
            community.
          </p>
        </div>

        {/* Animated flow path (visible on md and up) with glowing effect */}
        <div className="hidden md:block absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent">
          <div className="absolute top-1/2 left-0 w-4 h-4 -translate-y-1/2 rounded-full bg-violet-500/20 animate-ping"></div>
          <div className="absolute top-1/2 right-0 w-4 h-4 -translate-y-1/2 rounded-full bg-violet-500/20 animate-ping animation-delay-700"></div>
        </div>

        {/* Vertical connector line for mobile - with enhanced styling */}
        <div className="absolute left-1/2 -translate-x-1/2 top-[190px] bottom-32 w-px bg-gradient-to-b from-violet-500/30 via-violet-500/20 to-transparent md:hidden">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-500/30 animate-ping"></div>
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full bg-violet-500/20 animate-ping animation-delay-1000"></div>
        </div>

        <div className="flex flex-col md:flex-row justify-around items-center gap-12 md:gap-8 relative z-10">
          {/* Step 1 - with enhanced hover and focus effects */}
          <div className="flex flex-col items-center text-center max-w-xs group">
            <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
              <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
                1
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
              Create Token
            </h3>
            <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
              Launch your community token with built-in transfer fees that
              reward holders automatically.
            </p>
          </div>

          {/* Step flow connector + arrow with animation */}
          <div className="hidden md:flex flex-col items-center">
            <svg
              width="40"
              height="24"
              viewBox="0 0 40 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-violet-500/60 group"
            >
              <path
                d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z"
                fill="currentColor"
                className="group-hover:text-violet-400 transition-colors"
              />
              <circle
                cx="20"
                cy="12"
                r="2"
                fill="currentColor"
                className="animate-ping opacity-50"
              />
            </svg>
          </div>

          {/* Mobile arrow down with animation */}
          <div className="md:hidden flex items-center text-violet-500/60 -mt-6 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="group-hover:text-violet-400 transition-colors"
            >
              <path
                d="M12 19L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M5 12L12 19L19 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="2"
                fill="currentColor"
                className="animate-ping opacity-50"
              />
            </svg>
          </div>

          {/* Step 2 - with enhanced hover and focus effects */}
          <div className="flex flex-col items-center text-center max-w-xs group">
            <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
              <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
                2
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
              Gate Community
            </h3>
            <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
              Set token requirements for your Telegram group - only holders can
              join and participate.
            </p>
          </div>

          {/* Step flow connector + arrow with animation */}
          <div className="hidden md:flex flex-col items-center">
            <svg
              width="40"
              height="24"
              viewBox="0 0 40 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="text-violet-500/60 group"
            >
              <path
                d="M39.0607 13.0607C39.6464 12.4749 39.6464 11.5251 39.0607 10.9393L29.5147 1.3934C28.9289 0.807611 27.9792 0.807611 27.3934 1.3934C26.8076 1.97919 26.8076 2.92893 27.3934 3.51472L35.8787 12L27.3934 20.4853C26.8076 21.0711 26.8076 22.0208 27.3934 22.6066C27.9792 23.1924 28.9289 23.1924 29.5147 22.6066L39.0607 13.0607ZM0 13.5H38V10.5H0V13.5Z"
                fill="currentColor"
                className="group-hover:text-violet-400 transition-colors"
              />
              <circle
                cx="20"
                cy="12"
                r="2"
                fill="currentColor"
                className="animate-ping opacity-50"
              />
            </svg>
          </div>

          {/* Mobile arrow down with animation */}
          <div className="md:hidden flex items-center text-violet-500/60 -mt-6 group">
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="group-hover:text-violet-400 transition-colors"
            >
              <path
                d="M12 19L12 5"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M5 12L12 19L19 12"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle
                cx="12"
                cy="12"
                r="2"
                fill="currentColor"
                className="animate-ping opacity-50"
              />
            </svg>
          </div>

          {/* Step 3 - with enhanced hover and focus effects */}
          <div className="flex flex-col items-center text-center max-w-xs group">
            <div className="size-16 bg-black/30 border border-violet-500/30 rounded-full mb-6 relative overflow-hidden flex items-center justify-center shadow-lg shadow-violet-500/10 transition-transform group-hover:scale-110 duration-300 z-10 group-hover:border-violet-500/50 group-hover:shadow-violet-500/20">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-violet-900/20 animate-pulse"></div>
              <span className="text-3xl font-display font-bold text-violet-400 relative z-10 group-hover:text-violet-300 transition-colors">
                3
              </span>
            </div>
            <h3 className="text-xl font-semibold mb-3 font-display text-zinc-100 group-hover:text-white transition-colors">
              Earn Passively
            </h3>
            <p className="text-zinc-400 font-sans leading-relaxed group-hover:text-zinc-300 transition-colors text-sm md:text-base">
              Every token transaction generates fees that are distributed hourly
              to all community members.
            </p>
          </div>
        </div>

        {/* Call to action - with enhanced hover effects */}
        <div className="mt-12 md:mt-16 text-center">
          <Link href="/launch">
            <button className="bg-violet-500 hover:bg-violet-600 text-white px-6 md:px-8 py-2.5 md:py-3 rounded-full text-base md:text-lg font-medium transition-all duration-300 hover:shadow-xl hover:shadow-violet-500/20 relative overflow-hidden group">
              <span className="relative z-10">Start Now</span>
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity"></span>
            </button>
          </Link>
          <p className="mt-4 text-zinc-500 text-xs md:text-sm">
            No coding required. Launch in minutes.
          </p>
        </div>

        {/* Curved flow path */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
      </section>

      {/* Enhanced flow connector with animated dot */}
      <div className="flow-connector relative">
        <div className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full bg-violet-500/50 -translate-x-1/2 -translate-y-1/2 animate-ping"></div>
      </div>

      {/* Footer with token flow design - with enhanced styling */}
      <footer className="w-full py-12 border-t border-zinc-800/20 dark:border-zinc-700/20 relative overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            {/* Brand/Logo area with enhanced styling */}
            <div className="flex flex-col items-center md:items-start">
              <div className="font-display text-2xl font-bold text-zinc-900 dark:text-white mb-2 flex items-center">
                Token<span className="text-violet-500">Flow</span>
                <div className="size-2 rounded-full bg-green-500 ml-2"></div>
              </div>
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                Building on <span className="text-secondary">Solana</span>
              </p>
            </div>

            {/* Links area with hover effects */}
            <div className="flex flex-col md:flex-row gap-8 md:gap-12">
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Platform
                </p>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  About
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Features
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Security
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Resources
                </p>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Documentation
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  API
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  GitHub
                </a>
              </div>
              <div className="flex flex-col gap-2">
                <p className="font-semibold text-zinc-900 dark:text-white">
                  Social
                </p>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Twitter
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Discord
                </a>
                <a
                  href="#"
                  className="text-sm text-zinc-600 dark:text-zinc-400 hover:text-violet-500 dark:hover:text-violet-400 transition-colors"
                >
                  Telegram
                </a>
              </div>
            </div>
          </div>

          {/* Copyright with token symbol */}
          <div className="mt-12 text-center text-xs text-zinc-500 dark:text-zinc-500 flex items-center justify-center gap-2">
            © {new Date().getFullYear()} TokenFlow. All rights reserved.
            <span className="inline-block ml-1 text-xs px-1.5 py-0.5 bg-zinc-800/30 rounded-md">
              $TKN
            </span>
          </div>
        </div>

        {/* Enhanced token flow visual elements */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>
        <div className="absolute bottom-0 left-1/4 w-1 h-20 bg-gradient-to-t from-violet-500/20 to-transparent"></div>
        <div className="absolute bottom-0 right-1/4 w-1 h-30 bg-gradient-to-t from-violet-500/20 to-transparent"></div>

        {/* Animated dots */}
        <div className="absolute bottom-4 left-1/3 w-2 h-2 rounded-full bg-violet-500/30 animate-ping"></div>
        <div className="absolute bottom-8 right-1/3 w-2 h-2 rounded-full bg-violet-500/30 animate-ping animation-delay-500"></div>
      </footer>
    </main>
  );
}
