"use client";

import Link from "next/link";

export function AuthDebugLink() {
  return (
    <Link
      href="/auth-debug"
      className="flex items-center px-3 py-1 text-sm bg-yellow-400/10 text-yellow-500 rounded-md hover:bg-yellow-400/20 transition-colors"
    >
      Auth Debug
    </Link>
  );
}
