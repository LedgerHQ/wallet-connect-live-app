import { useCallback } from "react";
import { Web3Wallet } from "@walletconnect/web3wallet/dist/types/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const queryKey = ["pendingProposals"];

export function useQueryFn(web3wallet: Web3Wallet) {
  return useCallback(() => {
    return web3wallet.engine.signClient.proposal.getAll();
  }, [web3wallet]);
}

export default function usePendingProposals(web3wallet: Web3Wallet) {
  const queryFn = useQueryFn(web3wallet);

  return useSuspenseQuery({
    queryKey,
    queryFn,
  });
}
