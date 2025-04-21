"use client";

import { WalletAuth } from "./wallet-auth";

export function AuthButton() {
  return (
    <div className="flex items-center justify-center">
      <WalletAuth />
    </div>
  );
}
