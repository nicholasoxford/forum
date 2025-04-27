"use client";

import { ClaimRoyaltiesForm } from "@/components/claim-royalties-form";
import { WalletButton } from "@workspace/ui/components/wallet-connect/wallet-button";
import { useWallet } from "@solana/wallet-adapter-react";

export default function ClaimRoyaltiesPage() {
  const { connected } = useWallet();

  return (
    <div className="container mx-auto py-12 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8 text-center">Claim Royalties</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 mb-8">
            {!connected ? (
              <div className="text-center py-8">
                <h2 className="text-xl font-semibold mb-4">
                  Connect Your Wallet
                </h2>
                <p className="text-gray-600 dark:text-gray-300 mb-6">
                  You need to connect your wallet to claim royalties.
                </p>
                <div className="flex justify-center">
                  <WalletButton />
                </div>
              </div>
            ) : (
              <ClaimRoyaltiesForm />
            )}
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6 sticky top-20">
            <h2 className="text-xl font-bold mb-4">How it works</h2>
            <ol className="list-decimal pl-5 space-y-3 text-gray-600 dark:text-gray-300 mb-6">
              <li>Connect your wallet</li>
              <li>Select from your available pools or enter a pool address</li>
              <li>
                Confirm the token account address where you want to receive the
                royalties
              </li>
              <li>Click "Claim Royalties" to submit the transaction</li>
            </ol>

            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg mb-4">
              <h3 className="text-lg font-semibold mb-2">About Royalties</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Royalties are fees collected when tokens are traded in your
                pool. They are automatically accrued and can be claimed by the
                pool owner.
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                The royalty percentage is set when the pool is created and is
                displayed in the pool information.
              </p>
            </div>

            <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Note</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                You can only claim royalties if you are the owner of the pool.
                The royalties will be sent as SOL to your specified wallet
                address.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
