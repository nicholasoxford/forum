"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useWallet } from "@jup-ag/wallet-adapter";
import { WalletButton } from "@workspace/ui/components";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { Button } from "@workspace/ui/components/button";
import { toast } from "sonner";

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const { connected, publicKey, signMessage } = useWallet();
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    "idle" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Get chat and user IDs from URL parameters
  const chatId = searchParams.get("chat");
  const userId = searchParams.get("user");

  // Check if we have the required parameters
  const hasRequiredParams = chatId && userId;

  const handleVerify = async () => {
    if (!connected || !publicKey || !signMessage || !chatId || !userId) {
      toast.error("Please connect your wallet first");
      return;
    }

    setIsVerifying(true);
    setVerificationStatus("idle");
    setErrorMessage(null);

    try {
      // Create the message to sign
      const message = `Join request for ${chatId} by ${userId}`;

      // Sign the message
      const encodedMessage = new TextEncoder().encode(message);
      const signature = await signMessage(encodedMessage);

      // Convert signature to array of numbers for the API
      const signatureArray = Array.from(signature);

      // Send verification request to the worker
      const response = await fetch(
        "https://tg-gatekeeper.noxford1.workers.dev/api/verify",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            chatId: parseInt(chatId),
            userId: parseInt(userId),
            pubkey: publicKey.toString(),
            signature: signatureArray,
          }),
        }
      );

      const result = await response.text();

      if (result === "approved") {
        setVerificationStatus("success");
        toast.success(
          "Verification successful! You can now return to Telegram."
        );
      } else if (result === "denied") {
        setVerificationStatus("error");
        setErrorMessage("You don't have enough tokens to join this group.");
        toast.error(
          "Verification failed: You don't have enough tokens to join this group."
        );
      } else {
        setVerificationStatus("error");
        setErrorMessage("Verification failed. Please try again.");
        toast.error("Verification failed. Please try again.");
      }
    } catch (error) {
      console.error("Verification error:", error);
      setVerificationStatus("error");
      setErrorMessage(
        "An error occurred during verification. Please try again."
      );
      toast.error("An error occurred during verification. Please try again.");
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Verify Your Wallet</CardTitle>
          <CardDescription>
            Connect your wallet to verify your token holdings for the Telegram
            group
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-6">
          {!hasRequiredParams ? (
            <div className="text-center text-destructive">
              <p>
                Missing required parameters. Please use the link provided in
                Telegram.
              </p>
            </div>
          ) : (
            <>
              {!connected ? (
                <div className="w-full flex flex-col items-center gap-4">
                  <p className="text-center text-muted-foreground mb-2">
                    Connect your wallet to verify your token holdings
                  </p>
                  <WalletButton className="w-full" />
                </div>
              ) : (
                <div className="w-full flex flex-col items-center gap-4">
                  {verificationStatus === "idle" ? (
                    <>
                      <p className="text-center text-muted-foreground">
                        Your wallet is connected. Click the button below to
                        verify your token holdings.
                      </p>
                      <Button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="w-full"
                      >
                        {isVerifying ? "Verifying..." : "Verify Wallet"}
                      </Button>
                    </>
                  ) : verificationStatus === "success" ? (
                    <div className="text-center text-green-500">
                      <p className="font-medium">Verification Successful!</p>
                      <p className="text-sm mt-1">
                        You can now return to Telegram and join the group.
                      </p>
                    </div>
                  ) : (
                    <div className="text-center text-destructive">
                      <p className="font-medium">Verification Failed</p>
                      <p className="text-sm mt-1">{errorMessage}</p>
                      <Button
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className="mt-4 w-full"
                        variant="outline"
                      >
                        Try Again
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
