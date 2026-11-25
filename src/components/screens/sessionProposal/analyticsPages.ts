export const UNSUPPORTED_BLOCKCHAINS_PAGE =
  "Wallet Connect Error Unsupported Blockchains" as const;

export const MISSING_REQUIRED_ACCOUNT_PAGE =
  "Wallet Connect Error Missing Required Account" as const;

export type AnalyticsPage =
  | typeof UNSUPPORTED_BLOCKCHAINS_PAGE
  | typeof MISSING_REQUIRED_ACCOUNT_PAGE;
