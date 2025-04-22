#!/usr/bin/env bun

import * as fs from "fs";
import * as path from "path";
import { URL } from "url";

// Function to check if .env.local has the required variables
function checkEnvFile() {
  try {
    const envPath = path.resolve(process.cwd(), ".env.local");

    if (!fs.existsSync(envPath)) {
      console.error("\x1b[31m%s\x1b[0m", "❌ .env.local file does not exist");
      console.log("Create it with the following variables:");
      console.log("\x1b[36m%s\x1b[0m", "NEXTAUTH_URL=http://localhost:3000");
      console.log("\x1b[36m%s\x1b[0m", "NEXTAUTH_SECRET=your_secret_key_here");
      return;
    }

    const envContent = fs.readFileSync(envPath, "utf8");
    const envLines = envContent.split("\n");

    // Check for NEXTAUTH_URL
    const nextAuthUrlLine = envLines.find((line) =>
      line.startsWith("NEXTAUTH_URL=")
    );
    if (!nextAuthUrlLine) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "❌ NEXTAUTH_URL is missing from .env.local"
      );
      console.log(
        "Add: \x1b[36m%s\x1b[0m",
        "NEXTAUTH_URL=http://localhost:3000"
      );
    } else {
      const urlParts = nextAuthUrlLine.split("=");
      if (urlParts.length > 1) {
        const url = urlParts[1];
        if (url) {
          try {
            new URL(url);
            console.log("\x1b[32m%s\x1b[0m", "✅ NEXTAUTH_URL found:", url);
          } catch (e) {
            console.error(
              "\x1b[31m%s\x1b[0m",
              "❌ NEXTAUTH_URL is not a valid URL:",
              url
            );
          }
        } else {
          console.error("\x1b[31m%s\x1b[0m", "❌ NEXTAUTH_URL is empty");
        }
      } else {
        console.error("\x1b[31m%s\x1b[0m", "❌ NEXTAUTH_URL has no value");
      }
    }

    // Check for NEXTAUTH_SECRET
    const nextAuthSecretLine = envLines.find((line) =>
      line.startsWith("NEXTAUTH_SECRET=")
    );
    if (!nextAuthSecretLine) {
      console.error(
        "\x1b[31m%s\x1b[0m",
        "❌ NEXTAUTH_SECRET is missing from .env.local"
      );
      console.log(
        "Add: \x1b[36m%s\x1b[0m",
        "NEXTAUTH_SECRET=your_secret_key_here"
      );
      console.log("Generate a secure key with: openssl rand -hex 32");
    } else {
      const secretParts = nextAuthSecretLine.split("=");
      if (secretParts.length > 1) {
        const secret = secretParts[1];
        if (secret && secret.length < 10) {
          console.warn(
            "\x1b[33m%s\x1b[0m",
            "⚠️ NEXTAUTH_SECRET seems too short. Use a secure key."
          );
          console.log("Generate a secure key with: openssl rand -hex 32");
        } else if (secret) {
          console.log(
            "\x1b[32m%s\x1b[0m",
            "✅ NEXTAUTH_SECRET found and looks good"
          );
        } else {
          console.error("\x1b[31m%s\x1b[0m", "❌ NEXTAUTH_SECRET is empty");
        }
      } else {
        console.error("\x1b[31m%s\x1b[0m", "❌ NEXTAUTH_SECRET has no value");
      }
    }
  } catch (error) {
    console.error(
      "\x1b[31m%s\x1b[0m",
      "❌ Error reading .env.local file:",
      error
    );
  }
}

// Run the check
console.log("🔍 Checking authentication environment variables...");
checkEnvFile();
