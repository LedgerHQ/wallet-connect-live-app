import { atom } from "jotai";
import { Core } from "@walletconnect/core";
import { Web3Wallet } from "@walletconnect/web3wallet";

const relayerURL = "wss://relay.walletconnect.com";

export const coreAtom = atom(() => {
  return new Core({
    logger: "debug",
    projectId: import.meta.env.VITE_WALLETCONNECT_PROJECT_ID,
    relayUrl: relayerURL,
  });
});

export const connectionStatusAtom = atom("disconnected");

export const web3walletAtom = atom((get) => {
  const core = get(coreAtom);

  return Web3Wallet.init({
    core,
    metadata: {
      name: "Ledger Wallet",
      description: "Ledger Live Wallet with WalletConnect",
      url: "https://walletconnect.com/",
      icons: ["https://avatars.githubusercontent.com/u/37784886"],
    },
  });
});
