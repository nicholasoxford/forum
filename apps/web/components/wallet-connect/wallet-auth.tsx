"use client";

import { FC, useState, useCallback, memo, useEffect } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { signIn, signOut, useSession, getCsrfToken } from "next-auth/react";
import { Button } from "@workspace/ui/components/button";
import { SigninMessage } from "@/utils/SigninMessage";
import bs58 from "bs58";
import { WalletModal } from "@workspace/ui/components/wallet-connect/wallet-modal";
import { useWalletPersistence } from "@/hooks/use-wallet-persistence";

export const WalletAuth: FC = memo(() => {
  const { publicKey, signMessage, disconnect, connected, connecting } =
    useWallet();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Initialize wallet persistence
  useWalletPersistence();

  const handleSignIn = useCallback(async () => {
    if (status === "authenticated") return;

    try {
      // If not connected, open modal but don't start auth
      if (!connected || connecting) {
        setIsWalletModalOpen(true);
        return;
      }

      setIsLoading(true);

      const csrfToken = await getCsrfToken();
      if (!csrfToken || !publicKey || !signMessage) {
        console.error("Missing requirements for sign in");
        setIsLoading(false);
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
  }, [publicKey, signMessage, connected, connecting, status]);

  // This effect handles auto sign-in once per session when wallet gets connected
  useEffect(() => {
    // Only try to auto-sign in when:
    // 1. Wallet is connected
    // 2. We have a public key
    // 3. User is not already signed in
    // 4. Not already loading
    // 5. Not currently connecting
    if (
      !connected ||
      connecting ||
      !publicKey ||
      status === "authenticated" ||
      isLoading
    ) {
      return;
    }

    handleSignIn();
  }, [connected, publicKey, status, handleSignIn, isLoading, connecting]);

  const handleSignOut = useCallback(async () => {
    setIsLoading(true);
    try {
      await disconnect();
      await signOut({
        redirect: false,
        callbackUrl: "/",
      });
      // Reload the page to reset all state
      window.location.href = "/";
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsLoading(false);
    }
  }, [disconnect]);

  // Show loading state
  if (status === "loading" || isLoading) {
    return (
      <Button
        size="sm"
        className="h-8 px-3 py-0 text-xs bg-zinc-600 hover:bg-zinc-700 cursor-wait"
        disabled
      >
        Loading...
      </Button>
    );
  }

  // Show authenticated UI
  if (status === "authenticated" && session && session.user) {
    const displayName = session.user.name || session.publicKey || "User";
    return (
      <div className="bg-black/70 backdrop-blur-sm p-2 rounded-lg shadow-md">
        <div className="text-xs text-white text-center mb-1">
          <span className="font-mono">{displayName.slice(0, 6)}...</span>
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

  // Show unauthenticated UI
  return (
    <>
      <Button
        onClick={handleSignIn}
        size="sm"
        className="h-8 px-3 py-0 text-xs bg-violet-600 hover:bg-violet-700"
        disabled={isLoading}
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
