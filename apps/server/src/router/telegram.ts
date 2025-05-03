import { Elysia, t } from "elysia";
import nacl from "tweetnacl";
import bs58 from "bs58";
import { getDb, groupChats } from "@workspace/db";
import { eq } from "drizzle-orm";

const encoder = new TextEncoder();

// Environment variables that would need to be set for your app
interface TelegramEnv {
  BOT_TOKEN: string;
  WEBHOOK_SECRET: string;
  PUBLIC_URL: string;
  HELIUS_API_KEY: string;
  TURSO_URL: string;
  TURSO_AUTH_TOKEN: string;
}

// Get environment variables
const env: TelegramEnv = {
  BOT_TOKEN: process.env.BOT_TOKEN || "",
  WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || "super-random-123",
  PUBLIC_URL: process.env.PUBLIC_URL || "https://groupie.fun",
  HELIUS_API_KEY: process.env.HELIUS_API_KEY || "",
  TURSO_URL: process.env.TURSO_URL || "",
  TURSO_AUTH_TOKEN: process.env.TURSO_AUTH_TOKEN || "",
};

export const telegramRouter = new Elysia({ prefix: "/telegram" })
  // Handle Telegram webhook
  .post(`/${env.WEBHOOK_SECRET}`, async ({ body }) => {
    const { BOT_TOKEN, PUBLIC_URL } = env;
    const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

    // Type assertion for body
    const typedBody = body as {
      chat_join_request?: {
        chat: { id: string; title: string };
        from: { id: string };
      };
    };
    const join = typedBody.chat_join_request;
    if (!join) return { status: "ignored" };

    const { chat, from } = join;

    // DM user with inline button – chat & user embedded in URL
    await fetch(`${API}/sendMessage`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        chat_id: from.id,
        text:
          `👋 To enter *${chat.title}* please sign a message proving you own ` +
          `the required Solana wallet.\n\n• Tap the button\n• Sign\n• Jump back ✨`,
        parse_mode: "Markdown",
        reply_markup: {
          inline_keyboard: [
            [
              {
                text: "Verify wallet",
                url: `${PUBLIC_URL}/verify?chat=${chat.id}&user=${from.id}`,
              },
            ],
          ],
        },
      }),
    });

    return { status: "sent" };
  })

  // Handle wallet verification
  .post(
    "/verify",
    async ({ body }) => {
      const { BOT_TOKEN, HELIUS_API_KEY, TURSO_URL, TURSO_AUTH_TOKEN } = env;
      const API = `https://api.telegram.org/bot${BOT_TOKEN}`;

      const { chatId, userId, pubkey, signature } = body;

      // --- Fetch mint & required holdings from database ---
      let mint: string | undefined;
      let requiredHoldings = "1";

      try {
        // Use local database if possible
        const db = getDb();
        const chatGroup = await db.query.groupChats.findFirst({
          where: (fields) => eq(fields.telegramChatId, chatId.toString()),
        });

        if (chatGroup) {
          mint = chatGroup.tokenMintAddress;
          requiredHoldings = chatGroup.requiredHoldings;
        }
      } catch (err) {
        console.error("Database query error", err);
        return new Response("db error", { status: 500 });
      }

      if (!mint) return new Response("unknown chat", { status: 400 });

      // ——— A) verify signature ———
      const text = `Join request for ${chatId} by ${userId}`;
      const okSig = nacl.sign.detached.verify(
        encoder.encode(text),
        Uint8Array.from(signature),
        bs58.decode(pubkey)
      );

      if (!okSig) return new Response("bad signature", { status: 400 });

      // ——— B) check wallet balance ———
      interface HeliusToken {
        mint: string;
        amount: string;
      }

      interface HeliusResponse {
        tokens: HeliusToken[];
      }

      const helius = (await fetch(
        `https://api.helius.xyz/v0/addresses/${pubkey}/balances?api-key=${HELIUS_API_KEY}`
      ).then((r) => r.json())) as HeliusResponse;

      const holds = helius.tokens.some(
        (t: HeliusToken) =>
          t.mint === mint && Number(t.amount) >= Number(requiredHoldings)
      );

      // ——— C) approve or decline in Telegram ———
      const method = holds
        ? "approveChatJoinRequest"
        : "declineChatJoinRequest";
      await fetch(`${API}/${method}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          user_id: userId,
        }),
      });

      return { status: holds ? "approved" : "denied" };
    },
    {
      body: t.Object({
        chatId: t.Number(),
        userId: t.Number(),
        pubkey: t.String(),
        signature: t.Array(t.Number()),
      }),
    }
  );
