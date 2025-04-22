import React from "react";
import { AuthDebugClient } from "./AuthDebugClient";

export default function AuthDebugPage() {
  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6 text-center">
        Authentication Debug
      </h1>
      <div className="max-w-3xl mx-auto bg-card p-6 rounded-lg shadow-md">
        <AuthDebugClient />
      </div>
    </div>
  );
}
