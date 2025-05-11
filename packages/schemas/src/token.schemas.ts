import { t } from "elysia";

// Define the schema for the launch token request body
export const LaunchTokenBodySchema = t.Object({
  tokenMintAddress: t.String(),
  tokenSymbol: t.String(),
  tokenName: t.String(),
  decimals: t.Number(),
  transferFeeBasisPoints: t.Number(),
  maximumFee: t.String(), // Keep as string for precision
  metadataUri: t.Optional(t.String()),
  creatorWalletAddress: t.String(),
  creatorUsername: t.Optional(t.String()),
  creatorTelegramUserId: t.Optional(t.String()),
  requiredHoldings: t.String(), // Keep as string
  targetMarketCap: t.Optional(t.String()), // Keep as string
});

export const GetAllTokensResponseSchema = t.Array(
  t.Object({
    tokenMintAddress: t.String(),
    tokenName: t.String(),
    tokenSymbol: t.String(),
    decimals: t.Number(),
    transferFeeBasisPoints: t.Number(),
    metadataUri: t.String(),
    creatorWalletAddress: t.String(),
    pool: t.Union([
      t.Object({
        poolAddress: t.String(),
        ownerAddress: t.String(),
        mintA: t.String(),
        mintB: t.String(),
        shift: t.Number(),
        initialTokenReserves: t.Number(),
        royaltiesBps: t.Number(),
      }),
      t.Null(),
    ]),
  })
);

export const GetTokenPoolParamsSchema = t.Object({
  id: t.String(),
});

export const GetTokenPoolResponseSchema = {
  200: t.Object(
    {
      tokenMintAddress: t.String(),
      tokenSymbol: t.String(),
      tokenName: t.String(),
      decimals: t.Number(),
      transferFeeBasisPoints: t.Number(),
      maximumFee: t.String(),
      metadataUri: t.String(),
      targetMarketCap: t.String(),
      poolAddress: t.String(),
    },
    {
      additionalProperties: true,
    }
  ),
  400: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  404: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  500: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
};

export const GetTokenByIdParamsSchema = t.Object({
  id: t.String(),
});

export const GetTokenByIdResponseSchema = {
  200: t.Object(
    {
      interface: t.String(),
      id: t.String(),
      content: t.Optional(
        t.Object({
          metadata: t.Optional(
            t.Object({
              name: t.Optional(t.String()),
              symbol: t.Optional(t.String()),
              description: t.Optional(t.String()),
              attributes: t.Optional(
                t.Array(
                  t.Object({
                    trait_type: t.String(),
                    value: t.String(),
                  })
                )
              ),
            })
          ),
          files: t.Optional(
            t.Array(
              t.Object({
                uri: t.String(),
                cdn_uri: t.String(),
                mime: t.String(),
              })
            )
          ),
          links: t.Optional(
            t.Object({
              image: t.Optional(t.String()),
            })
          ),
        })
      ),
      grouping: t.Optional(
        t.Array(
          t.Object({
            group_key: t.String(),
            group_value: t.String(),
          })
        )
      ),
      ownership: t.Optional(
        t.Object({
          owner: t.Optional(t.String()),
        })
      ),
      token_info: t.Optional(
        t.Object({
          supply: t.Optional(t.Number()),
          decimals: t.Optional(t.Number()),
          token_program: t.Optional(t.String()),
          mint_authority: t.Optional(t.String()),
          freeze_authority: t.Optional(t.String()),
        })
      ),
      mint_extensions: t.Optional(
        t.Object({
          transfer_fee_config: t.Optional(
            t.Object({
              newer_transfer_fee: t.Optional(
                t.Object({
                  transfer_fee_basis_points: t.Optional(t.Number()),
                })
              ),
            })
          ),
        })
      ),
    },
    {
      additionalProperties: true,
    }
  ),
  400: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  404: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  500: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  502: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
};

export const GetTokenBalanceQuerySchema = t.Object({
  wallet: t.String(),
  mint: t.String(),
});

export const GetTokenBalanceResponseSchema = {
  200: t.Object({
    wallet: t.String(),
    mint: t.String(),
    balance: t.Object({
      amount: t.String(),
      decimals: t.Number(),
      uiAmount: t.Nullable(t.Number()),
      uiAmountString: t.String(),
    }),
    tokenAccount: t.String(),
    exists: t.Boolean(),
  }),
  400: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
  500: t.Object({
    error: t.String(),
    message: t.Optional(t.String()),
  }),
};
