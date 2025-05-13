import { Keypair } from "@solana/web3.js";
import { getDb } from "@workspace/db";
import { funKeypairs } from "@workspace/db/src/schema";
import { and, eq } from "drizzle-orm";
import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs";
import * as path from "path";

const execAsync = promisify(exec);

// Get db instance
const db = getDb();

/**
 * Checks if a keypair matches the required suffix pattern
 */
export function isDesirableKeypair(keypair: Keypair, suffix: string): boolean {
  return keypair.publicKey
    .toString()
    .toLowerCase()
    .endsWith(suffix.toLowerCase());
}

/**
 * Generates a keypair with a specific suffix using JS implementation
 * Warning: This can take a long time depending on the suffix length
 */
export function grindKeypairWithSuffix(suffix: string): Keypair {
  let attempt = 0;
  let keypair: Keypair;

  // Keep generating keypairs until we find one with the desired suffix
  do {
    keypair = Keypair.generate();
    attempt++;

    if (attempt % 1000 === 0) {
      console.log(`Attempted ${attempt} keypairs...`);
    }
  } while (!isDesirableKeypair(keypair, suffix));

  console.log(
    `Found keypair with suffix "${suffix}" after ${attempt} attempts: ${keypair.publicKey.toString()}`
  );
  return keypair;
}

/**
 * Grinds keypairs using the Solana CLI tool (much faster than JS implementation)
 * @param suffix The suffix to search for (e.g., "fun")
 * @param count Number of keypairs to generate
 * @returns Array of generated keypairs
 */
export async function grindKeypairsWithCli(
  suffix: string,
  count: number = 1
): Promise<Keypair[]> {
  const tempDir = path.join(process.cwd(), "temp-keypairs");

  // Create temp directory if it doesn't exist
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  // We'll store keypair data here
  const keypairs: Keypair[] = [];

  try {
    console.log(
      `Grinding ${count} keypairs ending with "${suffix}" using solana-keygen...`
    );

    // Run the solana-keygen command - note the tool outputs to stdout, not to a file
    const { stdout, stderr } = await execAsync(
      `solana-keygen grind --ends-with ${suffix}:${count}`
    );

    if (stderr && stderr.includes("error:")) {
      console.error(`Error grinding keypairs: ${stderr}`);
      throw new Error(stderr);
    }

    // Parse the output which contains the keypair data
    // The output format is: Wrote keypair to <path>
    const outputLines = stdout
      .split("\n")
      .filter((line) => line.startsWith("Wrote keypair to "));

    for (const line of outputLines) {
      // Extract keypair file path
      const keypairPath = line.replace("Wrote keypair to ", "").trim();

      if (fs.existsSync(keypairPath)) {
        // Read the keypair file
        const keypairData = JSON.parse(fs.readFileSync(keypairPath, "utf-8"));

        // Create keypair from the data
        const keypair = Keypair.fromSecretKey(Uint8Array.from(keypairData));
        keypairs.push(keypair);

        // Clean up the file
        fs.unlinkSync(keypairPath);
      }
    }

    console.log(`Successfully generated ${keypairs.length} keypairs`);
    return keypairs;
  } catch (error) {
    console.error(`Failed to grind keypairs: ${error}`);
    throw error;
  }
}

/**
 * Saves a newly generated keypair to the database
 */
export async function saveKeypair(keypair: Keypair, suffix: string) {
  const privateKeyBuffer = keypair.secretKey;
  // Convert the private key to a string for storage
  // Note: In production, you should encrypt this before storing
  const privateKeyString = Buffer.from(privateKeyBuffer).toString("base64");

  return await db.insert(funKeypairs).values({
    publicKey: keypair.publicKey.toString(),
    privateKey: privateKeyString,
    suffix: suffix,
    isUsed: false,
  });
}

/**
 * Batch saves multiple keypairs to the database
 */
export async function saveKeypairsBatch(keypairs: Keypair[], suffix: string) {
  const values = keypairs.map((keypair) => ({
    publicKey: keypair.publicKey.toString(),
    privateKey: Buffer.from(keypair.secretKey).toString("base64"),
    suffix: suffix,
    isUsed: false,
  }));

  return await db.insert(funKeypairs).values(values);
}

/**
 * Finds an available keypair with the specified suffix
 */
export async function getAvailableKeypair(suffix: string) {
  const keypair = await db.query.funKeypairs.findFirst({
    where: and(eq(funKeypairs.suffix, suffix), eq(funKeypairs.isUsed, false)),
  });

  return keypair;
}

/**
 * Marks a keypair as used by a specific token mint
 */
export async function markKeypairAsUsed(publicKey: string, tokenMint: string) {
  return await db
    .update(funKeypairs)
    .set({
      isUsed: true,
      usedByTokenMint: tokenMint,
      usedAt: new Date(),
    })
    .where(eq(funKeypairs.publicKey, publicKey));
}

/**
 * Reconstructs a Keypair object from a database entry
 */
export function reconstructKeypair(dbKeypair: {
  publicKey: string;
  privateKey: string;
}): Keypair {
  const secretKeyBuffer = Buffer.from(dbKeypair.privateKey, "base64");
  return Keypair.fromSecretKey(secretKeyBuffer);
}
