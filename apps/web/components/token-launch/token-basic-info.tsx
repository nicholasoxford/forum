import { useState, useRef, ChangeEvent } from "react";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Button } from "@workspace/ui/components/button";
import { Textarea } from "@workspace/ui/components/textarea";
import { Image as ImageIcon } from "lucide-react";

export interface TokenBasicInfoProps {
  name: string;
  setName: (name: string) => void;
  symbol: string;
  setSymbol: (symbol: string) => void;
  description: string;
  setDescription: (description: string) => void;
  selectedImage: File | null;
  setSelectedImage: (image: File | null) => void;
  imagePreview: string | null;
  setImagePreview: (preview: string | null) => void;
  onNext: () => void;
  isLoading: boolean;
}

export const TokenBasicInfo = ({
  name,
  setName,
  symbol,
  setSymbol,
  description,
  setDescription,
  selectedImage,
  setSelectedImage,
  imagePreview,
  setImagePreview,
  onNext,
  isLoading,
}: TokenBasicInfoProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle image selection and preview
  const handleImageSelect = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedImage(file);

      // Create preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-8 items-center">
          {/* Token image upload */}
          <div
            className="relative size-32 md:size-36 rounded-full bg-black/40 border-2 border-dashed border-violet-500/40 hover:border-violet-500/70 flex items-center justify-center cursor-pointer overflow-hidden transition-all group"
            onClick={() => fileInputRef.current?.click()}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Token Preview"
                className="absolute inset-0 size-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center justify-center text-zinc-400 group-hover:text-zinc-300 transition-colors">
                <ImageIcon className="size-8 mb-2" />
                <span className="text-xs text-center">Upload Token Image</span>
              </div>
            )}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-70 flex items-center justify-center transition-opacity">
              <span className="text-white text-xs font-medium">Change</span>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handleImageSelect}
            />
          </div>

          {/* Token name and symbol */}
          <div className="flex-1 space-y-4 w-full">
            <div className="space-y-1.5">
              <Label htmlFor="name" className="text-zinc-300">
                Token Name
              </Label>
              <Input
                id="name"
                placeholder="My Awesome Token"
                value={name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setName(e.target.value)
                }
                disabled={isLoading}
                className="bg-black/40 border-zinc-800 focus:border-violet-500/50 text-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="symbol" className="text-zinc-300">
                Token Symbol
              </Label>
              <Input
                id="symbol"
                placeholder="AWSM"
                value={symbol}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSymbol(e.target.value)
                }
                disabled={isLoading}
                maxLength={10}
                className="bg-black/40 border-zinc-800 focus:border-violet-500/50 text-white uppercase"
              />
              <p className="text-xs text-zinc-500">
                Short identifier for your token (e.g. BTC, ETH, SOL)
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="description" className="text-zinc-300">
            Description
          </Label>
          <Textarea
            id="description"
            placeholder="A brief description of your token and community"
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
              setDescription(e.target.value)
            }
            disabled={isLoading}
            className="bg-black/40 border-zinc-800 focus:border-violet-500/50 text-white min-h-24"
          />
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button
          onClick={onNext}
          disabled={!name || !symbol || isLoading}
          className="bg-violet-500 hover:bg-violet-600 text-white px-6 py-5 text-base font-medium"
        >
          Next: Token Economics
        </Button>
      </div>
    </div>
  );
};
