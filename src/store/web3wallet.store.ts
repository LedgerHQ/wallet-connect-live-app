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

export const web3walletAtom = atom((get) => {
  const core = get(coreAtom);

  // core.relayer.on("relayer_connect", () => {
  //   console.info("[web3wallet.store.ts] useEffect - relayer_connect");
  // });

  core.relayer.on("relayer_disconnect", () => {
    // console.info("[web3wallet.store.ts] useEffect - relayer_disconnect !");
    return core.relayer.restartTransport();
  });

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
