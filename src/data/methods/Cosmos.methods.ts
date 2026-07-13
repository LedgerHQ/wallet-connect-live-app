import { z } from "zod";

/**
 * Methods
 *
 * Only the amino methods are advertised: coin-cosmos signs amino `StdSignDoc`s exclusively.
 * `cosmos_signDirect` (protobuf) is intentionally omitted so `buildCosmosNamespace` never
 * negotiates it; the handler rejects it with 5101 if a dApp sends it anyway.
 */
export const COSMOS_SIGNING_METHODS = {
  COSMOS_GET_ACCOUNTS: "cosmos_getAccounts",
  COSMOS_SIGN_AMINO: "cosmos_signAmino",
} as const;

export const cosmosGetAccountsSchema = z.strictObject({}).optional();

/**
 * Amino `StdSignDoc`. Kept permissive (`looseObject`) — coin-cosmos re-validates the structure
 * and signs the canonical serialized bytes verbatim, so we only strictly need `signerAddress`
 * to resolve the account. The guaranteed fields mirror coin-cosmos's own `assertValidStdSignDoc`.
 */
export const cosmosSignAminoSchema = z.strictObject({
  signerAddress: z.string(),
  signDoc: z.looseObject({
    chain_id: z.string(),
    account_number: z.string(),
    sequence: z.string(),
    fee: z.looseObject({
      amount: z.array(z.unknown()),
      gas: z.string(),
    }),
    msgs: z.array(z.unknown()).min(1),
    memo: z.string(),
  }),
});

export type CosmosAccount = {
  algo: string;
  address: string;
  pubkey: string;
};

export type CosmosSignAminoResponse = {
  signature: {
    pub_key: { type: string; value: string };
    signature: string;
  };
  signed: unknown;
};

/**
 * Requests specs: https://docs.reown.com/advanced/multichain/rpc-reference/cosmos-rpc
 */
export type COSMOS_REQUESTS =
  | {
      method: typeof COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS;
      params: z.infer<typeof cosmosGetAccountsSchema>;
    }
  | {
      method: typeof COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO;
      params: z.infer<typeof cosmosSignAminoSchema>;
    };

/**
 * Responses specs: https://docs.reown.com/advanced/multichain/rpc-reference/cosmos-rpc
 */
export type COSMOS_RESPONSES = {
  [COSMOS_SIGNING_METHODS.COSMOS_GET_ACCOUNTS]: CosmosAccount[];
  [COSMOS_SIGNING_METHODS.COSMOS_SIGN_AMINO]: CosmosSignAminoResponse;
};
