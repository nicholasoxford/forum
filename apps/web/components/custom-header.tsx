"use client";

import { Header } from "@workspace/ui/components/header";
import { WalletAuth } from "./wallet-connect/wallet-auth";

export function CustomHeader() {
  return <Header walletAuthComponent={<WalletAuth />} />;
}
