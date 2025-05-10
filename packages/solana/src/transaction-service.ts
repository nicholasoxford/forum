import {
  HELIUS_RPC_URL,
  HeliusGetSignatureStatusesResponse,
  SignatureStatusResponse,
  WaitForSignatureConfirmationArgs,
} from "@workspace/types/src/helius-types";

export async function waitForSignatureConfirmation({
  signature,
  timeout = 60000,
  interval = 200,
  heliusApiKey,
}: WaitForSignatureConfirmationArgs): Promise<SignatureStatusResponse> {
  if (!heliusApiKey) {
    return {
      success: false,
      status: "error",
      message: "HELIUS_API_KEY not configured",
    };
  }

  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      console.log("Checking signature status...");
      console.log(signature);
      const response = await fetch(`${HELIUS_RPC_URL}${heliusApiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: "1",
          method: "getSignatureStatuses",
          params: [[signature], { searchTransactionHistory: true }],
        }),
      });

      const result =
        (await response.json()) as HeliusGetSignatureStatusesResponse;
      console.log("Result received");
      console.log(result);
      const status = result.result?.value?.[0];

      // If we have a status and it's not null, transaction is confirmed
      if (status) {
        if (status.err) {
          return {
            success: false,
            status: "failed",
            error: status.err,
            confirmation: status,
          };
        } else {
          console.log("Transaction confirmed");
          return {
            success: true,
            status: "confirmed",
            confirmation: status,
          };
        }
      }

      // Wait before checking again
      await new Promise((resolve) => setTimeout(resolve, interval));
    } catch (error) {
      console.error("Error checking signature status:", error);
      // Continue checking despite error, but good to know if it's persistent
      // Optionally, you might want to break or return an error status if fetch fails multiple times
    }
  }
  console.log("Timeout reached");
  // Timeout reached
  return {
    success: false,
    status: "timeout",
    message: `Transaction not confirmed after ${timeout}ms`,
  };
}
