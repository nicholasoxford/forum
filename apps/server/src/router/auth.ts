import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { SigninMessage, verifyToken } from "@workspace/auth";

// Helper to determine cookie settings based on environment and request host
const getCookieConfig = (requestHostHeader?: string | null) => {
  // Define the production host (can be overridden by env var if needed)
  const productionHost = process.env.PRODUCTION_HOST || "groupy.fun";
  // Check if NODE_ENV is explicitly set to production
  const isProdEnv = process.env.NODE_ENV === "production";

  // Determine if the request originated from the expected production frontend host
  const requestHost = requestHostHeader?.split(":")[0]; // Remove port if present
  const isProdHostRequest = requestHost
    ? requestHost === productionHost ||
      requestHost.endsWith("." + productionHost)
    : false;

  // Use production cookie settings only if NODE_ENV is production
  // AND the request originates from the production host.
  const useProdSettings = isProdEnv && isProdHostRequest;

  return {
    // Use 'strict' for production host requests, 'lax' otherwise
    sameSite: useProdSettings ? ("strict" as const) : ("lax" as const),
    // Secure flag should be true only for production settings (HTTPS)
    secure: useProdSettings,
    // Set the Domain attribute ONLY for production host requests.
    // Let the browser default the domain for other origins (localhost, direct IP/fly.dev access).
    domain: useProdSettings ? `.${productionHost}` : undefined,
    // Standardize path to '/' for session cookies for broader applicability
    path: "/",
  };
};

export const authRouter = new Elysia()
  .use(
    jwt({
      name: "jwt", // Decorator name: ctx.jwt
      secret: process.env.NEXTAUTH_SECRET!, // Use same secret as NextAuth
      schema: t.Object({ sub: t.String() }), // Enforce a "sub" string in the payload
      exp: "7d", // Tokens expire in 7 days
    })
  )

  .get("/auth/message", ({ headers, cookie, set, request }) => {
    try {
      // Get host from request headers
      const requestHost = request.headers.get("host");
      // Determine cookie configuration based on the request host
      const cookieConfig = getCookieConfig(requestHost);
      // Determine the domain to use in the SigninMessage
      // Use the specific domain from config if set, otherwise fallback to request host or NEXTAUTH_URL host
      const messageDomain = cookieConfig.domain
        ? cookieConfig.domain.substring(1) // Remove leading dot for message
        : requestHost?.split(":")[0] || new URL(process.env.NEXTAUTH_URL!).host;

      const nonce = crypto.randomUUID();

      // Store nonce in an HttpOnly cookie
      cookie["auth_nonce"]?.set({
        value: nonce,
        httpOnly: true,
        maxAge: 5 * 60, // 5 minutes
        // Use the base config, but override path specifically for nonce cookie if needed
        ...cookieConfig,
        path: "/api/auth", // Keep nonce path specific for its purpose
      });

      // Client must supply their publicKey
      const publicKey = headers["x-public-key"];
      if (!publicKey) {
        set.status = 400;
        return { error: "Missing x-public-key header" };
      }
      const message = new SigninMessage({
        domain: messageDomain, // Use the determined domain
        nonce,
        publicKey,
        statement: "Sign in to Forum App",
      });

      return { message };
    } catch (error) {
      console.error("Error generating auth message:", error);
      set.status = 500;
      return { error: "Failed to generate authentication message" };
    }
  })
  .get(
    "/protected/test",
    async ({ cookie, set }) => {
      const token = cookie["auth"]?.value;

      if (!token) {
        set.status = 401;
        return { error: "Authentication required" };
      }

      const user = await verifyToken(token);

      if (!user) {
        set.status = 401;
        return { error: "Invalid or expired token" };
      }

      return {
        message: "This is a protected route",
        user: {
          publicKey: user.publicKey,
          verifiedAt: new Date().toISOString(),
        },
      };
    },
    {
      cookie: t.Cookie({
        auth: t.String(),
      }),
    }
  )
  .get("/auth/logout", ({ cookie, request }) => {
    // Get host from request headers
    const requestHost = request.headers.get("host");
    // Determine cookie configuration based on the request host
    const cookieConfig = getCookieConfig(requestHost);

    // Clear auth cookie using the determined configuration
    cookie["auth"]?.set({
      value: "",
      maxAge: 0, // Expire immediately
      ...cookieConfig, // Apply calculated domain, path, secure, sameSite
    });

    // Optionally clear the nonce cookie as well, using its specific path
    cookie["auth_nonce"]?.set({
      value: "",
      maxAge: 0,
      ...cookieConfig, // Base config
      path: "/api/auth", // Specific path for nonce
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  })
  .post(
    "/api/auth/solana",
    async ({ body, cookie, jwt, set, request }) => {
      try {
        // Get host from request headers
        const requestHost = request.headers.get("host");
        // Determine cookie configuration based on the request host
        const cookieConfig = getCookieConfig(requestHost);

        console.log("Request Host:", requestHost);
        console.log("Calculated Cookie Config:", cookieConfig);

        const { message, signature } = body;
        const signinMessage = new SigninMessage(message);

        // Validate the domain in the signed message against the request origin or configured URL
        const expectedDomain = cookieConfig.domain
          ? cookieConfig.domain.substring(1) // Remove leading dot
          : requestHost?.split(":")[0] ||
            new URL(process.env.NEXTAUTH_URL!).host;

        console.log("SigninMessage Domain:", signinMessage.domain);
        console.log("Expected Domain:", expectedDomain);

        if (signinMessage.domain !== expectedDomain) {
          console.error(
            `Domain mismatch: Expected ${expectedDomain}, got ${signinMessage.domain}`
          );
          set.status = 401;
          return { error: "Domain mismatch" };
        }

        // Verify nonce (Check if nonce exists and matches the one in the cookie)
        const receivedNonce = signinMessage.nonce;
        const storedNonce = cookie["auth_nonce"]?.value;

        console.log("Received Nonce:", receivedNonce);
        console.log("Stored Nonce:", storedNonce);

        if (!receivedNonce || !storedNonce || receivedNonce !== storedNonce) {
          console.error("Nonce mismatch or missing");
          set.status = 401;
          // Clear the potentially invalid nonce cookie
          cookie["auth_nonce"]?.set({
            value: "",
            maxAge: 0,
            ...cookieConfig,
            path: "/api/auth",
          });
          return { error: "Invalid or missing nonce" };
        }

        console.log("Validating signature");
        const valid = await signinMessage.validate(signature);
        if (!valid) {
          console.error("Invalid signature");
          set.status = 401;
          return { error: "Invalid signature" };
        }

        // Issue JWT (payload: { sub: publicKey })
        const token = await jwt.sign({
          sub: signinMessage.publicKey,
        });

        // Clear nonce cookie using the correct path and determined config
        cookie["auth_nonce"]?.set({
          value: "",
          maxAge: 0, // Expire immediately
          ...cookieConfig, // Apply calculated domain, secure, sameSite
          path: "/api/auth", // Use the specific path where nonce was set
        });

        // Set session cookie using the determined configuration
        cookie["auth"]?.set({
          value: token,
          httpOnly: true,
          maxAge: 7 * 24 * 3600, // 7 days
          ...cookieConfig, // Apply calculated domain, path='/', secure, sameSite
        });

        console.log("Successfully set auth cookie with config:", cookieConfig);

        // Return user information similar to NextAuth
        return {
          ok: true,
          user: {
            id: signinMessage.publicKey,
            name: signinMessage.publicKey,
            image: `https://ui-avatars.com/api/?name=${signinMessage.publicKey}&background=random`,
          },
          publicKey: signinMessage.publicKey,
        };
      } catch (error) {
        console.error("Authentication error:", error);
        set.status = 500;
        return { error: "Failed to authenticate" };
      }
    },
    {
      body: t.Object({
        message: t.Object({
          domain: t.String(),
          nonce: t.String(),
          publicKey: t.String(),
          statement: t.String(),
        }),
        signature: t.String(),
      }),
    }
  );
