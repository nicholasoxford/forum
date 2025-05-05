import React from "react";
import { Loader2 } from "lucide-react";
import { TokenCard } from "./token-card";
import { type Token } from "@workspace/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card";

interface TokenListProps {
  tokens: Token[];
  loading: boolean;
  selectedTokenMint?: string;
  onSelectToken?: (tokenMintAddress: string) => void;
  title?: string;
  description?: string;
}

export function TokenList({
  tokens,
  loading,
  selectedTokenMint,
  onSelectToken,
  title = "Available Tokens",
  description = "Select a token from the list below",
}: TokenListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
          </div>
        ) : tokens.length > 0 ? (
          <div className="grid gap-2">
            {tokens.map((token) => (
              <TokenCard
                key={token.tokenMintAddress}
                token={token}
                isSelected={selectedTokenMint === token.tokenMintAddress}
                onClick={() => onSelectToken?.(token.tokenMintAddress)}
              />
            ))}
          </div>
        ) : (
          <p className="text-center py-4 text-gray-500">No tokens available</p>
        )}
      </CardContent>
    </Card>
  );
}
