import { atom } from "jotai";
import {
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
// import {
//   getSimulatorTransport,
//   profiles,
// } from "@ledgerhq/wallet-api-simulator";

// const isSimulator =
//   typeof window === "undefined"
//     ? false
//     : new URLSearchParams(window.location.search).get("simulator");

export const transportAtom = atom(() => {
  if (typeof window === "undefined") {
    return {
      onMessage: undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      send: () => {},
    };
  }

  // if (import.meta.env.VITE_TEST === "playwright") {
  // return getSimulatorTransport(profiles.STANDARD);
  // }

  const transport = new WindowMessageTransport();
  transport.connect();
  return transport;
});

export const walletAPIClientAtom = atom((get) => {
  const transport = get(transportAtom);

  return new WalletAPIClient(transport);
});
