"use client";

import { useState, useEffect } from "react";
import { useWallet, WalletName } from "@jup-ag/wallet-adapter";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WalletModal = ({ isOpen, onClose }: WalletModalProps) => {
  const { wallets, select, connect } = useWallet();
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);

  // Close modal when Escape key is pressed
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, onClose]);

  // Close modal when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (isOpen && target.closest(".wallet-modal-content") === null) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const handleWalletSelect = (walletName: string) => {
    setSelectedWallet(walletName);
    select(walletName as WalletName);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="wallet-modal-content bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select a Wallet</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <div className="space-y-2">
          {wallets && wallets.length > 0 ? (
            wallets.map((wallet, index) => (
              <button
                key={index}
                onClick={() =>
                  handleWalletSelect(wallet.adapter.name || `wallet-${index}`)
                }
                className="w-full flex items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                {wallet.adapter.icon && (
                  <img
                    src={
                      typeof wallet.adapter.icon === "string"
                        ? wallet.adapter.icon
                        : ""
                    }
                    alt={`${wallet.adapter.name} icon`}
                    className="w-8 h-8 mr-3"
                  />
                )}
                <span className="font-medium">{wallet.adapter.name}</span>
              </button>
            ))
          ) : (
            <p className="text-center text-gray-500">No wallets available</p>
          )}
        </div>
      </div>
    </div>
  );
};
