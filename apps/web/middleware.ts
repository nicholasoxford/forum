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

  // Check if the current path is a protected route
  if (protectedRoutes.some((route) => path.startsWith(route))) {
    const token = await getToken({
      req,
      secret: process.env.NEXTAUTH_SECRET,
    });

    // If user is not authenticated, redirect to home page
    if (!token) {
      const url = new URL("/", req.url);
      url.searchParams.set("callbackUrl", path);
      return NextResponse.redirect(url);
    }
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
