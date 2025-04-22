"use client";

import { Header } from "@workspace/ui/components/header";
import { WalletAuth } from "./wallet-connect/wallet-auth";

export function CustomHeader() {
  return (
    <div className="relative">
      <Header />
      <div className="fixed top-4 right-20 z-50">
        <WalletAuth />
      </div>
    </div>
  );
}
