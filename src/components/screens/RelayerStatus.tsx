import { BoxedIcon, Flex, Icons } from "@ledgerhq/react-ui/index";
import { StatusDot } from "../atoms/statusDot/StatusDot";
import { useAtomValue } from "jotai";
import { web3walletAtom } from "@/store/web3wallet.store";
import { useTranslation } from "react-i18next";

export default function RelayerStatus() {
  const { t } = useTranslation();
  const web3wallet = useAtomValue(web3walletAtom);

  if (
    !web3wallet?.core?.relayer ||
    typeof web3wallet.core.relayer !== "object"
  ) {
    return;
  }

  return (
    <Flex mt={6} justifyContent={"center"} flexDirection={"row"} columnGap={2}>
      {web3wallet.core.relayer.connected ? (
        <StatusDot status="success">
          {t("connect.relayerStatus.connected")}
        </StatusDot>
      ) : web3wallet.core.relayer.connecting ? (
        <StatusDot status="loading">
          {t("connect.relayerStatus.connecting")}
        </StatusDot>
      ) : (
        <>
          <Flex>
            <StatusDot status="error">
              {t("connect.relayerStatus.offline")}
            </StatusDot>
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
