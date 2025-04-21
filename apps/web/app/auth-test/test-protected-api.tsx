"use client";

import React from "react";

export function TestProtectedApi() {
  const [result, setResult] = React.useState<{
    error?: string;
    content?: string;
    publicKey?: string;
  } | null>(null);
  const [loading, setLoading] = React.useState(false);

  const handleTestClick = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/protected");
      const data = await response.json();
      setResult(data);
    } catch (error) {
      console.error("Error testing protected API:", error);
      setResult({ error: "Failed to fetch protected content" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button
        onClick={handleTestClick}
        disabled={loading}
        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md"
      >
        {loading ? "Loading..." : "Test Protected API"}
      </button>

      {result && (
        <div className="mt-4 p-3 rounded-md bg-muted">
          {result.error ? (
            <p className="text-destructive">{result.error}</p>
          ) : (
            <div>
              <p className="text-green-500 mb-2">{result.content}</p>
              {result.publicKey && (
                <p className="text-xs font-mono">
                  Public Key: {result.publicKey.slice(0, 12)}...
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
