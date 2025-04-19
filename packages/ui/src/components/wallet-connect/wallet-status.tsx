"use client";

import { useWallet } from "@jup-ag/wallet-adapter";

export const WalletStatus = () => {
  const {
    connected,
    connecting,
    disconnecting,
    publicKey,
    wallet,
    connect,
    disconnect,
  } = useWallet();

  // Format the public key for display
  const formatPublicKey = (key: any) => {
    if (!key) return "";
    const keyString = key.toString();
    return `${keyString.slice(0, 4)}...${keyString.slice(-4)}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-md w-full mt-4">
      <h2 className="text-xl font-bold mb-4">Wallet Connection Status</h2>

      <div className="space-y-3">
        <div className="flex justify-between">
          <span className="font-medium">Connection Status:</span>
          <span
            className={`font-bold ${connected ? "text-green-500" : "text-red-500"}`}
          >
            {connected ? "Connected" : "Disconnected"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Connecting:</span>
          <span className={connecting ? "text-yellow-500" : "text-gray-500"}>
            {connecting ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Disconnecting:</span>
          <span className={disconnecting ? "text-yellow-500" : "text-gray-500"}>
            {disconnecting ? "Yes" : "No"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Public Key:</span>
          <span className="text-gray-600 dark:text-gray-400 break-all">
            {publicKey ? formatPublicKey(publicKey) : "Not Available"}
          </span>
        </div>

        <div className="flex justify-between">
          <span className="font-medium">Wallet Name:</span>
          <span className="text-gray-600 dark:text-gray-400">
            {wallet?.adapter.name || "Not Selected"}
          </span>
        </div>

        <div className="mt-4 flex space-x-2">
          <button
            onClick={() => connect()}
            disabled={connected || connecting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Connect
          </button>

          <button
            onClick={() => disconnect()}
            disabled={!connected || disconnecting}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Disconnect
          </button>
        </div>
      </div>
    </div>
  );
};
