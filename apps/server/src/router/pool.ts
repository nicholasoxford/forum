import { Elysia } from "elysia";

export const poolRouter = new Elysia({ prefix: "/pool" })
  // TODO: Implement pool-related endpoints
  .get("/", () => ({ message: "Pool router placeholder" }));
