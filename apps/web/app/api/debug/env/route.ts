import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // For security, we only want to expose specific environment variables
  // and only to authenticated users in development environment

  // Check if user is authenticated
  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Only allow in development or if user is authenticated
  const isDev = process.env.NODE_ENV === "development";

  if (!isDev && !token) {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  // Only expose specific environment variables
  const safeEnv = {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NODE_ENV: process.env.NODE_ENV,
  };

  return NextResponse.json(safeEnv);
}
