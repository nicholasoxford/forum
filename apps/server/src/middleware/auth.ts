import { Elysia } from "elysia";
import { verifyToken } from "@workspace/auth";

// Create an authentication middleware for Elysia
export const authMiddleware = new Elysia().derive(async ({ cookie, set }) => {
  // Get the auth token from cookies
  const token = cookie["auth"]?.value;

  if (!token) {
    set.status = 401;
    return {
      authenticated: false,
      error: "Authentication required",
    };
  }

  // Verify the token
  const user = await verifyToken(token);

  if (!user) {
    set.status = 401;
    return {
      authenticated: false,
      error: "Invalid or expired token",
    };
  }

  // Return the authenticated user
  return {
    authenticated: true,
    user: {
      publicKey: user.publicKey,
      // Add any other user properties needed
    },
  };
});

// Usage example:
// app.use(authMiddleware)
//   .get('/protected', ({ user }) => {
//     return { message: `Hello ${user.publicKey}!` };
//   }, {
//     beforeHandle: ({ authenticated, set }) => {
//       if (!authenticated) {
//         set.status = 401;
//         return { error: "Unauthorized" };
//       }
//     }
//   });
