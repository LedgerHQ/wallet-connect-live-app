const MANIFEST_ID = "ledger-wallet-connect";
export const DOWNLOAD_URL = "https://www.ledger.com/ledger-wallet";

/**
 * Deeplink opening this live app inside Ledger Wallet,
 * forwarding a WalletConnect `uri` if one was given so the connection can resume
 */
export function getOpenInLedgerWalletUrl(search: string) {
  const deeplink = new URL(`ledgerwallet://discover/${MANIFEST_ID}`);
  const uri = new URLSearchParams(search).get("uri");
  if (uri) {
    deeplink.searchParams.set("uri", uri);
  }
  return deeplink.toString();
}
