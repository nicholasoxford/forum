import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

export async function getTelegramClient() {
  const apiId = Number(process.env.TELEGRAM_API_ID);
  const apiHash = process.env.TELEGRAM_API_HASH!;
  const sessionString = process.env.TELEGRAM_SESSION || "";
  const stringSession = new StringSession(sessionString);

  const client = new TelegramClient(stringSession, apiId, apiHash, {
    connectionRetries: 5,
  });
  await client.connect();
  return client;
}

export async function invokeCreateChannel(client: TelegramClient) {
  const result = await client.invoke(
    new Api.channels.CreateChannel({
      title: "Test Channel",
      about: "Test Channel Description",
    })
  );

  return result;
}

// Add a convenience wrapper to create a Telegram channel and return its chat ID
export async function createTelegramChannel(
  title: string,
  about: string
): Promise<{ channelId: string }> {
  const client = await getTelegramClient();

  const updates = await client.invoke(
    new Api.channels.CreateChannel({
      title,
      about,
    })
  );

  // The result is typically an Updates object containing the newly created chat
  // Find the channel object to extract its ID.
  // See: https://gram.js.org/#/methods/channels.createChannel
  const { channelId } = (() => {
    // inside wrapper to ensure proper typing
    const channel = (updates as any).chats?.[0] as Api.TypeChat | undefined;
    if (!channel || (channel as any).id === undefined) {
      throw new Error(
        "Failed to create Telegram channel – channel not found in response"
      );
    }
    return { channelId: String((channel as any).id) };
  })();

  await client.disconnect();
  return { channelId };
}

// Remove automatic execution of test code to avoid side-effects in production
// async function testCreateChannel() {
//   const client = await getTelegramClient();
//   const result = await invokeCreateChannel(client);
//   console.log(result);
// }
//
// testCreateChannel();
