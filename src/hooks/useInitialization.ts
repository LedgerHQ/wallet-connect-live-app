import { useCallback, useEffect, useState } from "react";
import { useSessionsStore, sessionSelector } from "@/storage/sessions.store";
import { createWeb3Wallet, web3wallet } from "@/helpers/walletConnect.util";

export default function useInitialization() {
  const [initialized, setInitialized] = useState(false);

  const addSessions = useSessionsStore(sessionSelector.addSessions);
  const clearSessions = useSessionsStore(sessionSelector.clearSessions);
  const onInitialize = useCallback(async () => {
    try {
      clearSessions();
      await createWeb3Wallet();

      addSessions(Object.values(web3wallet.getActiveSessions()));

      setInitialized(true);
    } catch (err: unknown) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    if (!initialized) {
      onInitialize();
    }
  }, [initialized, onInitialize]);

  return initialized;
}
