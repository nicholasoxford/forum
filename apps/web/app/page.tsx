"use client";

import { FC, useCallback, useEffect, useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import {
  HeroSection,
  StatsBar,
  HowItWorks,
  AccessCard,
  FAQ,
  Footer,
} from "@workspace/ui/components";
import Link from "next/link";

// Configuration constants
const MIN_REQUIRED_BALANCE = 100; // tokens (UI amount)
const TG_BOT_USERNAME = "MyTokenAirdropBot"; // without @

const HomePage: FC = () => {
  const { publicKey, connected } = useWallet();
  const [hasToken, setHasToken] = useState(false);
  const [loadingBalance, setLoadingBalance] = useState(false);

  // Placeholder for token balance check
  const checkBalance = useCallback(async () => {
    if (!publicKey) return;
    setLoadingBalance(true);
    try {
      // This is a placeholder - implement actual token balance check
      // For now, we'll just simulate a delay and set a random result
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasToken(Math.random() > 0.5); // Randomly true or false for demo
    } catch (err) {
      console.error("Balance check failed:", err);
      setHasToken(false);
    } finally {
      setLoadingBalance(false);
    }
  }, [publicKey]);

  useEffect(() => {
    if (connected && publicKey) {
      checkBalance();
      const id = setInterval(checkBalance, 60_000);
      return () => clearInterval(id);
    }
  }, [connected, publicKey, checkBalance]);

  return (
    <main className="flex flex-col items-center gap-24 px-4 md:px-8 py-12">
      <HeroSection />
      <div className="w-full flex flex-col sm:flex-row gap-4 justify-center items-center">
        <Link
          href="/create-token"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md bg-primary text-primary-foreground shadow-sm px-8 py-3 text-lg font-semibold transition-colors hover:bg-primary/90"
        >
          Create Your Token
        </Link>
        <a
          href="https://solana.com"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center whitespace-nowrap rounded-md border border-input bg-background shadow-sm px-8 py-3 text-lg font-semibold transition-colors hover:bg-accent hover:text-accent-foreground"
        >
          Learn More
        </a>
      </div>
      <StatsBar />
      <HowItWorks />
      <AccessCard
        connected={connected}
        hasToken={hasToken}
        loading={loadingBalance}
      />
      <FAQ />
      <Footer />
    </main>
  );
};

export default HomePage;
