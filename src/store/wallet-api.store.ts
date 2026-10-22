import {
  Currency,
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
import { standardProfile } from "@ledgerhq/wallet-api-simulator/lib-es/profiles/standard";
import { getSimulatorTransport } from "@ledgerhq/wallet-api-simulator/lib-es/transport";
import { atom } from "jotai";
import { getAllowedTopOrigin } from "@/utils/ledgerEnterprise";
import { TopWindowTransport } from "@/utils/topWindowTransport";

function getIsSimulator() {
  // The simulator is a dev only tool, it must never be reachable in production
  if (!import.meta.env.DEV) {
    return false;
  }

  if (
    import.meta.env.VITEST === "true" ||
    import.meta.env.VITE_TEST === "playwright"
  ) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return Boolean(new URLSearchParams(window.location.search).get("simulator"));
}

const isSimulator = getIsSimulator();

function isInIframe(win: Window) {
  try {
    return win.self !== win.top;
  } catch {
    // Accessing `top` can throw when the parent is cross-origin, which means we are framed
    return true;
  }
}

// Ledger Wallet injects these bridges before the app scripts run:
// - desktop: `ElectronWebview` exposed by the webview preloader
// - mobile: `ReactNativeWebView` injected by react-native-webview
function hasWebviewBridge(win: Window) {
  return Boolean(win.ElectronWebview ?? win.ReactNativeWebView);
}

// iframe (e.g. Ledger Enterprise): no bridge, the transport posts to `window.top`,
// only when every embedding origin is allowed
export function getIframeHostOrigin(win: Window) {
  if (hasWebviewBridge(win) || !isInIframe(win)) {
    return undefined;
  }
  return getAllowedTopOrigin(win);
}

export function detectLedgerWalletHost(win: Window) {
  return hasWebviewBridge(win) || getIframeHostOrigin(win) !== undefined;
}

const iframeHostOrigin =
  typeof window !== "undefined" ? getIframeHostOrigin(window) : undefined;

export const isInLedgerWallet =
  isSimulator ||
  (typeof window !== "undefined" && detectLedgerWalletHost(window));

export const transportAtom = atom(() => {
  if (typeof window === "undefined") {
    return {
      onMessage: undefined,
      send: () => {
        // comment to avoid empty fn lint error
      },
    };
  }

  // `import.meta.env.DEV` is statically replaced so the simulator is stripped from prod bundles
  if (import.meta.env.DEV && isSimulator) {
    return getSimulatorTransport(standardProfile);
  }

  if (iframeHostOrigin) {
    const transport = new TopWindowTransport(window, iframeHostOrigin);
    transport.connect();
    return transport;
  }

  const transport = new WindowMessageTransport();
  transport.connect();
  return transport;
});

export const walletAPIClientAtom = atom((get) => {
  const transport = get(transportAtom);

  return new WalletAPIClient(transport);
});

export const walletCurrenciesAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.currency.list();
});

export const walletCurrenciesByIdAtom = atom(async (get) => {
  const currencies = await get(walletCurrenciesAtom);
  return currencies.reduce<Record<string, Currency>>((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
});

export const walletInfoAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.wallet.info();
});

export const walletCapabilitiesAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.wallet.capabilities();
});

export const walletUserIdAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.wallet.userId();
});
