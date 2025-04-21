"use client";

import { FC, useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { SigninMessage } from "@/utils/SigninMessage";
import bs58 from "bs58";

export const WalletAuth: FC = () => {
  const { publicKey, signMessage, disconnect } = useWallet();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      if (!publicKey || !signMessage) return;

      setIsLoading(true);

      // Get CSRF token
      const csrfResponse = await fetch("/api/auth/csrf");
      const { csrfToken } = await csrfResponse.json();

      // Create the message to sign
      const message = new SigninMessage({
        domain: window.location.host,
        publicKey: publicKey.toBase58(),
        statement: "Sign this message to sign in to the app.",
        nonce: csrfToken,
      });

      // Sign the message
      const encodedMessage = new TextEncoder().encode(message.prepare());
      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);

      // Sign in with NextAuth
      await signIn("solana", {
        message: JSON.stringify(message),
        signature,
        redirect: false,
      });
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await disconnect();
    await signOut({ redirect: false });
  };

  if (session && session.user) {
    return (
      <div className="flex flex-col items-center gap-2">
        <div className="text-sm">
          Connected as:{" "}
          <span className="font-mono">{session.user.name?.slice(0, 8)}...</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <Button
      onClick={handleSignIn}
      disabled={!publicKey || !signMessage || isLoading}
      size="sm"
    >
      {isLoading ? "Signing in..." : "Sign in with Wallet"}
    </Button>
  );
};
