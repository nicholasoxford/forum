"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { useEffect, useState } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@workspace/ui/components/card";
import { WalletButton } from "@workspace/ui/components";

interface GroupChat {
  tokenMintAddress: string;
  telegramChatId: string;
  tokenSymbol: string;
  tokenName: string;
  requiredHoldings: string;
  creatorWalletAddress: string | null;
  createdAt: number;
}

export default function MyGroupChatsPage() {
  const { connected, publicKey } = useWallet();
  const [chats, setChats] = useState<GroupChat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchChats = async () => {
      if (!connected || !publicKey) return;
      setIsLoading(true);
      try {
        const res = await fetch(
          `/api/my-group-chats?walletAddress=${publicKey.toString()}`
        );
        const data = await res.json();
        if (res.ok) {
          setChats(data.chats ?? []);
        } else {
          console.error("Failed to fetch chats", data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchChats();
  }, [connected, publicKey]);

  if (!connected) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">My Group Chats</h1>
        <WalletButton />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-4">My Group Chats</h1>

      {isLoading ? (
        <p>Loading...</p>
      ) : chats.length === 0 ? (
        <p>You haven't created any group chats yet.</p>
      ) : (
        <div className="grid gap-4">
          {chats.map((chat) => (
            <Card key={chat.tokenMintAddress}>
              <CardHeader>
                <CardTitle>
                  {chat.tokenName} ({chat.tokenSymbol})
                </CardTitle>
                <CardDescription>Mint: {chat.tokenMintAddress}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-1">
                <p className="text-sm break-all">
                  Telegram Chat ID: {chat.telegramChatId}
                </p>
                <p className="text-sm">
                  Required Holdings: {chat.requiredHoldings}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
