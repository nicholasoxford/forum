"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { server } from "@/utils/elysia";

// Import Telegram client components with dynamic import to avoid SSR issues
const TelegramAuth = dynamic(() => import("../../components/telegram-auth"), {
  ssr: false,
});

export default function TestPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    const fetchData = async () => {
      const data = await server.db.get();
      setData(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    // Check if there's a session in localStorage
    try {
      const savedSession = localStorage.getItem("telegram-session");
      if (savedSession) {
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Error accessing localStorage:", error);
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  return (
    <div className="p-6 max-w-md mx-auto">
      <h1 className="text-2xl font-bold mb-6">Test Database</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
      <br />
      <h1 className="text-2xl font-bold mb-6">Telegram Integration Test</h1>

      {!isAuthenticated ? (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-lg font-semibold mb-4">
            Telegram Authentication
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            You'll need to get your API ID and API Hash from{" "}
            <a
              href="https://my.telegram.org/apps"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
            >
              https://my.telegram.org/apps
            </a>{" "}
            and add them to your environment variables.
          </p>
          <TelegramAuth onAuthSuccess={handleAuthSuccess} />
        </div>
      ) : (
        <div className="bg-green-50 p-6 rounded-lg shadow border border-green-200">
          <h2 className="text-lg font-semibold mb-4 text-green-700">
            Successfully Authenticated!
          </h2>
          <p className="text-gray-700 mb-4">
            You are now connected to Telegram.
          </p>
          <button
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded"
            onClick={() => {
              try {
                localStorage.removeItem("telegram-session");
              } catch (error) {
                console.error("Error removing from localStorage:", error);
              }
              setIsAuthenticated(false);
            }}
          >
            Log Out
          </button>
        </div>
      )}
    </div>
  );
}
