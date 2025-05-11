import { TelegramClient, Api } from "telegram";
import { StringSession } from "telegram/sessions";
import * as dotenv from "dotenv";
import path from "path";
import bigInt from "big-integer";

// Load environment variables from the .env file
dotenv.config({ path: path.resolve(__dirname, "../.env") });

// Constants
const BOT_USERNAME = process.env.TELEGRAM_BOT_NAME || "LordGroupieBot";

/**
 * Creates and connects a Telegram client
 */
export async function getTelegramClient(): Promise<TelegramClient> {
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

/**
 * Creates a Telegram channel with the given title and description
 */
export async function createTelegramChannel(
  title: string,
  about: string
): Promise<{ channelId: string; username: string }> {
  const client = await getTelegramClient();
  let channelIdTemp = "";
  let usernameTemp = "";
  try {
    // Create a supergroup (not a broadcast channel) to support join-request gating
    const updates = await createSupergroup(client, title, about);
    const { channelId, channel } = extractChannelInfo(updates);
    channelIdTemp = channelId;
    // Configure the channel
    const inputChannel = createInputChannel(channel);
    const username = generateUsername(title);
    usernameTemp = username;
    await configureChannel(client, inputChannel, channel, title, username);
    return { channelId, username };
  } catch (error) {
    console.error("HERE BRO", error);
    return { channelId: channelIdTemp, username: usernameTemp };
  } finally {
    await client.disconnect();
  }
}

/**
 * Creates a supergroup with the given title and description
 */
async function createSupergroup(
  client: TelegramClient,
  title: string,
  about: string
): Promise<Api.TypeUpdates> {
  return client.invoke(
    new Api.channels.CreateChannel({
      title,
      about,
      megagroup: true, // supergroup supports gated join-requests
    })
  );
}

/**
 * Extracts channel information from the updates response
 */
function extractChannelInfo(updates: Api.TypeUpdates): {
  channelId: string;
  channel: Api.Channel;
} {
  const channel = (updates as any).chats?.[0] as Api.TypeChat | undefined;

  if (!channel || (channel as any).id === undefined) {
    throw new Error(
      "Failed to create Telegram channel – channel not found in response"
    );
  }

  return {
    channelId: String((channel as any).id),
    channel: channel as Api.Channel,
  };
}

/**
 * Creates an InputChannel object from a Channel entity
 */
function createInputChannel(channel: Api.Channel): Api.InputChannel {
  const { id: rawId, accessHash } = channel;

  return new Api.InputChannel({
    channelId: bigInt(String(rawId)),
    accessHash: bigInt(String(accessHash)),
  });
}

/**
 * Configures a channel with username, join requests, and bot permissions
 */
async function configureChannel(
  client: TelegramClient,
  inputChannel: Api.InputChannel,
  channel: Api.Channel,
  title: string,
  username: string
): Promise<void> {
  // Set a public username

  console.log("about to invoke update username");
  await client.invoke(
    new Api.channels.UpdateUsername({
      channel: inputChannel,
      username,
    })
  );
  console.log("about to enable join request gating");
  // Enable join request gating
  await client.invoke(
    new Api.channels.ToggleJoinRequest({
      channel: inputChannel,
      enabled: true,
    })
  );
  console.log("about to add bot to channel");

  // Add and configure the bot
  await addBotToChannel(client, channel);
}

/**
 * Adds the bot to the channel and configures its permissions
 */
async function addBotToChannel(
  client: TelegramClient,
  channel: Api.Channel
): Promise<void> {
  // Invite the bot to the channel
  await client.invoke(
    new Api.channels.InviteToChannel({
      channel,
      users: [BOT_USERNAME],
    })
  );

  // Set bot permissions
  await client.invoke(
    new Api.channels.EditAdmin({
      channel,
      userId: BOT_USERNAME,
      adminRights: new Api.ChatAdminRights({
        changeInfo: false,
        postMessages: false,
        editMessages: false,
        deleteMessages: false,
        banUsers: false,
        inviteUsers: true, // Required for managing join requests
        pinMessages: false,
        addAdmins: false,
        manageTopics: false,
      }),
      rank: "Gatekeeper",
    })
  );
}

/**
 * Generates a valid Telegram username from a base string
 */
function generateUsername(base: string): string {
  // Sanitize the base string to meet Telegram username requirements
  const sanitized = base
    .toLowerCase()
    .replace(/[^a-z0-9_]/g, "") // Allow letters, digits, underscore
    .replace(/^[^a-z]+/, "a"); // Ensure it starts with a letter

  // Add a random suffix to ensure uniqueness
  const suffix = Math.random().toString(36).slice(-5);

  // Combine and truncate to meet Telegram's length requirements
  const username = (sanitized + suffix).slice(0, 32);

  // Ensure minimum length of 5 characters
  return username.length < 5 ? username.padEnd(5, "x") : username;
}
