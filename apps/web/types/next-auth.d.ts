import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    publicKey?: string;
    user?: {
      name?: string;
      image?: string;
    } & DefaultSession["user"];
  }
}
