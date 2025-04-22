import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

// List of routes that require authentication
const protectedRoutes = [
  "/my-group-chats",
  "/launch",
  // Add more protected routes here
];

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  console.log("Middleware checking path:", path);

  // Check if the current path is a protected route
  const isProtected = protectedRoutes.some((route) => path.startsWith(route));
  console.log("Is protected route:", isProtected);

  if (isProtected) {
    console.log("Checking auth session for protected route");

    // Check for auth session cookie instead of decoding JWT
    const sessionCookie =
      req.cookies.get("next-auth.session-token") ||
      req.cookies.get("__Secure-next-auth.session-token");

    const isAuthenticated = !!sessionCookie;
    console.log(
      "Auth session status:",
      isAuthenticated ? "found" : "not found"
    );

    // If user is not authenticated, redirect to home page
    if (!isAuthenticated) {
      console.log("User not authenticated, redirecting to home page");
      const url = new URL("/", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }

    console.log("User authenticated, allowing access to protected route");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    {
      source: "/((?!api|_next/static|_next/image|favicon.ico).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
