"use client";

import { FC, useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { signIn, signOut, useSession, getCsrfToken } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { SigninMessage } from "@/utils/SigninMessage";
import bs58 from "bs58";

export const WalletAuth: FC = () => {
  const { publicKey, signMessage, disconnect } = useWallet();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async () => {
    try {
      console.log("Sign in initiated", {
        publicKey: publicKey?.toBase58(),
        hasSignMessage: !!signMessage,
      });

      if (!publicKey || !signMessage) {
        console.error("Missing publicKey or signMessage");
        return;
      }

      setIsLoading(true);

      // Get CSRF token directly
      console.log("Getting CSRF token");
      const csrfToken = await getCsrfToken();
      console.log("CSRF token:", csrfToken ? "success" : "null");

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
      console.log("Created sign message:", {
        domain: window.location.host,
        nonce: csrfToken,
      });

      // Sign the message
      console.log("Requesting message signature");
      const encodedMessage = new TextEncoder().encode(message.prepare());
      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);
      console.log("Got signature:", signature.slice(0, 10) + "...");

      // Sign in with NextAuth
      console.log("Calling NextAuth signIn with:", {
        provider: "solana",
        messageLength: JSON.stringify(message).length,
        signatureLength: signature.length,
        message: {
          domain: message.domain,
          publicKey: message.publicKey.slice(0, 10) + "...",
          nonceLength: message.nonce.length,
          statement: message.statement,
        },
      });

      try {
        const signInResult = await signIn("solana", {
          message: JSON.stringify(message),
          signature,
          redirect: false,
        });
        console.log("Sign in result:", signInResult);

        if (signInResult?.error) {
          console.error("Sign in error:", signInResult.error);
        }
      } catch (error) {
        console.error("NextAuth signIn error:", error);
        if (error instanceof Error) {
          console.error("Error details:", {
            name: error.name,
            message: error.message,
            stack: error.stack,
          });
        }
      }
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    console.log("Sign out initiated");
    await disconnect();
    // Use callbackUrl: '/' to ensure proper redirect after sign out
    const signOutResult = await signOut({
      redirect: false,
      callbackUrl: "/",
    });
    console.log("Sign out result:", signOutResult);

    // Force page reload to clear any cached state
    window.location.href = "/";
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
