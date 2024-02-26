import { Flex, Text } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { useTranslation } from "react-i18next";
import { useEffect } from "react";
import useAnalytics from "@/hooks/useAnalytics";
import styled from "styled-components";

const LogoContainer = styled(Flex)`
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.error.c50};
  height: 50px;
  width: 50px;
`;

export function ErrorFallback() {
  const { t } = useTranslation();
  const analytics = useAnalytics();

  useEffect(() => {
    analytics.page("WalletConnect ErrorBoundary Page");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Flex
      alignItems="center"
      justifyContent="center"
      flexDirection="column"
      flex={1}
    >
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
        {t("errorBoundary.title")}
      </Text>
      <Text
        variant="bodyLineHeight"
        fontWeight="medium"
        color="neutral.c80"
        mt={10}
        textAlign="center"
      >
        {t("errorBoundary.desc")}
      </Text>
    </Flex>
  );
}
