import { treaty } from "@elysiajs/eden";
import type { Elysia } from "@workspace/server";
if (!process.env.NEXT_PUBLIC_SERVER_URL) {
  throw new Error("NEXT_PUBLIC_SERVER_URL is not defined");
}
export const server = treaty<Elysia>(process.env.NEXT_PUBLIC_SERVER_URL);
