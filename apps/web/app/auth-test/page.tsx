import React from "react";
import { AuthButton } from "@/components/wallet-connect/auth-button";
import { TestProtectedApi } from "./test-protected-api";

export default function AuthTestPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Wallet Authentication Test
      </h1>

      <div className="max-w-md mx-auto bg-card p-6 rounded-lg shadow-md">
        <div className="mb-4 text-center">
          <p className="text-muted-foreground">
            Connect your wallet and sign a message to authenticate.
          </p>
        </div>

        <div className="flex justify-center">
          <AuthButton />
        </div>
      </div>

      <div className="max-w-md mx-auto mt-8 bg-card p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-3">Protected Content Test</h2>
        <div className="mb-4">
          <p className="text-muted-foreground">
            Once authenticated, you can test the protected API endpoint below.
          </p>
        </div>

        <TestProtectedApi />
      </div>
    </div>
  );
}
