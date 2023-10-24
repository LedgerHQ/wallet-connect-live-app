import { ResponsiveContainer } from "@/styles/styles";
import { Flex, StyleProvider, Text } from "@ledgerhq/react-ui";
import { useTranslation } from "next-i18next";
import { useEffect, useMemo } from "react";
import styled, { useTheme } from "styled-components";
import useAnalytics from "@/hooks/common/useAnalytics";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import { ThemeNames } from "@ledgerhq/react-ui/styles";
import { useRouter } from "next/router";

export { getServerSideProps } from "@/lib/serverProps";

const LogoContainer = styled(Flex)`
  border-radius: 50%;
  align-items: center;
  justify-content: center;
  background-color: ${(p) => p.theme.colors.error.c50};
  height: 50px;
  width: 50px;
`;

export default function Maintenance() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const analytics = useAnalytics();
  const router = useRouter();

  const theme = useMemo(() => router?.query?.theme ?? "light", [router?.query?.theme]);

  useEffect(() => {
    analytics.page("Wallet Connect Maintenance");
  }, []);

  return (
    <StyleProvider selectedPalette={theme as ThemeNames | undefined} fontsPath="/fonts">
      <Flex
        flex={1}
        alignItems="center"
        justifyContent="center"
        width="100%"
        height={"100%"}
        bg={colors.background.main}
      >
        <ResponsiveContainer>
          <Flex
            alignItems="center"
            justifyContent="center"
            flexDirection="column"
            flex={1}
            data-testid="application-disabled-container"
          >
            <LogoContainer data-testid="application-disabled-logo">
              <CloseMedium size={32} color="background.main" />
            </LogoContainer>
            <Text
              variant="h4"
              fontWeight="medium"
              color="neutral.c100"
              mt={10}
              textAlign="center"
              data-testid="application-disabled-title"
            >
              {t("applicationDisabled.title")}
            </Text>
            <Text
              variant="bodyLineHeight"
              fontWeight="medium"
              color="neutral.c80"
              mt={10}
              textAlign="center"
              data-testid="application-disabled-subtitle"
            >
              {t("applicationDisabled.desc")}
            </Text>
          </Flex>
        </ResponsiveContainer>
      </Flex>
    </StyleProvider>
  );
}
