import { server } from "./elysia";
import { SigninMessage } from "@workspace/auth";

// Helper to detect environment and get cookie domain configuration
function getCookieDomainConfig() {
  const isProd =
    typeof window !== "undefined" &&
    (window.location.hostname === "groupy.fun" ||
      window.location.hostname === "www.groupy.fun" ||
      window.location.hostname.endsWith(".groupy.fun"));

  return {
    isProd,
    domain: isProd ? "; domain=.groupy.fun" : "",
    sameSite: isProd ? "; sameSite=strict" : "; sameSite=lax",
    secure: isProd ? "; secure" : "",
  };
}

// Get a message to sign from the server
export async function getMessageForSigning(
  publicKey: string
): Promise<SigninMessage | null> {
  try {
    // Set auth_nonce cookie with appropriate domain settings
    const config = getCookieDomainConfig();

    // Send the public key as a header to the auth message endpoint
    const { data, error } = await server.auth.message.get({
      headers: {
        "x-public-key": publicKey,
      },
      fetch: {
        credentials: "include",
      },
    });

    console.dir({ data, error }, { depth: null });

    if (error) {
      console.error("Error getting signing message:", error.value);
      return null;
    }

    if (!data?.message) {
      console.error("No message received from server");
      return null;
    }

    return data.message;
  } catch (error) {
    console.error("Failed to get message for signing:", error);
    return null;
  }
}

// Authenticate with the server using a signed message
export async function authenticateWithServer(
  message: SigninMessage,
  signature: string
): Promise<{ user: any; ok: boolean; publicKey: string } | null> {
  try {
    const publicKey = message.publicKey;

    if (!publicKey) {
      console.error("No publicKey found in message");
      return null;
    }

    // Include credentials to ensure cookies are sent and received
    const { data, error } = await server.api.auth.solana.post(
      {
        message,
        signature,
      },
      {
        fetch: {
          credentials: "include",
        },
      }
    );

    if (error) {
      console.error("Authentication error:", error.value);
      return null;
    }

    if (!data?.ok) {
      console.error("Authentication failed");
      return null;
    }

    // The JWT is automatically stored in the cookie by the browser
    console.log("Authentication successful:", data);
    return data;
  } catch (error) {
    console.error("Failed to authenticate with server:", error);
    return null;
  }
}

// Log out - clear the auth cookie and call the logout endpoint
export async function logoutFromServer(): Promise<boolean> {
  try {
    const config = getCookieDomainConfig();

    // First, clear the cookie client-side with appropriate settings
    document.cookie = `auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/${config.domain}${config.sameSite}${config.secure}`;

    // Call the server logout endpoint to clear the cookie server-side as well
    const { data, error } = await server.auth.logout.get({
      fetch: {
        credentials: "include",
      },
    });

    if (error) {
      console.error("Error during server logout:", error.value);
      return false;
    }

    console.log("Logged out successfully:", data);
    return true;
  } catch (error) {
    console.error("Failed to log out:", error);
    return false;
  }
}

// Get the current user session from cookies
export async function getCurrentSession(): Promise<any> {
  try {
    console.log("Fetching current session...");

    // Include credentials to ensure cookies are sent
    const { data, error } = await server.protected.test.get({
      fetch: {
        credentials: "include",
      },
    });

    console.log("Session response:", { data, error });

    if (error) {
      console.error("Session error:", error.value);
      return null;
    }

    if (!data?.user) {
      console.error("No user data in session response");
      return null;
    }

    return {
      user: {
        name: data.user.publicKey,
        id: data.user.publicKey,
        image: `https://ui-avatars.com/api/?name=${data.user.publicKey}&background=random`,
      },
      publicKey: data.user.publicKey,
    };
  } catch (error) {
    console.error("Failed to get current session:", error);
    return null;
  }
}
