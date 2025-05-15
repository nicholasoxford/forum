import { createDb } from "@workspace/db";
import {
  users,
  type InsertUser,
  type SelectUser,
} from "@workspace/db/src/schema";
import { eq, sql } from "drizzle-orm";

export class UserService {
  constructor(private readonly db: ReturnType<typeof createDb>) {}

  /**
   * Get user by wallet address
   */
  async getUserByWalletAddress(
    walletAddress: string
  ): Promise<SelectUser | undefined> {
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.walletAddress, walletAddress));

    return user;
  }

  /**
   * Create a new user
   */
  async createUser(data: InsertUser): Promise<SelectUser> {
    // Insert with on duplicate key ignore to handle race conditions
    await this.db
      .insert(users)
      .values(data)
      .onDuplicateKeyUpdate({
        set: { walletAddress: data.walletAddress },
      });

    // Return the created user
    const user = await this.getUserByWalletAddress(data.walletAddress);
    if (!user) {
      throw new Error(
        `Failed to create user with wallet address: ${data.walletAddress}`
      );
    }

    return user;
  }

  /**
   * Get or create a user by wallet address efficiently using upsert
   * Creates a new user if one doesn't already exist with the given wallet address
   */
  async getOrCreateUser(
    walletAddress: string,
    data?: Omit<InsertUser, "walletAddress">
  ): Promise<SelectUser> {
    // Use upsert to either create the user or do nothing if it exists
    await this.db
      .insert(users)
      .values({
        walletAddress,
        ...data,
      })
      .onDuplicateKeyUpdate({
        set: { walletAddress: sql`${users.walletAddress}` }, // Effectively no-op on duplicate
      });

    // Return the user (which now definitely exists)
    const user = await this.getUserByWalletAddress(walletAddress);
    if (!user) {
      throw new Error(
        `Unexpected error: Failed to find user after upsert: ${walletAddress}`
      );
    }

    return user;
  }

  /**
   * Update user data if exists, otherwise create
   */
  async upsertUser(
    data: InsertUser,
    updateFields?: Partial<Omit<InsertUser, "walletAddress">>
  ): Promise<SelectUser> {
    // If no specific update fields are provided, update with the input data
    const fieldsToUpdate = updateFields || data;

    await this.db
      .insert(users)
      .values(data)
      .onDuplicateKeyUpdate({
        set: {
          ...fieldsToUpdate,
          // Ensure we don't try to update the primary key
          walletAddress: data.walletAddress,
        },
      });

    const user = await this.getUserByWalletAddress(data.walletAddress);
    if (!user) {
      throw new Error(
        `Failed to upsert user with wallet address: ${data.walletAddress}`
      );
    }

    return user;
  }

  /**
   * Update user data
   */
  async updateUser(
    walletAddress: string,
    data: Partial<Omit<InsertUser, "walletAddress">>
  ): Promise<SelectUser | undefined> {
    await this.db
      .update(users)
      .set(data)
      .where(eq(users.walletAddress, walletAddress));

    return this.getUserByWalletAddress(walletAddress);
  }
}

// Export instance for direct use
export function createUserService(db = createDb()) {
  return new UserService(db);
}
