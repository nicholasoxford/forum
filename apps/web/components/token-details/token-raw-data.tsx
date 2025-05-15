"use client";
import React, { useState } from "react";

interface TokenRawDataProps {
  tokenData: any;
}

export function TokenRawData({ tokenData }: TokenRawDataProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="bg-black/60 border border-zinc-800 rounded-xl p-6 shadow-lg mb-2">
      <div
        className="flex items-center justify-between cursor-pointer"
        onClick={() => setOpen((v) => !v)}
      >
        <h2 className="text-lg font-semibold text-white flex items-center">
          Raw Token Data
          <span className="ml-2 px-2 py-0.5 bg-violet-500/20 rounded text-violet-400 text-xs font-normal">
            JSON
          </span>
        </h2>
        <span className="text-xs text-violet-400">
          {open ? "Hide" : "Show"}
        </span>
      </div>
      {open && (
        <div className="overflow-auto max-h-96 bg-black/50 rounded-lg border border-zinc-800/60 mt-4">
          <pre className="text-xs whitespace-pre-wrap break-words p-4 text-zinc-300">
            {JSON.stringify(tokenData, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
