const MANIFEST_ID = "ledger-wallet-connect";
export const DOWNLOAD_URL = "https://www.ledger.com/ledger-wallet";

// Search params handled by `WalletConnectInit` at startup:
// `uri` to connect, `requestId` + `sessionTopic` to open an existing session request
const FORWARDED_PARAMS = ["uri", "requestId", "sessionTopic"];

/**
 * Deeplink opening this live app inside Ledger Wallet,
 * forwarding the WalletConnect params if given so the flow can resume
 */
export function getOpenInLedgerWalletUrl(search: string) {
  const deeplink = new URL(`ledgerwallet://discover/${MANIFEST_ID}`);
  const params = new URLSearchParams(search);
  for (const name of FORWARDED_PARAMS) {
    const value = params.get(name);
    if (value) {
      deeplink.searchParams.set(name, value);
    }
  }
  return deeplink.toString();
}
