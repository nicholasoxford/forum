import { createDb } from "@workspace/db";
import { getDb } from "@workspace/db";
import { transactions } from "@workspace/db/src/schema";
import { sql, and, eq } from "drizzle-orm";

// Define transaction types for type safety
export type TransactionType =
  | "buy"
  | "sell"
  | "create_pool"
  | "claim"
  | "distribute_fees"
  | "create-token-2022";

// Define transaction status for type safety
export type TransactionStatus = "pending" | "confirmed" | "failed";

export class ForumTransactions {
  constructor(private readonly db: ReturnType<typeof createDb>) {}

  /**
   * Create a new transaction record
   */
  async createTransaction(data: {
    type: TransactionType;
    status?: TransactionStatus;
    transactionSignature?: string;
    userWalletAddress: string;
    tokenMintAddress?: string;
    poolAddress?: string;
    amountA?: string;
    amountB?: string;
    mintA?: string;
    mintB?: string;
    feePaid?: string;
    metadata?: Record<string, any>;
    errorMessage?: string;
  }) {
    const [result] = await this.db.insert(transactions).values({
      type: data.type,
      status: data.status || "pending",
      transactionSignature: data.transactionSignature,
      userWalletAddress: data.userWalletAddress,
      tokenMintAddress: data.tokenMintAddress,
      poolAddress: data.poolAddress,
      amountA: data.amountA,
      amountB: data.amountB,
      mintA: data.mintA,
      mintB: data.mintB,
      feePaid: data.feePaid,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      errorMessage: data.errorMessage,
    });

    return result;
  }

  /**
   * Update transaction status
   */
  async updateTransactionStatus(
    id: number,
    status: TransactionStatus,
    options?: {
      signature?: string;
      errorMessage?: string;
      tokenMintAddress?: string;
      poolAddress?: string;
      mintA?: string;
      mintB?: string;
      amountA?: string;
      amountB?: string;
      feePaid?: string;
    }
  ) {
    const updateData: Record<string, any> = { status };

    if (options?.signature) {
      updateData.transactionSignature = options.signature;
    }

    if (options?.errorMessage) {
      updateData.errorMessage = options.errorMessage;
    }

    // Add transaction-specific fields if provided
    if (options?.tokenMintAddress) {
      updateData.tokenMintAddress = options.tokenMintAddress;
    }

    if (options?.poolAddress) {
      updateData.poolAddress = options.poolAddress;
    }

    if (options?.mintA) {
      updateData.mintA = options.mintA;
    }

    if (options?.mintB) {
      updateData.mintB = options.mintB;
    }

    if (options?.amountA) {
      updateData.amountA = options.amountA;
    }

    if (options?.amountB) {
      updateData.amountB = options.amountB;
    }

    if (options?.feePaid) {
      updateData.feePaid = options.feePaid;
    }

    if (status === "confirmed") {
      updateData.confirmedAt = sql`CURRENT_TIMESTAMP`;
    }

    const [result] = await this.db
      .update(transactions)
      .set(updateData)
      .where(sql`id = ${id}`);

    return result;
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: number) {
    const [result] = await this.db
      .select()
      .from(transactions)
      .where(sql`id = ${id}`);

    return result;
  }

  /**
   * Get transaction by signature
   */
  async getTransactionBySignature(signature: string) {
    const [result] = await this.db
      .select()
      .from(transactions)
      .where(sql`transaction_signature = ${signature}`);

    return result;
  }

  /**
   * Get transactions by user wallet address with pagination
   */
  async getTransactionsByUser(
    userWalletAddress: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: TransactionType;
    }
  ) {
    const { limit = 20, offset = 0, type } = options || {};

    const conditions = [sql`user_wallet_address = ${userWalletAddress}`];

    if (type) {
      conditions.push(sql`type = ${type}`);
    }

    return this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(sql`created_at desc`)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get transactions by token mint address
   */
  async getTransactionsByToken(
    tokenMintAddress: string,
    options?: {
      limit?: number;
      offset?: number;
      type?: TransactionType;
    }
  ) {
    const { limit = 20, offset = 0, type } = options || {};

    const conditions = [sql`token_mint_address = ${tokenMintAddress}`];

    if (type) {
      conditions.push(sql`type = ${type}`);
    }

    return this.db
      .select()
      .from(transactions)
      .where(and(...conditions))
      .orderBy(sql`created_at desc`)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get transactions by pool address
   */
  async getTransactionsByPool(
    poolAddress: string,
    options?: {
      limit?: number;
      offset?: number;
    }
  ) {
    const { limit = 20, offset = 0 } = options || {};

    return this.db
      .select()
      .from(transactions)
      .where(sql`pool_address = ${poolAddress}`)
      .orderBy(sql`created_at desc`)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get recent transactions with pagination
   */
  async getRecentTransactions(options?: {
    limit?: number;
    offset?: number;
    type?: TransactionType;
  }) {
    const { limit = 20, offset = 0, type } = options || {};

    const query = this.db.select().from(transactions);

    if (type) {
      return query
        .where(sql`type = ${type}`)
        .orderBy(sql`created_at desc`)
        .limit(limit)
        .offset(offset);
    }

    return query
      .orderBy(sql`created_at desc`)
      .limit(limit)
      .offset(offset);
  }

  /**
   * Get transactions count by type
   */
  async getTransactionsCountByType(type: TransactionType) {
    const [result] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(transactions)
      .where(sql`type = ${type}`);

    return result?.count || 0;
  }

  /**
   * Create a pool creation transaction
   */
  async createPoolTransaction(params: {
    userWalletAddress: string;
    tokenMintAddress: string;
    poolAddress: string;
    mintA: string;
    mintB: string;
    initialTokenReserves: string;
    metadata?: Record<string, any>;
  }) {
    return this.createTransaction({
      type: "create_pool",
      userWalletAddress: params.userWalletAddress,
      tokenMintAddress: params.tokenMintAddress,
      poolAddress: params.poolAddress,
      mintA: params.mintA,
      mintB: params.mintB,
      amountB: params.initialTokenReserves,
      metadata: params.metadata,
    });
  }

  /**
   * Create a buy transaction
   */
  async createBuyTransaction(params: {
    userWalletAddress: string;
    tokenMintAddress: string;
    poolAddress: string;
    mintA: string;
    mintB: string;
    amountA: string;
    estimatedAmountB?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createTransaction({
      type: "buy",
      userWalletAddress: params.userWalletAddress,
      tokenMintAddress: params.tokenMintAddress,
      poolAddress: params.poolAddress,
      mintA: params.mintA,
      mintB: params.mintB,
      amountA: params.amountA,
      amountB: params.estimatedAmountB,
      metadata: params.metadata,
    });
  }

  /**
   * Create a sell transaction
   */
  async createSellTransaction(params: {
    userWalletAddress: string;
    tokenMintAddress: string;
    poolAddress: string;
    mintA: string;
    mintB: string;
    amountB: string;
    estimatedAmountA?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createTransaction({
      type: "sell",
      userWalletAddress: params.userWalletAddress,
      tokenMintAddress: params.tokenMintAddress,
      poolAddress: params.poolAddress,
      mintA: params.mintA,
      mintB: params.mintB,
      amountA: params.estimatedAmountA,
      amountB: params.amountB,
      metadata: params.metadata,
    });
  }

  /**
   * Create a claim transaction
   */
  async createClaimTransaction(params: {
    userWalletAddress: string;
    tokenMintAddress: string;
    poolAddress: string;
    mintA: string;
    estimatedAmount?: string;
    metadata?: Record<string, any>;
  }) {
    return this.createTransaction({
      type: "claim",
      userWalletAddress: params.userWalletAddress,
      tokenMintAddress: params.tokenMintAddress,
      poolAddress: params.poolAddress,
      mintA: params.mintA,
      amountA: params.estimatedAmount,
      metadata: params.metadata,
    });
  }

  /**
   * Create a fee distribution transaction
   */
  async createFeeDistributionTransaction(params: {
    userWalletAddress: string;
    tokenMintAddress: string;
    amountB: string;
    numberOfRecipients: number;
    metadata?: Record<string, any>;
  }) {
    return this.createTransaction({
      type: "distribute_fees",
      userWalletAddress: params.userWalletAddress,
      tokenMintAddress: params.tokenMintAddress,
      amountB: params.amountB,
      metadata: {
        ...params.metadata,
        numberOfRecipients: params.numberOfRecipients,
      },
    });
  }
}
