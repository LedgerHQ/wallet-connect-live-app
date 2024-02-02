import { WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useCallback } from "react";

export const queryKey = ["accounts"];

export default function useAccounts(client: WalletAPIClient) {
  const getAccounts = useCallback(() => {
    return client.account.list();
  }, [client]);

  return useSuspenseQuery({
    queryKey,
    queryFn: getAccounts,
  });
}
