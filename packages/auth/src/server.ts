import { SigninMessage } from "./index";
import jsonwebtoken from "jsonwebtoken";

// Verify a JWT token issued by our auth system
export async function verifyToken(
  token: string
): Promise<{ publicKey: string } | null> {
  if (!token) return null;

  try {
    const secret = process.env.NEXTAUTH_SECRET;
    if (!secret) {
      console.error("NEXTAUTH_SECRET not defined in environment");
      return null;
    }

    const decoded = jsonwebtoken.verify(token, secret) as { sub?: string };

    if (!decoded || !decoded.sub) {
      return null;
    }

    return {
      publicKey: decoded.sub,
    };
  } catch (error) {
    console.error("Token verification error:", error);
    return null;
  }
}

// Generate a signing message for Solana wallet authentication
export function generateSigningMessage(
  publicKey: string,
  domain: string
): SigninMessage {
  const nonce = crypto.randomUUID();

  return new SigninMessage({
    domain,
    publicKey,
    nonce,
    statement: "Sign in to Forum App",
  });
}

// Verify a Solana message signature
export async function verifySignature(
  message: string,
  signature: string,
  expectedDomain: string
): Promise<{ publicKey: string } | null> {
  try {
    const parsedMessage = JSON.parse(message);
    const signinMessage = new SigninMessage(parsedMessage);

    // Verify domain matches
    if (signinMessage.domain !== expectedDomain) {
      console.error("Domain mismatch");
      return null;
    }

    // Validate the signature
    const isValid = await signinMessage.validate(signature);

    if (!isValid) {
      console.error("Invalid signature");
      return null;
    }

    return {
      publicKey: signinMessage.publicKey,
    };
  } catch (error) {
    console.error("Error verifying signature:", error);
    return null;
  }
}
