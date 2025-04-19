"use client";

import { FC, ReactNode, useMemo } from "react";
import { UnifiedWalletProvider } from "@jup-ag/wallet-adapter";
import { PhantomWalletAdapter } from "@solana/wallet-adapter-phantom";
import { SolflareWalletAdapter } from "@solana/wallet-adapter-solflare";
import { CoinbaseWalletAdapter } from "@solana/wallet-adapter-coinbase";
import { TrustWalletAdapter } from "@solana/wallet-adapter-trust";

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider: FC<WalletProviderProps> = ({ children }) => {
  const wallets = useMemo(() => {
    return [
      new PhantomWalletAdapter(),
      new SolflareWalletAdapter(),
      new CoinbaseWalletAdapter(),
      new TrustWalletAdapter(),
    ];
  }, []);

  return (
    <UnifiedWalletProvider
      wallets={wallets}
      config={{
        autoConnect: true,
        env: "mainnet-beta",
        metadata: {
          name: "Token Rewards Platform",
          description:
            "Earn rewards while you chat in our private Telegram group",
          url: typeof window !== "undefined" ? window.location.origin : "",
          iconUrls: ["https://your-app-icon-url.com/favicon.ico"],
        },
        notificationCallback: {
          onConnect: (props) => {
            console.log("Wallet connected:", props);
            // You can add toast notifications or other UI feedback here
          },
          onConnecting: (props) => {
            console.log("Connecting to wallet:", props);
            // You can add loading indicators or other UI feedback here
          },
          onDisconnect: (props) => {
            console.log("Wallet disconnected:", props);
            // You can add toast notifications or other UI feedback here
          },
          onNotInstalled: (props) => {
            console.log("Wallet not installed:", props);
            // You can add UI feedback to prompt the user to install the wallet
          },
        },
        walletlistExplanation: {
          href: "https://station.jup.ag/docs/additional-topics/wallet-list",
        },
        theme: "dark",
        lang: "en",
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
};
