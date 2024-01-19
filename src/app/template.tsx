"use client";

import { WindowMessageTransport } from "@ledgerhq/wallet-api-client";
import { WalletAPIProvider } from "@ledgerhq/wallet-api-client-react";
import { getSimulatorTransport, profiles } from "@ledgerhq/wallet-api-simulator";
import { PropsWithChildren } from "react";

const isSimulator =
  typeof window === "undefined"
    ? false
    : new URLSearchParams(window.location.search).get("simulator");

function getWalletAPITransport() {
  if (typeof window === "undefined") {
    return {
      onMessage: undefined,
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      send: () => {},
    };
  }

  if (isSimulator) {
    return getSimulatorTransport(profiles.STANDARD);
  }

  const transport = new WindowMessageTransport();
  transport.connect();
  return transport;
}

const transport = getWalletAPITransport();

export default function Template({ children }: PropsWithChildren) {
  return <WalletAPIProvider transport={transport}>{children}</WalletAPIProvider>;
}
