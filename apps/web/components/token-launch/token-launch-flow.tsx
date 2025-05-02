import { useState, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { walletAdapterIdentity } from "@metaplex-foundation/umi-signer-wallet-adapters";
import { mplToolbox } from "@metaplex-foundation/mpl-toolbox";
import { mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { Card, CardContent } from "@workspace/ui/components/card";
import { createSplToken, SplTokenConfig } from "@/lib/create-spl-token";
import { toast } from "sonner";
import { useUmi } from "@/lib/umi";
import { ChevronRight } from "lucide-react";
import { TokenBasicInfo } from "./token-basic-info";
import { TokenEconomics } from "./token-economics";
import { TokenSuccess } from "./token-success";

const DEFAULT_DECIMALS = 6;
const DEFAULT_FEE_BASIS_POINTS = 100; // 1%
const DEFAULT_MAX_FEE = 1_000_000_000n * 1_000_000_000n;
const ONE_BILLION = 1_000_000_000;

export const TokenLaunchFlow = () => {
  const wallet = useWallet();
  const umi = useUmi();
  umi.use(mplToolbox());
  umi.use(mplTokenMetadata());
  umi.use(walletAdapterIdentity(wallet));

  // Basic info state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [description, setDescription] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Token economics state
  const [decimals, setDecimals] = useState<number>(DEFAULT_DECIMALS);
  const [feeBps, setFeeBps] = useState<number>(DEFAULT_FEE_BASIS_POINTS);
  const [maxFee, setMaxFee] = useState<string>(DEFAULT_MAX_FEE.toString());
  const [initialMint, setInitialMint] = useState<string>(
    (ONE_BILLION * Math.pow(10, DEFAULT_DECIMALS)).toString()
  );
  const [requiredHoldings, setRequiredHoldings] = useState<string>(
    (100 * Math.pow(10, DEFAULT_DECIMALS)).toString()
  );
  const [customMarketCap, setCustomMarketCap] = useState<string>("10000");
  const [isCustomMarketCap, setIsCustomMarketCap] = useState<boolean>(false);

  // Process state
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [mintAddress, setMintAddress] = useState<string | null>(null);
  const [txSignature, setTxSignature] = useState<string | null>(null);
  const [telegramChannelIdCreated, setTelegramChannelIdCreated] = useState<
    string | null
  >(null);
  const [telegramUsernameCreated, setTelegramUsernameCreated] = useState<
    string | null
  >(null);
  const [groupChatCreated, setGroupChatCreated] = useState(false);

  // Step navigation
  const goToNextStep = () => {
    setCurrentStep((prev) => prev + 1);
  };

  const goToPrevStep = () => {
    setCurrentStep((prev) => Math.max(1, prev - 1));
  };

  // Upload image via API
  const uploadImage = async (): Promise<string> => {
    if (!selectedImage) {
      throw new Error("No image selected");
    }

    setUploadingImage(true);
    try {
      // The image uploader now directly uploads to S3 using the correct endpoint,
      // so we just need to handle the image preview here
      return imagePreview || "";
    } finally {
      setUploadingImage(false);
    }
  };

  // Create metadata JSON and upload it
  const createMetadata = async (imageUrl: string): Promise<string> => {
    try {
      // Create metadata using the metadata API endpoint
      const metadataResponse = await fetch(
        "https://forum-lingering-leaf-9073.fly.dev/api/metadata",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            symbol,
            description: description || `Token for the ${name} community chat.`,
            image: imageUrl,
          }),
        }
      );

      if (!metadataResponse.ok) {
        throw new Error("Failed to create metadata");
      }

      const { uri } = await metadataResponse.json();
      return uri;
    } catch (error) {
      console.error("Error creating metadata:", error);
      throw error;
    }
  };

  const handleCreateToken = useCallback(async () => {
    if (!wallet.connected || !wallet.publicKey || !wallet.signTransaction) {
      toast.error("Wallet not connected!");
      return;
    }

    if (!name || !symbol) {
      toast.error("Token name and symbol are required!");
      return;
    }

    setIsLoading(true);
    setMintAddress(null);
    setTxSignature(null);

    try {
      // Get the image URL from the preview or upload
      let imageUrl = imagePreview || "";
      if (selectedImage) {
        imageUrl = await uploadImage();
      }

      // Create metadata and get URI
      let metadataUri = "";
      if (imageUrl) {
        metadataUri = await createMetadata(imageUrl);
      }

      // Always use 1 billion tokens as the initial mint amount
      const fixedInitialMintAmount = (
        ONE_BILLION * Math.pow(10, decimals)
      ).toString();

      const parsedMaxFee = BigInt(maxFee);
      const parsedInitialMintAmount = BigInt(fixedInitialMintAmount);

      const tokenConfig: SplTokenConfig = {
        name,
        symbol,
        uri: metadataUri,
        decimals,
        transferFeeBasisPoints: feeBps,
        maximumFee: parsedMaxFee,
        initialMintAmount:
          parsedInitialMintAmount > 0n ? parsedInitialMintAmount : undefined,
      };

      const { mint: mintSigner } = await createSplToken(umi, tokenConfig);
      const mintAddressStr = mintSigner.publicKey.toString();
      setMintAddress(mintAddressStr);

      // Create group chat automatically
      try {
        const response = await fetch("/api/tokens", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            tokenMintAddress: mintAddressStr,
            tokenSymbol: symbol,
            tokenName: name,
            decimals,
            transferFeeBasisPoints: feeBps,
            maximumFee: maxFee,
            metadataUri,
            creatorWalletAddress: wallet.publicKey.toString(),
            requiredHoldings,
            targetMarketCap: isCustomMarketCap ? customMarketCap : null,
          }),
        });

        const respData = await response.json();

        if (!response.ok) {
          console.error("Failed to save token to database:", respData);
        } else {
          if (respData.telegramChannelId) {
            setTelegramChannelIdCreated(respData.telegramChannelId);
            setTelegramUsernameCreated(respData.telegramUsername || null);
            setGroupChatCreated(true);
          }
          setCurrentStep(3); // Success step
        }
      } catch (dbError) {
        console.error("Error saving token to database:", dbError);
      }

      toast.success(`${name} token created successfully!`, {
        description: `Your token is now live on the Solana blockchain.`,
      });
    } catch (error: any) {
      console.error("Token creation failed:", error);
      toast.error("Token creation failed", {
        description: error?.message || "An unknown error occurred.",
      });
      setMintAddress(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    wallet,
    name,
    symbol,

    decimals,
    feeBps,
    maxFee,
    requiredHoldings,
    customMarketCap,
    isCustomMarketCap,
    umi,
    selectedImage,
    imagePreview,

    createMetadata,
    uploadImage,
  ]);

  // Render appropriate step content
  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <TokenBasicInfo
            name={name}
            setName={setName}
            symbol={symbol}
            setSymbol={setSymbol}
            description={description}
            setDescription={setDescription}
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
            imagePreview={imagePreview}
            setImagePreview={setImagePreview}
            onNext={goToNextStep}
            isLoading={isLoading}
          />
        );
      case 2:
        return (
          <TokenEconomics
            feeBps={feeBps}
            setFeeBps={setFeeBps}
            initialMint={initialMint}
            setInitialMint={setInitialMint}
            requiredHoldings={requiredHoldings}
            setRequiredHoldings={setRequiredHoldings}
            customMarketCap={customMarketCap}
            setCustomMarketCap={setCustomMarketCap}
            isCustomMarketCap={isCustomMarketCap}
            setIsCustomMarketCap={setIsCustomMarketCap}
            decimals={decimals}
            symbol={symbol}
            onBack={goToPrevStep}
            onSubmit={handleCreateToken}
            isLoading={isLoading}
          />
        );
      case 3:
        return mintAddress ? (
          <TokenSuccess
            name={name}
            symbol={symbol}
            mintAddress={mintAddress}
            initialMint={initialMint}
            requiredHoldings={requiredHoldings}
            decimals={decimals}
            telegramChannelId={telegramChannelIdCreated}
            telegramUsername={telegramUsernameCreated}
          />
        ) : null;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen after:orb token-flow-bg flex flex-col items-center py-20 bg-black">
      <div className="container max-w-3xl mx-auto px-4">
        <div className="flex flex-col text-center mb-12">
          <div className="inline-block relative mx-auto">
            <div className="absolute inset-0 blur-xl opacity-20 bg-violet-500 rounded-full transform scale-150"></div>
            <h1 className="font-display text-4xl md:text-5xl font-bold mb-6 text-white relative inline-block">
              Launch Your Token
              <span className="absolute -bottom-2 left-0 right-0 h-1 bg-violet-500/60"></span>
            </h1>
          </div>
          <p className="text-zinc-300 max-w-xl mx-auto">
            Create a token with revenue-sharing for your community. Set up a
            token-gated Telegram group in one step.
          </p>
        </div>

        {/* Token creation card with glowing effect */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-violet-800/30 to-purple-900/20 rounded-xl blur-xl opacity-50 transform -translate-y-4 translate-x-2 scale-95"></div>

          <Card className="token-card border-zinc-800/80 bg-black/80 backdrop-blur-xl shadow-xl overflow-hidden relative">
            {/* Progress indicators */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-violet-500/30 to-transparent"></div>

            {/* Step display */}
            {currentStep < 3 && (
              <div className="flex items-center justify-center gap-2 py-4 text-zinc-400 text-sm border-b border-zinc-800/50">
                <div
                  className={`flex items-center gap-1 ${
                    currentStep === 1 ? "text-violet-400 font-medium" : ""
                  }`}
                >
                  <div
                    className={`size-5 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 1
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    1
                  </div>
                  <span>Configure</span>
                </div>

                <ChevronRight className="size-4 text-zinc-700" />

                <div
                  className={`flex items-center gap-1 ${
                    currentStep === 2 ? "text-violet-400 font-medium" : ""
                  }`}
                >
                  <div
                    className={`size-5 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 2
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    2
                  </div>
                  <span>Settings</span>
                </div>

                <ChevronRight className="size-4 text-zinc-700" />

                <div
                  className={`flex items-center gap-1 ${
                    currentStep === 3 ? "text-violet-400 font-medium" : ""
                  }`}
                >
                  <div
                    className={`size-5 rounded-full flex items-center justify-center text-xs ${
                      currentStep === 3
                        ? "bg-violet-500/20 text-violet-400"
                        : "bg-zinc-800 text-zinc-500"
                    }`}
                  >
                    3
                  </div>
                  <span>Success</span>
                </div>
              </div>
            )}

            {/* Step content */}
            <CardContent>{renderStepContent()}</CardContent>
          </Card>
        </div>

        {/* Feature highlights */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <div className="flex flex-col items-center text-center p-4">
            <div className="size-12 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 text-violet-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8" />
                <path d="M12 18V6" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Revenue Sharing
            </h3>
            <p className="text-zinc-400 text-sm">
              Every transaction generates fees that are distributed to all token
              holders.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="size-12 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 text-violet-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Gated Community
            </h3>
            <p className="text-zinc-400 text-sm">
              Only token holders can join your exclusive Telegram group chat.
            </p>
          </div>

          <div className="flex flex-col items-center text-center p-4">
            <div className="size-12 bg-violet-500/10 rounded-full flex items-center justify-center mb-4 text-violet-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="m12 16 4-4-4-4" />
                <path d="M8 12h8" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-white mb-2">
              Instant Setup
            </h3>
            <p className="text-zinc-400 text-sm">
              Launch your token and community in minutes with no coding
              required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
