import { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";

// Created to have a stable ref in case of undefined accounts data
const initialAccounts: Account[] = [];

export const queryKey = ["accounts"];

export default function useAccounts(client: WalletAPIClient) {
  const getAccounts = useCallback(() => {
    return client.account.list();
  }, [client]);

  return useQuery({
    queryKey,
    queryFn: getAccounts,
    initialData: initialAccounts,
  });
}
