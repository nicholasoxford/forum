"use client";

import React, { useEffect, useState } from "react";
import { useSession, getCsrfToken } from "next-auth/react";
import { useWallet } from "@jup-ag/wallet-adapter";

export function AuthDebugClient() {
  const { data: session, status } = useSession();
  const { publicKey, connected, connecting } = useWallet();
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const [csrfError, setCsrfError] = useState<string | null>(null);
  const [nextAuthUrl, setNextAuthUrl] = useState<string | null>(null);
  const [host, setHost] = useState<string | null>(null);

  useEffect(() => {
    // Get the window.location.host
    if (typeof window !== "undefined") {
      setHost(window.location.host);
    }

    // Fetch CSRF token using NextAuth's getCsrfToken
    async function fetchCsrfToken() {
      try {
        const token = await getCsrfToken();
        setCsrfToken(token || null);
        if (!token) {
          setCsrfError("Could not retrieve CSRF token");
        }
      } catch (error) {
        setCsrfError(error instanceof Error ? error.message : String(error));
      }
    }

    // Fetch NEXTAUTH_URL environment variable
    async function fetchNextAuthUrl() {
      try {
        const response = await fetch("/api/debug/env");
        const data = await response.json();
        setNextAuthUrl(data.NEXTAUTH_URL || null);
      } catch (error) {
        console.error("Failed to fetch NEXTAUTH_URL:", error);
      }
    }

    fetchCsrfToken();
    fetchNextAuthUrl();
  }, []);

  return (
    <div className="space-y-6">
      <section>
        <h2 className="text-xl font-semibold mb-3">Session Status</h2>
        <div className="bg-muted p-4 rounded-md">
          <p>
            Status: <span className="font-medium">{status}</span>
          </p>
          {session ? (
            <div className="mt-2">
              <p>
                Authenticated:{" "}
                <span className="text-green-500 font-medium">Yes</span>
              </p>
              <p className="mt-1">
                Public Key:{" "}
                <span className="font-mono">{session.publicKey}</span>
              </p>
              {session.user?.name && (
                <p className="mt-1">
                  User: <span className="font-medium">{session.user.name}</span>
                </p>
              )}
            </div>
          ) : (
            <p className="mt-2">
              Authenticated:{" "}
              <span className="text-red-500 font-medium">No</span>
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Wallet Status</h2>
        <div className="bg-muted p-4 rounded-md">
          <p>
            Connected:{" "}
            <span className="font-medium">{connected ? "Yes" : "No"}</span>
          </p>
          <p className="mt-1">
            Connecting:{" "}
            <span className="font-medium">{connecting ? "Yes" : "No"}</span>
          </p>
          {publicKey && (
            <p className="mt-1">
              Public Key:{" "}
              <span className="font-mono">{publicKey.toBase58()}</span>
            </p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold mb-3">Environment Check</h2>
        <div className="bg-muted p-4 rounded-md">
          <p>
            Window Location Host:{" "}
            <span className="font-mono">{host || "Not available"}</span>
          </p>
          <p className="mt-1">
            NEXTAUTH_URL:{" "}
            <span className="font-mono">{nextAuthUrl || "Not available"}</span>
          </p>
          <p className="mt-3">
            CSRF Token:{" "}
            {csrfToken ? (
              <span className="font-mono">{csrfToken}</span>
            ) : (
              <span className="text-red-500">
                {csrfError || "Not available"}
              </span>
            )}
          </p>

          <div className="mt-4">
            <p className="font-medium">Domain Match Check:</p>
            {host && nextAuthUrl ? (
              <p className="mt-1">
                {new URL(nextAuthUrl).host === host ? (
                  <span className="text-green-500">Domains match ✓</span>
                ) : (
                  <span className="text-red-500">
                    Domains don't match! NEXTAUTH_URL host:{" "}
                    {new URL(nextAuthUrl).host}, Window host: {host}
                  </span>
                )}
              </p>
            ) : (
              <p className="text-yellow-500">
                Cannot check domain match - missing data
              </p>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
