import { atom, useAtom } from "jotai";
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

export const relayerConnectionStatusAtom = atom("disconnected"); // Create a new atom to store the connection status

export const web3walletAtom = atom((get) => {
  const core = get(coreAtom);
  const [_connectionStatus, setConnectionStatus] =
    useAtom(relayerConnectionStatusAtom); // Use the connectionStatusAtom

  core.relayer.on("relayer_connect", () => {
    // connection to the relay server is established
    console.log("[web3wallet.store.ts] useEffect - relayer_connect");
    setConnectionStatus("connected"); // Update the connection status atom
  });

  core.relayer.on("relayer_disconnect", () => {
    // connection to the relay server is established
    console.log("[web3wallet.store.ts] useEffect - relayer_disconnect !");
    setConnectionStatus("disconnected"); // Update the connection status atom
    core.relayer.restartTransport(); // Restart the transport
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
