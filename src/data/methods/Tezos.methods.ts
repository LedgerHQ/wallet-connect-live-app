import { z } from "zod";

/**
 * Methods
 */
export const TEZOS_SIGNING_METHODS = {
  TEZOS_GET_ACCOUNTS: "tezos_getAccounts",
  TEZOS_SEND: "tezos_send",
  TEZOS_SIGN: "tezos_sign",
} as const;

export const tezosGetAccountsSchema = z.strictObject({}).optional();

/**
 * `operations` are Tezos RPC operation contents (transaction/delegation/…), typically
 * under-specified by the dApp (no counter/branch/fees) — the wallet estimates and forges.
 * Kept permissive: only `kind` is guaranteed; the rest is forwarded to coin-tezos verbatim.
 */
export const tezosSendSchema = z.strictObject({
  account: z.string(),
  operations: z.array(z.looseObject({ kind: z.string() })).min(1),
});

export const tezosSignSchema = z.strictObject({
  account: z.string(),
  payload: z.string(),
});

export type TezosAccount = {
  algo: string;
  address: string;
  pubkey: string;
};

/**
 * Requests specs: https://docs.reown.com/advanced/multichain/rpc-reference/tezos-rpc
 */
export type TEZOS_REQUESTS =
  | {
      method: typeof TEZOS_SIGNING_METHODS.TEZOS_GET_ACCOUNTS;
      params: z.infer<typeof tezosGetAccountsSchema>;
    }
  | {
      method: typeof TEZOS_SIGNING_METHODS.TEZOS_SEND;
      params: z.infer<typeof tezosSendSchema>;
    }
  | {
      method: typeof TEZOS_SIGNING_METHODS.TEZOS_SIGN;
      params: z.infer<typeof tezosSignSchema>;
    };

/**
 * Responses specs: https://docs.walletconnect.com/advanced/multichain/rpc-reference/tezos-rpc
 */
export type TEZOS_RESPONSES = {
  [TEZOS_SIGNING_METHODS.TEZOS_GET_ACCOUNTS]: TezosAccount[];
  [TEZOS_SIGNING_METHODS.TEZOS_SEND]: {
    operationHash: string;
  };
  [TEZOS_SIGNING_METHODS.TEZOS_SIGN]: {
    signature: string;
  };
};
