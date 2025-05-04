"use client";

import { useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { PublicKey } from "@solana/web3.js";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";
import { toast } from "sonner";
import { server } from "@/utils/elysia";

export function LaunchPoolForm() {
  const { publicKey, connected, signMessage } = useWallet();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    tokenMint: "",
    initialLiquidity: "1",
    feeBps: "100",
    maxFee: "0.1",
    magicSol: "10",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!connected || !publicKey || !signMessage) {
      toast.error("Please connect your wallet first");
      return;
    }

    try {
      setIsLoading(true);

      // Validate token mint address
      let tokenMintPubkey: PublicKey;
      try {
        tokenMintPubkey = new PublicKey(formData.tokenMint);
      } catch (error) {
        toast.error("Invalid token mint address");
        return;
      }

      const { data, error } = await server.instructions["launch-pool"].post({
        tokenName: "Test Token",
        tokenSymbol: "TEST",
        ownerAddress: publicKey.toString(),
        mintB: formData.tokenMint,
        tokenWallet: formData.tokenMint,
        shift: parseFloat(formData.magicSol),
        royaltiesBps: parseInt(formData.feeBps),
      });

      if (data) {
        toast.success("Pool launched successfully!");
        // Reset form
        setFormData({
          tokenMint: "",
          initialLiquidity: "1",
          feeBps: "100",
          maxFee: "0.1",
          magicSol: "10",
        });
      } else {
        toast.error(`Failed to launch pool: ${error}`);
      }
    } catch (error) {
      console.error("Error launching pool:", error);
      toast.error("An error occurred while launching the pool");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Launch Vertigo Pool</CardTitle>
        <CardDescription>
          Create a new liquidity pool for your token
        </CardDescription>
      </CardHeader>
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tokenMint">Token Mint Address</Label>
            <Input
              id="tokenMint"
              name="tokenMint"
              value={formData.tokenMint}
              onChange={handleInputChange}
              placeholder="Enter token mint address"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="initialLiquidity">Initial Liquidity (SOL)</Label>
            <Input
              id="initialLiquidity"
              name="initialLiquidity"
              type="number"
              min="0.1"
              step="0.1"
              value={formData.initialLiquidity}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="feeBps">Fee (basis points)</Label>
            <Input
              id="feeBps"
              name="feeBps"
              type="number"
              min="0"
              max="10000"
              value={formData.feeBps}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              100 basis points = 1%
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxFee">Maximum Fee (SOL)</Label>
            <Input
              id="maxFee"
              name="maxFee"
              type="number"
              min="0.01"
              step="0.01"
              value={formData.maxFee}
              onChange={handleInputChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="magicSol">Magic SOL</Label>
            <Input
              id="magicSol"
              name="magicSol"
              type="number"
              min="1"
              step="1"
              value={formData.magicSol}
              onChange={handleInputChange}
              required
            />
            <p className="text-xs text-muted-foreground">
              Determines initial market cap
            </p>
          </div>
        </CardContent>

        <CardFooter>
          <Button
            type="submit"
            className="w-full"
            disabled={!connected || isLoading}
          >
            {isLoading ? "Launching..." : "Launch Pool"}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
