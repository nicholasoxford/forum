"use client";

import { useState, useEffect } from "react";
import React from "react";
import Link from "next/link";
import { NavMenu } from "./nav-menu";
import { cn } from "@workspace/ui/lib/utils";

interface HeaderProps {
  className?: string;
  walletAuthComponent?: React.ReactNode;
}

export function Header({ className, walletAuthComponent }: HeaderProps) {
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
        "fixed top-0 left-0 right-0 z-40 transition-all duration-300 px-4 py-4 md:px-6",
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

        {/* Wallet Auth Component Area */}
        <div className="flex items-center">{walletAuthComponent}</div>
      </div>
    </header>
  );
}
