import { useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { IWalletKit } from "@reown/walletkit";

export const queryKey = ["pendingProposals"];

export function useQueryFn(walletKit: IWalletKit) {
  return useCallback(() => {
    return walletKit.engine.signClient.proposal.getAll();
  }, [walletKit]);
}

export default function usePendingProposals(walletKit: IWalletKit) {
  const queryFn = useQueryFn(walletKit);

  return useSuspenseQuery({
    queryKey,
    queryFn,
  });
}
