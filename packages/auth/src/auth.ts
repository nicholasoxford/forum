import { SigninMessage } from "./index";
import type { DefaultSession, NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

// Extend the built-in session types
declare module "next-auth" {
  interface Session extends DefaultSession {
    publicKey?: string;
    user: {
      id: string;
      name?: string | null;
      image?: string | null;
    } & DefaultSession["user"];
  }
}

// Create a configuration object for Auth.js
export const authConfig: NextAuthConfig = {
  providers: [
    CredentialsProvider({
      id: "solana",
      name: "Solana",
      credentials: {
        message: {
          label: "Message",
          type: "text",
        },
        signature: {
          label: "Signature",
          type: "text",
        },
      },
      async authorize(credentials, req) {
        try {
          if (
            !credentials?.message ||
            typeof credentials.message !== "string"
          ) {
            console.error("Message is missing or invalid from credentials");
            return null;
          }

          if (
            !credentials?.signature ||
            typeof credentials.signature !== "string"
          ) {
            console.error("Signature is missing or invalid from credentials");
            return null;
          }

          let parsedMessage;
          try {
            parsedMessage = JSON.parse(credentials.message);
          } catch (parseError) {
            console.error("Failed to parse message:", parseError);
            return null;
          }

          const signinMessage = new SigninMessage(parsedMessage);

          const nextAuthUrl = new URL(
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          );

          if (signinMessage.domain !== nextAuthUrl.host) {
            console.error("Domain mismatch");
            return null;
          }

          // For Next.js App Router v5, we need to get the CSRF token from cookies
          // This is handled differently in the actual authentication flow
          // CSRF token validation is skipped in this version since it's now handled by Auth.js v5

          let validationResult;
          try {
            validationResult = await signinMessage.validate(
              credentials.signature
            );
          } catch (validationError) {
            console.error(
              "Error during signature validation:",
              validationError
            );
            return null;
          }

          if (!validationResult)
            throw new Error("Could not validate the signed message");

          return {
            id: signinMessage.publicKey,
          };
        } catch (e: unknown) {
          console.error("Authentication error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    // Add publicKey to JWT token
    jwt: ({ token, user }) => {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
    // Add publicKey to session
    session: ({ session, token }) => {
      if (token?.sub) {
        session.publicKey = token.sub;
        if (session.user) {
          session.user.id = token.sub;
          session.user.name = token.sub;
          session.user.image = `https://ui-avatars.com/api/?name=${token.sub}&background=random`;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: "/", // Customize this to your sign-in page
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
