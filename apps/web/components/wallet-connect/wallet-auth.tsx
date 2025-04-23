"use client";

import { FC, useState, useCallback, memo, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { signIn, signOut, useSession, getCsrfToken } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { SigninMessage } from "@/utils/SigninMessage";
import bs58 from "bs58";
import { WalletModal } from "@workspace/ui/components/wallet-connect/wallet-modal";

export const WalletAuth: FC = memo(() => {
  const { publicKey, signMessage, disconnect, connect, connected } =
    useWallet();
  const { data: session } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  const handleSignIn = useCallback(async () => {
    try {
      if (!connected) {
        setIsWalletModalOpen(true);
        return;
      }

      setIsLoading(true);
      const csrfToken = await getCsrfToken();

      if (!csrfToken) {
        console.error("Failed to get CSRF token");
        return;
      }
      if (!publicKey || !signMessage) {
        console.error("No public key found");
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
  }, [publicKey, signMessage, connected]);

  // This effect will trigger the sign-in process when a wallet gets connected
  useEffect(() => {
    if (connected && publicKey && !session && !isLoading) {
      handleSignIn();
    }
  }, [connected, publicKey, session, handleSignIn, isLoading]);

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
      <div className="bg-black/70 backdrop-blur-sm p-2 rounded-lg shadow-md">
        <div className="text-xs text-white text-center mb-1">
          <span className="font-mono">{session.user.name?.slice(0, 6)}...</span>
        </div>
        <Button
          variant="destructive"
          size="sm"
          onClick={handleSignOut}
          disabled={isLoading}
          className="h-8 px-3 py-0 text-xs"
        >
          Sign Out
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button
        onClick={handleSignIn}
        size="sm"
        className="h-8 px-3 py-0 text-xs bg-violet-600 hover:bg-violet-700"
      >
        {isLoading ? "Signing in..." : "Sign in"}
      </Button>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
});

WalletAuth.displayName = "WalletAuth";
