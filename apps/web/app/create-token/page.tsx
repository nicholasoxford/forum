"use client";

import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { Connection } from "@solana/web3.js";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
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
import { createSplToken, SplTokenConfig } from "@/lib/create-spl-token";
import { toast } from "sonner";
import { WalletButton } from "@workspace/ui/components";
import { useUmi } from "@/lib/umi";
import { createTokenMint } from "@/lib/token-mint";
import { base58 } from "@metaplex-foundation/umi/serializers";

const DEFAULT_DECIMALS = 9;
const DEFAULT_FEE_BASIS_POINTS = 100;
const DEFAULT_MAX_FEE = 1_000_000_000n;
const DEFAULT_INITIAL_MINT_AMOUNT = 1_000_000_000_000_000_000n;

export default function CreateTokenPage() {
  const wallet = useWallet();
  const umi = useUmi();
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());
  umi.use(walletAdapterIdentity(wallet));
  const [name, setName] = useState("Test Token");
  const [symbol, setSymbol] = useState("TEST");
  const [uri, setUri] = useState("https://example.com/metadata.json");
  const [decimals, setDecimals] = useState<number>(DEFAULT_DECIMALS);
  const [feeBps, setFeeBps] = useState<number>(DEFAULT_FEE_BASIS_POINTS);
  const [maxFee, setMaxFee] = useState<string>(DEFAULT_MAX_FEE.toString());
  const [initialMint, setInitialMint] = useState<string>(
    DEFAULT_INITIAL_MINT_AMOUNT.toString()
  );
  const [isLoading, setIsLoading] = useState(false);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);

  const handleCreateToken = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      toast.error("Wallet not connected!");
      return;
    }
    setIsLoading(true);
    setMintAddress(null);
    setTxSignature(null);

    try {
      const parsedMaxFee = BigInt(maxFee);
      const parsedInitialMintAmount = BigInt(initialMint);

      const tokenConfig: SplTokenConfig = {
        name,
        symbol,
        uri,
        decimals,
        transferFeeBasisPoints: feeBps,
        maximumFee: parsedMaxFee,
        initialMintAmount:
          parsedInitialMintAmount > 0n ? parsedInitialMintAmount : undefined,
      };

      const { mint: mintSigner } = await createSplToken(umi, tokenConfig);
      setMintAddress(mintSigner.publicKey.toString());

      toast.success(
        `Token creation initiated! Mint: ${mintSigner.publicKey.toString()}`,
        {
          description:
            "Transaction sent. Check console for details and explorer links.",
        }
      );
    } catch (error: any) {
      console.error("Token creation failed:", error);
      toast.error("Token creation failed", {
        description: error?.message || "An unknown error occurred.",
      });
      setMintAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [wallet, name, symbol, uri, decimals, feeBps, maxFee, initialMint, umi]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Create Your Token</h1>
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Token Configuration</CardTitle>
          <CardDescription>
            Define the properties for your new SPL Token-2022.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="My Awesome Token"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                placeholder="AWSM"
                value={symbol}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSymbol(e.target.value)
                }
                disabled={isLoading}
                maxLength={10}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="uri">Metadata URI</Label>
            <Input
              id="uri"
              placeholder="https://arweave.net/..."
              value={uri}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setUri(e.target.value)
              }
              disabled={isLoading}
            />
            <p className="text-xs text-muted-foreground">
              Link to the off-chain JSON metadata file (e.g., Arweave, IPFS).
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="decimals">Decimals</Label>
              <Input
                id="decimals"
                type="number"
                min="0"
                max="18"
                value={decimals}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setDecimals(parseInt(e.target.value, 10) || 0)
                }
                disabled={isLoading}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="feeBps">Transfer Fee (Basis Points)</Label>
              <Input
                id="feeBps"
                type="number"
                min="0"
                max="10000"
                value={feeBps}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setFeeBps(parseInt(e.target.value, 10) || 0)
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">100 = 1%</p>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="maxFee">Maximum Fee (Lamports)</Label>
              <Input
                id="maxFee"
                type="number"
                min="0"
                value={maxFee}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setMaxFee(e.target.value)
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Max fee per transfer in smallest units (e.g., 10^9 = 1 token if
                9 decimals).
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="initialMint">
                Initial Mint Amount (Lamports)
              </Label>
              <Input
                id="initialMint"
                type="number"
                min="0"
                value={initialMint}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setInitialMint(e.target.value)
                }
                disabled={isLoading}
              />
              <p className="text-xs text-muted-foreground">
                Smallest units to mint initially to your wallet (0 for none).
              </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          {wallet.connected ? (
            <Button
              onClick={handleCreateToken}
              disabled={
                !name || !symbol || !uri || isLoading || !wallet.publicKey
              }
              className="w-full"
            >
              {isLoading ? "Creating..." : "Create Token"}
            </Button>
          ) : (
            <WalletButton className="w-full" />
          )}
          {mintAddress && (
            <p className="text-sm text-center text-muted-foreground">
              Mint Address: {mintAddress}
            </p>
          )}
          {txSignature && (
            <p className="text-sm text-center text-muted-foreground break-all">
              Tx: {txSignature}
            </p>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
