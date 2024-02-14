import { atom } from "jotai";
import {
  WalletAPIClient,
  WindowMessageTransport,
} from "@ledgerhq/wallet-api-client";
import { atomWithSuspenseQuery } from "jotai-tanstack-query";
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

export const walletAPIuserIdAtom = atomWithSuspenseQuery((get) => {
  const client = get(walletAPIClientAtom);
  return {
    queryKey: ["userId", client.notify], // TODO: have a better way to differentiate clients
    queryFn: async () => {
      const client = get(walletAPIClientAtom);
      return client.wallet.userId();
    },
  };
});

export const walletAPIwalletInfoAtom = atomWithSuspenseQuery((get) => {
  const client = get(walletAPIClientAtom);
  return {
    queryKey: ["walletInfo", client.notify], // TODO : have a better way to differentiate clients
    queryFn: async () => {
      const client = get(walletAPIClientAtom);
      return client.wallet.info();
    },
  };
});
