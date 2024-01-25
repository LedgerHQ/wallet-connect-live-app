import { Flex, Text, Button } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useCallback, useEffect } from "react";
import styled from "styled-components";
import { ResponsiveContainer } from "@/styles/styles";
import { device } from "@/styles/breakpoints";
import useAnalytics from "@/hooks/common/useAnalytics";
import { useNavigate } from "@tanstack/react-router";
import { TabsIndexes } from "@/shared/navigation";

const LogoContainer = styled(Flex)`
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.error.c50};
  height: 50px;
  width: 50px;
`;
const ButtonsContainer = styled(Flex)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  position: fixed;
  bottom: 0;
  @media ${device.mobile} {
    width: calc(100% - 32px);
    padding-left: 16px;
    padding-right: 16px;
  }
  @media ${device.tablet} {
    width: 100%;
    max-width: 465px;
  }
  @media ${device.desktop} {
    width: 100%;
    max-width: 465px;
  }
`;

export default function ProtocolNotSupported() {
  const { t } = useTranslation();
  const analytics = useAnalytics();
  const navigate = useNavigate();

  useEffect(() => {
    analytics.page("Wallet Connect Error Unsupported Protocol V1");
  }, []);

  const goHome = useCallback(() => {
    void navigate({ to: "/", search: { tab: TabsIndexes.Connect } });
  }, []);

  return (
    <Flex alignItems="center" flexDirection="column" height="100%" width="100%">
      <ResponsiveContainer>
        <LogoContainer>
          <CloseMedium size={32} color="background.main" />
        </LogoContainer>
        <Text
          variant="h4"
          fontWeight="medium"
          color="neutral.c100"
          mt={10}
          textAlign="center"
        >
          {t("connect.errorProtocol.title")}
        </Text>
        <Text
          variant="bodyLineHeight"
          fontWeight="medium"
          color="neutral.c80"
          mt={10}
          textAlign="center"
        >
          {t("connect.errorProtocol.desc")}
        </Text>
        <ButtonsContainer mb={6}>
          <Button
            flex={1}
            mt={12}
            onClick={goHome}
            data-test="connect-button"
            variant="main"
            size="large"
          >
            <Text fontSize="body" fontWeight="semiBold" color={"neutral.c00"}>
              {t("close")}
            </Text>
          </Button>
        </ButtonsContainer>
      </ResponsiveContainer>
    </Flex>
  );
}
