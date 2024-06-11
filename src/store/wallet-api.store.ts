import { atom } from "jotai";
import {
  Currency,
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
import { getSimulatorTransport } from "@ledgerhq/wallet-api-simulator/lib-es/transport";
import { standardProfile } from "@ledgerhq/wallet-api-simulator/lib-es/profiles/standard";

function getIsSimulator() {
  if (
    import.meta.env.VITEST === "true" ||
    import.meta.env.VITE_TEST === "playwright"
  ) {
    return true;
  }

  if (typeof window === "undefined") {
    return false;
  }

  return new URLSearchParams(window.location.search).get("simulator");
}

const isSimulator = getIsSimulator();

export const transportAtom = atom(() => {
  if (typeof window === "undefined") {
    return {
      onMessage: undefined,
      send: () => {
        // comment to avoid empty fn lint error
      },
    };
  }

  if (isSimulator) {
    return getSimulatorTransport(standardProfile);
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

export const walletInfosAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.wallet.info();
});

export const walletUserIdAtom = atom((get) => {
  const client = get(walletAPIClientAtom);
  return client.wallet.userId();
});
