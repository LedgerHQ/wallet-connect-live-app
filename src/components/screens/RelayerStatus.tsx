import { BoxedIcon, Flex, Icons } from "@ledgerhq/react-ui/index";
import { StatusDot } from "../atoms/statusDot/StatusDot";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";

export function RelayerStatus() {
  const web3wallet = useAtomValue(web3walletAtom);

if (!web3wallet?.core?.relayer || typeof web3wallet.core.relayer !== "object") {
    return;
  }

  return (
    <Flex mt={6} justifyContent={"center"} flexDirection={"row"} columnGap={2}>
      {web3wallet.core.relayer.connected ? (
        <StatusDot status="success">Ready to connect</StatusDot>
      ) : web3wallet.core.relayer.connecting ? (
        <StatusDot status="loading">
          Connecting to wallet connect server
        </StatusDot>
      ) : (
        <>
          <Flex>
            <StatusDot status="error">No internet connection</StatusDot>
          </Flex>
          <BoxedIcon
            Icon={Icons.NetworkWarning}
            iconColor="error.c50"
            size={28}
            variant="circle"
            borderColor="transparent"
          />
        </>
      )}
    </Flex>
  );
}
