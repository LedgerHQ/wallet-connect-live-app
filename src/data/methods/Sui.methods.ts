import { z } from "zod";

/**
 * Methods
 *
 * `sui_signPersonalMessage` is listed so the namespace is approved whichever methods the dApp
 * marks as required; the handler declines it with 5101 because the Wallet API has no Sui
 * message signing.
 */
export const SUI_SIGNING_METHODS = {
  SUI_GET_ACCOUNTS: "sui_getAccounts",
  SUI_SIGN_TRANSACTION: "sui_signTransaction",
  SUI_SIGN_AND_EXECUTE_TRANSACTION: "sui_signAndExecuteTransaction",
  SUI_SIGN_PERSONAL_MESSAGE: "sui_signPersonalMessage",
} as const;

export const suiGetAccountsSchema = z.strictObject({}).optional();

/**
 * `transaction` is either `Transaction.toJSON()` (a JSON string) or the base64 of BCS
 * `TransactionData`. Both are strings and the wallet parses them, so it is forwarded unchanged.
 */
export const suiSignTransactionSchema = z.strictObject({
  transaction: z.string().min(1),
  address: z.string(),
});

export const suiSignAndExecuteTransactionSchema = suiSignTransactionSchema;

export type SuiAccount = {
  address: string;
  /** Base64 of the raw 32-byte Ed25519 public key. */
  pubkey: string;
};

export type SuiSignTransactionResponse = {
  transactionBytes: string;
  signature: string;
};

/**
 * Requests and responses as the Mysten WalletConnect adapter sends and reads them:
 * https://github.com/MystenLabs/ts-sdks/blob/main/packages/walletconnect-wallet/src/wallet/index.ts
 */
export type SUI_REQUESTS =
  | {
      method: typeof SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS;
      params: z.infer<typeof suiGetAccountsSchema>;
    }
  | {
      method: typeof SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION;
      params: z.infer<typeof suiSignTransactionSchema>;
    }
  | {
      method: typeof SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION;
      params: z.infer<typeof suiSignAndExecuteTransactionSchema>;
    }
  | {
      method: typeof SUI_SIGNING_METHODS.SUI_SIGN_PERSONAL_MESSAGE;
      params: unknown;
    };

export type SUI_RESPONSES = {
  [SUI_SIGNING_METHODS.SUI_GET_ACCOUNTS]: SuiAccount[];
  [SUI_SIGNING_METHODS.SUI_SIGN_TRANSACTION]: SuiSignTransactionResponse;
  [SUI_SIGNING_METHODS.SUI_SIGN_AND_EXECUTE_TRANSACTION]: { digest: string };
};
