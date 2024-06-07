import { Flex } from "@ledgerhq/react-ui/index";
import { StatusDot } from "../atoms/statusDot/StatusDot";
import { useAtomValue } from "jotai";
import { connectionStatusAtom, coreAtom } from "@/store/web3wallet.store";
import { useTranslation } from "react-i18next";

export default function RelayerStatus() {
  const { t } = useTranslation();
  const core = useAtomValue(coreAtom);
  const relayerStatus = useAtomValue(connectionStatusAtom);

  if (!core?.relayer) {
    return;
  }

  return (
    <Flex mt={6} justifyContent={"center"} flexDirection={"row"} columnGap={2}>
      {relayerStatus === "connected" ? (
        <StatusDot status="success">
          {t("connect.relayerStatus.connected")}
        </StatusDot>
      ) : core.relayer.connecting ? (
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
        </>
      )}
    </Flex>
  );
}
