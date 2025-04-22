// Token mint address
const TOKEN_MINT = "6oVKCciZhzj54JTx2wv1T58B1ysfeL3Cf5o52yroEeoF";
// Token wallet address
const TOKEN_WALLET = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";
// Owner address
const OWNER_ADDRESS = "8jTiTDW9ZbMHvAD9SZWvhPfRx5gUgK7HACMdgbFp2tUz";

async function main() {
  try {
    console.log("Creating Vertigo pool for token:", TOKEN_MINT);

    // Pool parameters
    const params = {
      tokenMint: TOKEN_MINT,
      tokenWallet: TOKEN_WALLET,
      tokenName: "Test Token",
      tokenSymbol: "TEST",
      initialLiquidity: 1, // 1 SOL
      feeBps: 100, // 1% fee
      maxFee: 0.1,
      magicSol: 10, // 10 SOL magic number
      walletPublicKey: TOKEN_MINT, // Using token mint as wallet for test
      signature: "test", // In production this would be a real signature
      account: OWNER_ADDRESS, // Owner address
    };

    console.log("Pool parameters:", params);

    // Launch the pool via API
    console.log("Launching pool via API...");

    // Create URL with query parameters
    const url = new URL("http://localhost:3000/api/vertigo/launch-pool");
    url.searchParams.append("mintB", params.tokenMint);
    url.searchParams.append("tokenWallet", params.tokenWallet);
    url.searchParams.append("tokenName", params.tokenName);
    url.searchParams.append("tokenSymbol", params.tokenSymbol);
    url.searchParams.append("shift", params.magicSol.toString());
    url.searchParams.append("royaltiesBps", params.feeBps.toString());

    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ account: params.account }),
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Failed to launch pool: ${result.error}`);
    }

    console.log("Pool launched successfully!");
    console.log("Pool address:", result.poolAddress);
    console.log("Transaction signature:", result.signature);

    // Print explorer links
    console.log("\nExplorer links:");
    console.log(
      `Pool: https://explorer.solana.com/address/${result.poolAddress}?cluster=devnet`
    );
    console.log(
      `Transaction: https://explorer.solana.com/tx/${result.signature}?cluster=devnet`
    );
  } catch (error) {
    console.error("Error launching Vertigo pool:", error);
  }
}

main();
