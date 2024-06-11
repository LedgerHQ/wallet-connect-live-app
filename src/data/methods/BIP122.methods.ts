/**
 * Methods
 */
export const BIP122_SIGNING_METHODS = {
  BIP122_SIGN_MESSAGE: "bip122_signMessage",
} as const;

/**
 * Requests
 */
export type BIP122_REQUESTS = {
  method: typeof BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE;
  params: {
    message: string;
    address: string;
  };
};
