import { SigninMessage } from "@/utils/SigninMessage";
import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { getCsrfToken } from "next-auth/react";
import jsonwebtoken from "jsonwebtoken";

const handler = NextAuth({
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
          console.log("NextAuth authorize called", {
            hasMessage: !!credentials?.message,
            hasSignature: !!credentials?.signature,
            messageType: typeof credentials?.message,
            signatureType: typeof credentials?.signature,
          });

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
            console.log("Message successfully parsed:", {
              parsedKeys: Object.keys(parsedMessage),
            });
          } catch (parseError) {
            console.error("Failed to parse message:", parseError, {
              messageContent: credentials.message,
            });
            return null;
          }

          const signinMessage = new SigninMessage(parsedMessage);

          console.log("SigninMessage parsed", {
            domain: signinMessage.domain,
            publicKey: signinMessage.publicKey?.slice(0, 8) + "...",
            hasAllProps: !!(
              signinMessage.domain &&
              signinMessage.publicKey &&
              signinMessage.nonce &&
              signinMessage.statement
            ),
          });

          const nextAuthUrl = new URL(
            process.env.NEXTAUTH_URL || "http://localhost:3000"
          );
          console.log("Checking domain", {
            messageDomain: signinMessage.domain,
            nextAuthDomain: nextAuthUrl.host,
            matches: signinMessage.domain === nextAuthUrl.host,
          });

          if (signinMessage.domain !== nextAuthUrl.host) {
            console.error("Domain mismatch");
            return null;
          }

          // For Next.js App Router, we need to get the CSRF token differently
          console.log("Getting CSRF token");
          const csrfToken = await getCsrfToken({ req: { ...req, body: null } });
          console.log("CSRF token retrieved:", csrfToken ? "success" : "null", {
            csrfTokenLength: csrfToken?.length,
            messageNonce:
              signinMessage.nonce?.slice(0, 8) + "..." || "undefined",
          });

          if (!csrfToken) {
            console.error("CSRF token is null or undefined");
            return null;
          }

          console.log("Checking nonce", {
            messageNonce: signinMessage.nonce,
            csrfToken,
            matches: signinMessage.nonce === csrfToken,
          });

          if (signinMessage.nonce !== csrfToken) {
            console.error("CSRF token mismatch", {
              nonceLength: signinMessage.nonce?.length,
              csrfTokenLength: csrfToken.length,
              noncePrefix: signinMessage.nonce?.slice(0, 10),
              csrfPrefix: csrfToken.slice(0, 10),
            });
            return null;
          }

          console.log("Validating signature");
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
          console.log("Signature validation result:", validationResult);

          if (!validationResult)
            throw new Error("Could not validate the signed message");

          console.log(
            "Authentication successful for:",
            signinMessage.publicKey
          );
          return {
            id: signinMessage.publicKey,
          };
        } catch (e: any) {
          console.error("Authentication error:", e);
          // Log more details about the error
          console.error("Error details:", {
            name: e.name,
            message: e.message,
            stack: e.stack,
            credentials: credentials
              ? {
                  hasMessage: !!credentials.message,
                  hasSignature: !!credentials.signature,
                  messageLength: credentials.message?.length,
                  signatureLength: credentials.signature?.length,
                }
              : "no credentials",
          });
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async session({ session, token }) {
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
    encode: async ({ secret, token, maxAge }) => {
      const encodedToken = jsonwebtoken.sign(token as object, secret as string);
      return encodedToken;
    },
    decode: async ({ secret, token }) => {
      try {
        // Force correct return type for JWT
        const decodedToken = jsonwebtoken.verify(
          token as string,
          secret as string
        ) as any;
        return decodedToken;
      } catch (error) {
        console.error("JWT decode error:", error);
        return null;
      }
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
});

export { handler as GET, handler as POST };
