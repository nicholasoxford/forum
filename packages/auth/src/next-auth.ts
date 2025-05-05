import NextAuth from "next-auth";
import { authConfig } from "./auth";
import jsonwebtoken from "jsonwebtoken";
import type { Session } from "next-auth";
import type {
  GetServerSidePropsContext,
  NextApiRequest,
  NextApiResponse,
} from "next";

// Define auth function type
type AuthFunction = (
  ...args: [GetServerSidePropsContext] | [NextApiRequest, NextApiResponse] | []
) => Promise<Session | null>;

// Configure NextAuth with our custom config
export const nextAuthConfig = NextAuth({
  ...authConfig,
  jwt: {
    // Use proper JWT encoding and decoding
    encode: async ({ token, secret }) => {
      if (!token) return "";
      return jsonwebtoken.sign(token, secret as string);
    },
    decode: async ({ token, secret }) => {
      if (!token) return null;
      try {
        return jsonwebtoken.verify(token, secret as string) as any;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
});

// Export the handlers and sign-in/out functions
export const { handlers, signIn, signOut } = nextAuthConfig;

// Export auth with explicit type annotation
export const auth: AuthFunction = nextAuthConfig.auth;

// Re-export components that might be needed by the client
export { useSession, SessionProvider, getCsrfToken } from "next-auth/react";
