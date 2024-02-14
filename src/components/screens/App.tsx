import { ResponsiveContainer } from "@/styles/styles";
import { web3walletAtom } from "@/store/web3wallet.store";
import Sessions from "./Sessions";
import { useAtomValue } from "jotai";
import useSessions from "@/hooks/useSessions";
import { WalletConnectContainer } from "../atoms/containers/Elements";
import { useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";

export default function App() {
  const navigate = useNavigate({ from: "/" });
  const web3wallet = useAtomValue(web3walletAtom);
  const sessions = useSessions(web3wallet);
  const hasSessions = !!sessions.data.length;

  useEffect(() => {
    if (!hasSessions) {
      void navigate({ to: "/connect", search: (search) => search });
    }
  }, [hasSessions, navigate]);

  if (!hasSessions) {
    return null;
  }

  return (
    <WalletConnectContainer>
      <ResponsiveContainer>
        <Sessions />
      </ResponsiveContainer>
    </WalletConnectContainer>
  );
}
