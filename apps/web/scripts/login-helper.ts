import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { text } from "input";
import * as dotenv from "dotenv";
import path from "path";

// Load environment variables from the .env file in the web app directory
dotenv.config({ path: path.resolve(__dirname, "../.env") });

async function main() {
  const apiId = 22575920;
  const apiHash = "f70e7edb6418a775d1f60c1076095e90";

  if (!apiId || !apiHash) {
    console.error(
      "Error: TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in your .env file"
    );
    process.exit(1);
  }

  const session = new StringSession(
    "1AQAOMTQ5LjE1NC4xNzUuNTYBu5DqVcF+kx5JY7NytTu3yEmqqFNE7b8qWB9eXZ/SvMyzxOQYEg2EprX9VT9TPApDx1GQ9x2GTZfnE6jbVgr3iKgaf8cv+cmzaRxpDKucrFgGMWlV3+0wR842a29VauI6TF7CvGrtzyDjvbrU9TGUS9yruKXj+fNeiXxI/uQqdRJKcKrqTOldW2RwOupV/bIvXNA9E74TD99KhzT7RZa4QHSNsjjKVjwun3Yb0lUqIBlBVtqHoco6mifMEcA+L1Uxn51KDu4g/CYx7NrT28v0jUt56KM5Pr99cMKJjEMPXUlP3apkz2si6A9ECUxVdEfuP75ZLY+jHQOft8/Co/2uY8w="
  ); // empty → triggers login

  const client = new TelegramClient(session, apiId, apiHash, {
    connectionRetries: 5,
  });

  await client.start({
    // —— interactive callbacks ——
    phoneNumber: async () => await text("Phone number (e.g. +15555555555): "),
    phoneCode: async () => await text("Telegram login code: "),
    password: async () => await text("2‑FA password (leave blank if none): "),
    onError: (err) => console.error(err),
  });

  console.log(
    "\n✅  Logged in as",
    await client.getMe().then((u) => u.username)
  );

  const str = client.session.save();
  console.log("\n================ COPY THIS SESSION =================\n");
  console.log(str); // <-- paste into TELEGRAM_SESSION for your backend
  console.log("\n====================================================\n");

  await client.disconnect();
}

main().catch(console.error);
