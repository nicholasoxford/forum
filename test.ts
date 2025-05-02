import { Connection, PublicKey } from "@solana/web3.js";

/**
 * Find all pools owned by a specific wallet address
 * for Vertigo AMM program: vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ
 */

// Configuration
const RPC_URL =
  "https://devnet.helius-rpc.com/?api-key=0609bd8a-0301-481b-b42d-50fc9b6d0a98";
const PROGRAM_ID = "vrTGoBuy5rYSxAfV3jaRJWHH6nN9WK4NRExGxsk1bCJ";
const OWNER_ADDRESS = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";

// Initialize connection
const connection = new Connection(RPC_URL);
const programId = new PublicKey(PROGRAM_ID);
const ownerPubkey = new PublicKey(OWNER_ADDRESS);

async function findPoolsOwnedByWallet() {
  // Get all program accounts where owner matches at offset 9
  // (Based on analysis of the Pool account structure)
  const pools = await connection.getProgramAccounts(programId, {
    filters: [
      {
        memcmp: {
          offset: 9, // Offset to the owner field in Pool struct
          bytes: ownerPubkey.toBase58(),
        },
      },
    ],
  });

  console.log(`Found ${pools.length} pools owned by this wallet`);

  // Return formatted results
  return pools.map((account) => ({
    address: account.pubkey.toBase58(),
    dataSize: account.account.data.length,
    // Later: Add decoded data with mint_a, mint_b, etc.
  }));
}

// Run the pool finder
findPoolsOwnedByWallet().then((pools) => {
  console.log(JSON.stringify(pools, null, 2));
});
