import { WindowMessageTransport } from "@ledgerhq/wallet-api-client";
// import {
//   getSimulatorTransport,
//   profiles,
// } from "@ledgerhq/wallet-api-simulator";

// const isSimulator =
//   typeof window === "undefined"
//     ? false
//     : new URLSearchParams(window.location.search).get("simulator");

// TODO maybe migrate to jotai ?
export function getWalletAPITransport() {
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
}
