import { SigninMessage } from "@/utils/SigninMessage";
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import jsonwebtoken from "jsonwebtoken";

export const authOptions: NextAuthOptions = {
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
          if (!credentials?.message) {
            console.error("Message is missing from credentials");
            return null;
          }

          if (!credentials?.signature) {
            console.error("Signature is missing from credentials");
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

          // For Next.js App Router, we need to get the CSRF token differently
          const csrfToken = await getCsrfToken({ req: { ...req, body: null } });

          if (!csrfToken) {
            console.error("CSRF token is null or undefined");
            return null;
          }

          if (signinMessage.nonce !== csrfToken) {
            console.error("CSRF token mismatch");
            return null;
          }

          let validationResult;
          try {
            validationResult = await signinMessage.validate(
              credentials?.signature || ""
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
        } catch (e: any) {
          console.error("Authentication error:", e);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
      // Add publicKey to session
      session.publicKey = token.sub;
      if (session.user) {
        session.user.name = token.sub;
        session.user.image = `https://ui-avatars.com/api/?name=${token.sub}&background=random`;
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
  jwt: {
    // Use proper JWT encoding and decoding
    encode: async ({ secret, token }) => {
      return jsonwebtoken.sign(token as object, secret as string);
    },
    decode: async ({ secret, token }) => {
      try {
        return jsonwebtoken.verify(token as string, secret as string) as any;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
};
