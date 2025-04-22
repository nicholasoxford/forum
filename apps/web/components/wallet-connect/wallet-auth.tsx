"use client";

import { FC, useState, useCallback, memo } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { signIn, signOut, useSession, getCsrfToken } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { SigninMessage } from "@/utils/SigninMessage";
import bs58 from "bs58";

export const WalletAuth: FC = memo(() => {
  const { publicKey, signMessage, disconnect } = useWallet();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = useCallback(async () => {
    try {
      if (!publicKey || !signMessage) {
        return;
      }

      setIsLoading(true);
      const csrfToken = await getCsrfToken();

      if (!csrfToken) {
        console.error("Failed to get CSRF token");
        return;
      }

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
      const signInResult = await signIn("solana", {
        message: JSON.stringify(message),
        signature,
        redirect: false,
      });

      if (signInResult?.error) {
        console.error("Sign in error:", signInResult.error);
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  }, [publicKey, signMessage]);

  const handleSignOut = useCallback(async () => {
    await disconnect();
    await signOut({
      redirect: false,
      callbackUrl: "/",
    });
    window.location.href = "/";
  }, [disconnect]);

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
});

WalletAuth.displayName = "WalletAuth";
