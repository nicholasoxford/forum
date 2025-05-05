import { Elysia, t } from "elysia";
import { jwt } from "@elysiajs/jwt";
import { SigninMessage, verifyToken } from "@workspace/auth";

// Helper to determine cookie settings based on environment
const getCookieConfig = () => {
  const isProd = process.env.NODE_ENV === "production";
  // Use .groupy.fun to work with both groupy.fun and www.groupy.fun
  const domain = isProd ? ".groupy.fun" : undefined;
  return {
    sameSite: isProd ? ("strict" as const) : ("lax" as const),
    secure: isProd,
    domain,
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

  .get("/auth/message", ({ headers, cookie, set }) => {
    try {
      const domain = new URL(process.env.NEXTAUTH_URL!).host;
      const nonce = crypto.randomUUID();
      const cookieConfig = getCookieConfig();

      // Store nonce in an HttpOnly cookie for 5 minutes
      cookie["auth_nonce"]?.set({
        value: nonce,
        httpOnly: true,
        maxAge: 5 * 60,
        path: "/api/auth",
        ...cookieConfig,
      });

      // Client must supply their publicKey (e.g. via a header or query param)
      const publicKey = headers["x-public-key"];
      if (!publicKey) {
        set.status = 400;
        return { error: "Missing x-public-key header" };
      }
      const message = new SigninMessage({
        domain,
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
  .get("/auth/logout", ({ cookie }) => {
    const cookieConfig = getCookieConfig();

    // Clear auth cookie
    cookie["auth"]?.set({
      value: "",
      maxAge: 0,
      path: "/",
      ...cookieConfig,
    });

    return {
      success: true,
      message: "Logged out successfully",
    };
  })
  .post(
    "/api/auth/solana",
    async ({ body, cookie, jwt, set }) => {
      try {
        console.log("body: ", body);
        const { message, signature } = body;
        let parsed;
        const cookieConfig = getCookieConfig();

        const signinMessage = new SigninMessage(message);
        const currentDomain = new URL(process.env.NEXTAUTH_URL!).host;
        console.log("cookie: ", cookie);

        console.log("signinMessage.nonce: ", signinMessage.nonce);

        console.log("signinMessage.domain: ", signinMessage.domain);
        console.log("currentDomain: ", currentDomain);
        if (signinMessage.domain !== currentDomain) {
          set.status = 401;
          return { error: "Domain mismatch" };
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

        // Clear nonce cookie
        cookie["auth_nonce"]?.set({
          value: "",
          maxAge: 0,
          path: "/api/auth",
          ...cookieConfig,
        });

        // Set session cookie
        cookie["auth"]?.set({
          value: token,
          httpOnly: true,
          maxAge: 7 * 24 * 3600,
          path: "/",
          ...cookieConfig,
        });

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
