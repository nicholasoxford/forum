"use client";

import { FC, useState, useCallback, memo } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { Button } from "@workspace/ui/components/button";
import bs58 from "bs58";
import { WalletModal } from "@workspace/ui/components/wallet-connect/wallet-modal";
import { useAuth } from "../session-provider";
import {
  getMessageForSigning,
  authenticateWithServer,
  logoutFromServer,
} from "@/utils/server-auth";
import { useRouter } from "next/navigation";

export const WalletAuth: FC = memo(() => {
  const { publicKey, signMessage, disconnect, connected, connecting } =
    useWallet();
  const router = useRouter();
  const { session, status, isLoading, refreshSession } = useAuth();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = useCallback(async () => {
    if (status === "authenticated") return;

    try {
      // If not connected, open modal but don't start auth
      if (!connected || connecting) {
        setIsWalletModalOpen(true);
        return;
      }

      setIsSigningIn(true);

      if (!publicKey || !signMessage) {
        console.error("Missing wallet requirements for sign in");
        setIsSigningIn(false);
        return;
      }

      // Get message to sign from server
      const signinMessage = await getMessageForSigning(publicKey.toBase58());

      if (!signinMessage) {
        console.error("Failed to get message to sign");
        setIsSigningIn(false);
        return;
      }
      console.log("signinMessage: ", signinMessage);

      // Prepare the complete message including the nonce
      const preparedMessage = `${signinMessage.statement}${signinMessage.nonce}`;
      console.log("preparedMessage: ", preparedMessage);

      // Sign the complete message
      const encodedMessage = new TextEncoder().encode(preparedMessage);

      const signatureBytes = await signMessage(encodedMessage);
      const signature = bs58.encode(signatureBytes);
      console.log("signature: ", signature);

      // Authenticate with server
      const authResult = await authenticateWithServer(signinMessage, signature);
      console.log("authResult: ", authResult);

      if (!authResult) {
        console.error("Authentication failed");
        setIsSigningIn(false);
        return;
      }

      // Refresh the session to get the latest auth state
      await refreshSession();

      // Refresh the page to update UI
      router.refresh();
    } catch (error) {
      console.error("Error signing in:", error);
    } finally {
      setIsSigningIn(false);
    }
  }, [
    publicKey,
    signMessage,
    connected,
    connecting,
    status,
    router,
    refreshSession,
  ]);

  const handleSignOut = useCallback(async () => {
    setIsSigningIn(true);
    try {
      await disconnect();
      await logoutFromServer();

      // Refresh session after logout
      await refreshSession();

      // Refresh the page
      router.refresh();
    } catch (error) {
      console.error("Error signing out:", error);
    } finally {
      setIsSigningIn(false);
    }
  }, [disconnect, router, refreshSession]);

  // Show loading state
  if (status === "loading" || isLoading || isSigningIn) {
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
          disabled={isSigningIn}
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
        disabled={isSigningIn}
      >
        {isSigningIn
          ? "Signing in..."
          : connected
            ? "Sign in with Wallet"
            : "Connect Wallet"}
      </Button>
      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
});

WalletAuth.displayName = "WalletAuth";
