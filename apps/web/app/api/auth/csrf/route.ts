import { NextResponse } from "next/server";
import { getCsrfToken } from "next-auth/react";

export async function GET() {
  const csrfToken = await getCsrfToken();
  return NextResponse.json({ csrfToken });
}
