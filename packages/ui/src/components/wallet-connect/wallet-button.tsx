"use client";

import { useState } from "react";
import { useWallet } from "@jup-ag/wallet-adapter";
import { WalletModal } from "./wallet-modal";

interface WalletButtonProps {
  className?: string;
}

export const WalletButton = ({ className = "" }: WalletButtonProps) => {
  const { connected, connecting, disconnect, publicKey } = useWallet();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleConnect = async () => {
    if (connected) {
      await disconnect();
    } else {
      setIsModalOpen(true);
    }
  };

  // Format the public key for display
  const formatPublicKey = (key: any) => {
    if (!key) return "";
    const keyString = key.toString();
    return `${keyString.slice(0, 4)}...${keyString.slice(-4)}`;
  };

  return (
    <>
      <button
        onClick={handleConnect}
        disabled={connecting}
        className={`px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
      >
        {connecting ? (
          <span className="flex items-center">
            <svg
              className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                className="opacity-25"
                cx="12"
                cy="12"
                r="10"
                stroke="currentColor"
                strokeWidth="4"
              ></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
            Connecting...
          </span>
        ) : connected ? (
          <span className="flex items-center">
            <span className="mr-2">Connected</span>
            <span className="text-xs opacity-70">
              {publicKey ? formatPublicKey(publicKey) : ""}
            </span>
          </span>
        ) : (
          "Connect Wallet"
        )}
      </button>

      <WalletModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
};
