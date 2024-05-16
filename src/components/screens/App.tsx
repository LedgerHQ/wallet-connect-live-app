import { ResponsiveContainer } from "@/styles/styles";
import { web3walletAtom } from "@/store/web3wallet.store";
import Sessions from "./Sessions";
import { useAtomValue } from "jotai";
import useSessions from "@/hooks/useSessions";
import { WalletConnectContainer } from "../atoms/containers/Elements";
import { Navigate } from "@tanstack/react-router";
import usePendingProposals from "@/hooks/usePendingProposals";

export default function App() {
  return (
    <WalletConnectContainer>
      <ResponsiveContainer>
        <Sessions />
      </ResponsiveContainer>
    </WalletConnectContainer>
  );
}
