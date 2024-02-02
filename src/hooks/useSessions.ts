import { useCallback } from "react";
import { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const queryKey = ["sessions"];

export default function useSessions(web3wallet: Web3Wallet) {
  return useSuspenseQuery({
    queryKey,
    queryFn: useCallback(() => {
      return web3wallet.engine.signClient.session.getAll();
    }, [web3wallet]),
  });
}
