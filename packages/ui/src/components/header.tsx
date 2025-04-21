"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useWallet } from "@jup-ag/wallet-adapter";
import { NavMenu } from "./nav-menu";
import { WalletButton } from "./wallet-connect/wallet-button";
import { cn } from "@workspace/ui/lib/utils";

interface HeaderProps {
  className?: string;
}

export function Header({ className }: HeaderProps) {
  const { connected } = useWallet();
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll effect for transparent to solid background transition
  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      if (isScrolled !== scrolled) {
        setScrolled(isScrolled);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [scrolled]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300 px-4 py-4 md:px-6",
        scrolled
          ? "bg-black/90 backdrop-blur-md border-b border-zinc-800 shadow-md"
          : "bg-transparent",
        className
      )}
    >
      <div className="container mx-auto flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center">
          <div className="font-display text-xl md:text-2xl font-bold text-white">
            Token<span className="text-violet-400">Flow</span>
            <div className="inline-block size-1.5 md:size-2 rounded-full bg-green-500 ml-1.5 md:ml-2 animate-pulse"></div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center justify-center flex-1 max-w-2xl mx-auto">
          <NavMenu />
        </div>

        {/* Wallet Connection Button (Show only if not connected on desktop) */}
        <div className="hidden md:block">
          {!connected && (
            <WalletButton className="bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 hover:shadow-lg border border-zinc-700 hover:border-violet-500/30" />
          )}
        </div>

        {/* Mobile Menu and Wallet Button */}
        <div className="flex items-center gap-2 md:hidden">
          <WalletButton className="bg-zinc-800 hover:bg-zinc-700 text-white px-3 py-1.5 rounded-full text-xs font-medium border border-zinc-700" />
          <button
            className="p-2 text-white"
            aria-label="Menu"
            onClick={() => {
              // Mobile menu toggle logic here
              // For a real implementation, you'd want to show a mobile menu drawer
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              className="size-6"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            </svg>
          </button>
        </div>
      </div>
    </header>
  );
}
