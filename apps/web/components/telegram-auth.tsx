"use client";
import React, { useState } from "react";

// We'll need to install these dependencies:
// npm install telegram/sessions telegram

interface TelegramAuthProps {
  onAuthSuccess: () => void;
}

const TelegramAuth: React.FC<TelegramAuthProps> = ({ onAuthSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<"initial" | "code" | "password">("initial");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneCode, setPhoneCode] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // We'll use dynamic imports for Telegram modules to avoid SSR issues
  const handleSendCode = async () => {
    setIsLoading(true);
    setError("");

    try {
      const telegram = await import("telegram");
      const TelegramClient = telegram.TelegramClient;
      const StringSession = telegram.sessions.StringSession;

      // Replace with your Telegram API credentials
      const API_ID = process.env.NEXT_PUBLIC_TELEGRAM_API_ID || "12345";
      const API_HASH =
        process.env.NEXT_PUBLIC_TELEGRAM_API_HASH || "your-api-hash";

      // Create a global client instance
      if (!(window as any).telegramClient) {
        const session = new StringSession("");
        (window as any).telegramClient = new TelegramClient(
          session,
          parseInt(API_ID),
          API_HASH,
          { connectionRetries: 5 }
        );
      }

      const client = (window as any).telegramClient;

      // Connect to server
      await client.connect();

      // Send the code
      await client.sendCode(
        {
          apiId: parseInt(API_ID),
          apiHash: API_HASH,
        },
        phoneNumber
      );

      setStep("code");
    } catch (err) {
      console.error("Error sending code:", err);
      setError(
        "Failed to send verification code. Please check your phone number."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignIn = async () => {
    setIsLoading(true);
    setError("");

    try {
      const client = (window as any).telegramClient;

      // Helper function to return password or code as needed
      const userAuthParamCallback = (param: string) => {
        return async function () {
          return await new Promise((resolve) => {
            resolve(param);
          });
        };
      };

      try {
        // First try to sign in with just the code
        await client.start({
          phoneNumber: async () => phoneNumber,
          phoneCode: userAuthParamCallback(phoneCode),
          // If password is already provided in the code step, use it
          password: password
            ? userAuthParamCallback(password)
            : async () => {
                // If we get here, it means 2FA is required but no password was provided
                console.log("2FA password required");
                setStep("password");
                setError("Please enter your 2FA password");
                setIsLoading(false);
                // Return an empty string to fail this attempt
                // We'll retry with the actual password in the next step
                throw new Error("PASSWORD_REQUIRED");
              },
          onError: (err: Error) => {
            console.error("Login error in onError:", err);
            throw err; // Propagate to outer catch
          },
        });

        // If we get here, we succeeded without 2FA
        const sessionString = client.session.save();
        localStorage.setItem("telegram-session", sessionString);
        onAuthSuccess();
      } catch (innerErr) {
        // Handle PASSWORD_REQUIRED error differently than other errors
        if (innerErr instanceof Error) {
          const errorMessage = innerErr.message || "Unknown error";

          if (errorMessage.includes("PASSWORD_REQUIRED")) {
            // If we're already on the password step and have a password, retry with it
            if (step === "password" && password) {
              await client.start({
                phoneNumber: async () => phoneNumber,
                phoneCode: userAuthParamCallback(phoneCode),
                password: userAuthParamCallback(password),
                onError: (err: Error) => {
                  console.error("Password login error:", err);
                  throw err;
                },
              });

              // If we get here, the password succeeded
              const sessionString = client.session.save();
              localStorage.setItem("telegram-session", sessionString);
              onAuthSuccess();
            } else {
              // Just show password field and wait for user to enter it
              throw innerErr; // Propagate to outer catch to handle UI update
            }
          } else {
            // Other errors, propagate
            throw innerErr;
          }
        } else {
          throw innerErr;
        }
      }
    } catch (err) {
      console.error("Error signing in:", err);
      if (err instanceof Error) {
        const errorMessage = err.message || "Unknown error";

        if (errorMessage.includes("PASSWORD_REQUIRED")) {
          console.log("2FA required, switching to password step");
          setStep("password");
          setError("Please enter your 2FA password");
        } else if (errorMessage.includes("PHONE_CODE_INVALID")) {
          setError("Invalid verification code. Please try again.");
        } else if (errorMessage.includes("A wait of")) {
          // Rate limiting error
          const waitTimeMatch = errorMessage.match(
            /A wait of (\d+) seconds is required/
          );
          const waitTime =
            waitTimeMatch && waitTimeMatch[1]
              ? parseInt(waitTimeMatch[1])
              : null;
          const minutes = waitTime ? Math.floor(waitTime / 60) : null;
          const seconds = waitTime ? waitTime % 60 : null;
          const timeMessage =
            minutes !== null && seconds !== null
              ? `${minutes} minutes and ${seconds} seconds`
              : `some time`;

          setError(
            `Rate limit exceeded. Please wait ${timeMessage} before trying again.`
          );
        } else {
          setError(errorMessage || "Failed to sign in. Please try again.");
        }
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="bg-red-50 p-3 rounded-md border border-red-200 text-red-700">
          {error}
        </div>
      )}

      {step === "initial" && (
        <>
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="block text-sm font-medium text-gray-700"
            >
              Phone Number (with country code)
            </label>
            <input
              id="phone"
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="+12345678900"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendCode}
            disabled={isLoading || !phoneNumber.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? "Sending Code..." : "Send Verification Code"}
          </button>
        </>
      )}

      {step === "code" && (
        <>
          <div className="space-y-2">
            <label
              htmlFor="code"
              className="block text-sm font-medium text-gray-700"
            >
              Verification Code
            </label>
            <input
              id="code"
              type="text"
              value={phoneCode}
              onChange={(e) => setPhoneCode(e.target.value)}
              placeholder="12345"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>

          {/* Optional 2FA password field - will be shown immediately if we know the account requires 2FA */}
          <div className="space-y-2 mt-4">
            <label
              htmlFor="twoFactorPassword"
              className="block text-sm font-medium text-gray-700"
            >
              Two-Factor Authentication Password (if required)
            </label>
            <input
              id="twoFactorPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter 2FA password if your account uses it"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
            <p className="text-xs text-gray-500">
              If your account has 2FA enabled, enter your password here
            </p>
          </div>

          <button
            onClick={handleSignIn}
            disabled={isLoading || !phoneCode.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50 mt-4"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
          <button
            onClick={() => setStep("initial")}
            className="w-full text-blue-500 hover:text-blue-600 py-2"
            disabled={isLoading}
          >
            Back
          </button>
        </>
      )}

      {step === "password" && (
        <>
          <div className="space-y-2">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700"
            >
              Two-Factor Authentication Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-white text-gray-900 placeholder-gray-500"
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSignIn}
            disabled={isLoading || !password.trim()}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded disabled:opacity-50"
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
          <button
            onClick={() => setStep("code")}
            className="w-full text-blue-500 hover:text-blue-600 py-2"
            disabled={isLoading}
          >
            Back
          </button>
        </>
      )}

      <p className="text-xs text-gray-500 mt-4">
        We'll send a verification code to your Telegram account. Your account
        credentials are only used for authentication and aren't stored on our
        servers.
      </p>
    </div>
  );
};

export default TelegramAuth;
