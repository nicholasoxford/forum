"use client";

import { useEffect } from "react";
import { useWallet, WalletName } from "@jup-ag/wallet-adapter";
import { useAuth } from "@/components/session-provider";

// Storage keys
const WALLET_NAME_KEY = "selectedWallet";
const WALLET_CONNECTED_KEY = "walletConnected";

export function useWalletPersistence() {
  const { wallet, select, connect, connected, disconnecting, connecting } =
    useWallet();
  const { session } = useAuth();

  // On mount, try to restore wallet from localStorage
  useEffect(() => {
    const storedWalletName = localStorage.getItem(WALLET_NAME_KEY);
    console.log("Wallet persistence effect", {
      storedWalletName,
      connected,
      connecting,
      disconnecting,
      hasSession: !!session,
    });

    // Only attempt to reconnect if:
    // 1. We have a stored wallet name
    // 2. We're not already connected or in the process of connecting
    // 3. We don't have an active session (to prevent reconnection popups after auth)
    if (
      storedWalletName &&
      !connected &&
      !connecting &&
      !disconnecting &&
      !session
    ) {
      console.log(`Selecting stored wallet: ${storedWalletName}`);
      // Only try to reconnect if there's a stored wallet and we're not already connecting
      select(storedWalletName as WalletName);
      // Let the autoConnect feature handle the actual connection
    }
  }, [select, connected, connecting, disconnecting, session]);

  // Save wallet name to localStorage when it changes
  useEffect(() => {
    if (wallet?.adapter.name) {
      console.log(`Saving wallet name to localStorage: ${wallet.adapter.name}`);
      localStorage.setItem(WALLET_NAME_KEY, wallet.adapter.name);
    }
  }, [wallet]);

  // Set a flag when connection state changes
  useEffect(() => {
    if (connected) {
      localStorage.setItem(WALLET_CONNECTED_KEY, "true");
    } else if (!connecting && !disconnecting) {
      localStorage.removeItem(WALLET_CONNECTED_KEY);
    }
  }, [connected, connecting, disconnecting]);

  return { connect };
}
