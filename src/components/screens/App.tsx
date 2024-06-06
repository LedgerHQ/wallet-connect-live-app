import { ResponsiveContainer } from "@/styles/styles";
import Sessions from "./Sessions";
import { WalletConnectContainer } from "../atoms/containers/Elements";

export default function App() {
  return (
    <WalletConnectContainer>
      <ResponsiveContainer>
        <Sessions />
      </ResponsiveContainer>
    </WalletConnectContainer>
  );
}
