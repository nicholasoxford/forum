"use client";

import { FC, ReactNode, useMemo, memo, useEffect } from "react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { CoinbaseWalletAdapter } from "@solana/wallet-adapter-coinbase";
import { TrustWalletAdapter } from "@solana/wallet-adapter-trust";
import { type Cluster } from "@solana/web3.js";

interface WalletProviderProps {
  children: ReactNode;
}

// Keep wallet adapters as a module-level variable to avoid re-creating them
const walletAdapters = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter(),
  new CoinbaseWalletAdapter(),
  new TrustWalletAdapter(),
];

export const WalletProvider: FC<WalletProviderProps> = memo(({ children }) => {
  useEffect(() => {
    console.log("WalletProvider mounted");
    return () => console.log("WalletProvider unmounted");
  }, []);

  // Use constant reference for wallets
  const wallets = useMemo(() => walletAdapters, []);

  const config = useMemo(
    () =>
      ({
        autoConnect: true,
        localStorageKey: "wallet-provider",
        env: "mainnet" as Cluster,
        metadata: {
          name: "Token Rewards Platform",
          description:
            "Earn rewards while you chat in our private Telegram group",
          url: typeof window !== "undefined" ? window.location.origin : "",
          iconUrls: ["https://your-app-icon-url.com/favicon.ico"],
        },
        notificationCallback: {
          onConnect: (props: any) => {
            console.log("Wallet connected:", props);
          },
          onConnecting: (props: any) => {
            console.log("Connecting to wallet:", props);
          },
          onDisconnect: (props: any) => {
            console.log("Wallet disconnected:", props);
          },
          onNotInstalled: (props: any) => {
            console.log("Wallet not installed:", props);
          },
        },
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/additional-topics/wallet-list",
        },
        theme: "dark",
        lang: "en",
      }) as any,
    []
  );

  return (
    <UnifiedWalletProvider wallets={wallets} config={config}>
      {children}
    </UnifiedWalletProvider>
  );
});

WalletProvider.displayName = "WalletProvider";
