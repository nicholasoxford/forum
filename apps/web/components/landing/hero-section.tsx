"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

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
export const HeroSection = () => {
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
            GROUPY IS{" "}
            <span className="text-violet-500 inline-block relative">
              FUN<span className="text-violet-500">.</span>
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
            <Link href="/tokens">
              <Button
                variant="outline"
                size="lg"
                className="border-zinc-700 bg-black/40 hover:bg-black/60 text-zinc-200 px-8 py-6 text-lg font-medium transition-all duration-300 hover:border-violet-500/50 group"
              >
                <span className="group-hover:text-violet-300 transition-colors">
                  Explore Communities
                </span>
              </Button>
            </Link>
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
