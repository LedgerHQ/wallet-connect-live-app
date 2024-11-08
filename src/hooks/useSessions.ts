import { useCallback } from "react";
import { useSuspenseQuery } from "@tanstack/react-query";
import type { IWalletKit } from "@reown/walletkit";

export const queryKey = ["sessions"];

export function useQueryFn(walletKit: IWalletKit) {
  return useCallback(() => {
    return walletKit.engine.signClient.session.getAll();
  }, [walletKit]);
}

export default function useSessions(walletKit: IWalletKit) {
  const queryFn = useQueryFn(walletKit);

  return useSuspenseQuery({
    queryKey,
    queryFn,
  });
}
