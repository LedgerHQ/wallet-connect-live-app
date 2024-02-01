import { useMemo } from "react";
import { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";

export default function useSessions(web3wallet: Web3Wallet) {
  return useMemo(() => {
    return Object.values(web3wallet.getActiveSessions());
  }, [web3wallet]);
}
