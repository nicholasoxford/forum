"use client";

import { FC, useState } from "react";
import { Button } from "./button";
import { ImageUploader } from "./image-uploader";

interface TokenCreatorProps {
  onCreateToken: (tokenConfig: {
    name: string;
    symbol: string;
    uri: string;
    decimals: number;
    transferFeeBasisPoints: number;
    maximumFee: bigint;
    initialMintAmount?: bigint;
    amount: bigint;
  }) => Promise<void>;
  isLoading?: boolean;
  defaultName?: string;
  defaultSymbol?: string;
  defaultDescription?: string;
  defaultDecimals?: number;
  defaultTransferFeeBasisPoints?: number;
  defaultMaximumFee?: string;
  defaultInitialMintAmount?: string;
  defaultImageUrl?: string;
}

export const TokenCreator: FC<TokenCreatorProps> = ({
  onCreateToken,
  isLoading = false,
  defaultName = "",
  defaultSymbol = "",
  defaultDescription = "",
  defaultDecimals = 9,
  defaultTransferFeeBasisPoints = 100,
  defaultMaximumFee = "1000000000",
  defaultInitialMintAmount = "1000000000",
  defaultImageUrl = "",
}) => {
  const [name, setName] = useState(defaultName);
  const [symbol, setSymbol] = useState(defaultSymbol);
  const [uri, setUri] = useState(""); // URI is generated, not prefilled
  const [imageUrl, setImageUrl] = useState(defaultImageUrl);
  const [decimals, setDecimals] = useState(defaultDecimals);
  const [transferFeeBasisPoints, setTransferFeeBasisPoints] = useState(
    defaultTransferFeeBasisPoints
  );
  const [maximumFee, setMaximumFee] = useState(defaultMaximumFee);
  const [initialMintAmount, setInitialMintAmount] = useState(
    defaultInitialMintAmount
  );
  const [description, setDescription] = useState(defaultDescription);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleImageUpload = (url: string) => {
    setImageUrl(url);
    setUploadError(null);
  };

  const handleImageError = (error: Error) => {
    setUploadError(error.message);
  };

  const generateMetadata = async () => {
    if (!imageUrl) {
      setUploadError("Please upload an image for your token");
      return null;
    }

    // Create metadata object
    const metadata = {
      name,
      symbol,
      description,
      image: imageUrl,
    };

    try {
      // Send metadata to API to store it
      const response = await fetch("/api/metadata", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      });

      if (!response.ok) {
        throw new Error("Failed to store metadata");
      }

      const { uri } = await response.json();
      return uri;
    } catch (error) {
      console.error("Failed to generate metadata:", error);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);

    try {
      // Generate and upload metadata
      const metadataUri = await generateMetadata();
      if (!metadataUri) return;
      console.log({ initialMintAmount });
      // Create token
      await onCreateToken({
        name,
        symbol,
        uri: metadataUri,
        decimals,
        transferFeeBasisPoints,
        maximumFee: BigInt(maximumFee),
        initialMintAmount: BigInt(initialMintAmount),
        amount: BigInt(initialMintAmount),
      });

      // Reset form
      setName("");
      setSymbol("");
      setUri("");
      setImageUrl("");
      setDescription("");
      setDecimals(9);
      setTransferFeeBasisPoints(100);
      setMaximumFee("1000000000");
      setInitialMintAmount("1000000000");
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-background rounded-lg shadow-lg p-6 border border-border">
      <h2 className="text-2xl font-bold mb-6 text-foreground">
        Create Your Community Token
      </h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Token Name
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My Community Token"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="symbol" className="block text-sm font-medium">
              Token Symbol
            </label>
            <input
              id="symbol"
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={symbol}
              onChange={(e) => setSymbol(e.target.value.toUpperCase())}
              placeholder="MCT"
              maxLength={5}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="description" className="block text-sm font-medium">
            Description
          </label>
          <textarea
            id="description"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe your community token"
            rows={3}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Token Image</label>
          <ImageUploader
            onImageUpload={handleImageUpload}
            onError={handleImageError}
            imageUrl={imageUrl}
          />
          {uploadError && <p className="text-sm text-red-500">{uploadError}</p>}
          <p className="text-xs text-muted-foreground">
            This image will be used for your token's logo
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label htmlFor="decimals" className="block text-sm font-medium">
              Decimals
            </label>
            <input
              id="decimals"
              type="number"
              min={0}
              max={9}
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={decimals}
              onChange={(e) => setDecimals(parseInt(e.target.value))}
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="transferFeeBasisPoints"
              className="block text-sm font-medium"
            >
              Transfer Fee (%)
            </label>
            <div className="flex items-center">
              <input
                id="transferFeeBasisPoints"
                type="number"
                min={0}
                max={1000}
                step={1}
                className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                value={transferFeeBasisPoints}
                onChange={(e) =>
                  setTransferFeeBasisPoints(parseInt(e.target.value))
                }
                required
              />
              <span className="ml-2">bps</span>
            </div>
            <p className="text-xs text-muted-foreground">
              100 basis points = 1%
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="maximumFee" className="block text-sm font-medium">
              Maximum Fee (tokens)
            </label>
            <input
              id="maximumFee"
              type="text"
              className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              value={maximumFee}
              onChange={(e) => {
                // Only allow numbers
                if (/^\d*$/.test(e.target.value)) {
                  setMaximumFee(e.target.value);
                }
              }}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <label
            htmlFor="initialMintAmount"
            className="block text-sm font-medium"
          >
            Initial Mint Amount
          </label>
          <input
            id="initialMintAmount"
            type="text"
            className="w-full px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            value={initialMintAmount}
            onChange={(e) => {
              // Only allow numbers
              if (/^\d*$/.test(e.target.value)) {
                setInitialMintAmount(e.target.value);
              }
            }}
            required
          />
          <p className="text-xs text-muted-foreground">
            Amount of tokens to mint to your wallet initially
          </p>
        </div>

        <div className="pt-4">
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Creating Token..." : "Create Token"}
          </Button>
        </div>
      </form>
    </div>
  );
};
