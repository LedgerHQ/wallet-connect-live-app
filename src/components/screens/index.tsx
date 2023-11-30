import { InputMode } from "@/types/types";
import { Account, WalletInfo } from "@ledgerhq/wallet-api-client";
import { useEffect, useState } from "react";
import { accountSelector, useAccountsStore } from "@/storage/accounts.store";
import Home from "./Home";
import useAnalytics from "@/hooks/common/useAnalytics";

export type WalletConnectProps = {
  initialMode?: InputMode;
  initialURI?: string;
  accounts: Account[];
  userId: string;
  walletInfo: WalletInfo["result"];
};

export default function WalletConnect({
  initialURI,
  initialMode,
  accounts,
  userId,
  walletInfo,
}: WalletConnectProps) {
  const [uri, setUri] = useState<string | undefined>(initialURI);

  const addAccounts = useAccountsStore(accountSelector.addAccounts);
  const clearAccounts = useAccountsStore(accountSelector.clearAccounts);
  const analytics = useAnalytics();

  useEffect(() => {
    clearAccounts();
    addAccounts(accounts);
  }, [accounts]);

  useEffect(() => {
    analytics.start(userId, walletInfo);
  }, []);

  return <Home initialMode={initialMode} setUri={setUri} initialURI={uri} />;
}
