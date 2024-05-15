import { Container } from "@/styles/styles";
import { Logo } from "@/icons/LedgerLiveLogo";
import LogoContainer from "@/components/atoms/logoContainers/LedgerLogoContainer";
import styled, { useTheme } from "styled-components";
import { Flex, Button, Box, Text } from "@ledgerhq/react-ui";
import {
  WalletConnectMedium,
  CircledCrossSolidMedium,
  ArrowLeftMedium,
  CloseMedium,
} from "@ledgerhq/react-ui/assets/icons";

type Props = {
  iconProposer: string | null;
  error?: boolean;
};
export default function LogoHeader({ iconProposer, error }: Props) {
  const { colors } = useTheme();

  if (iconProposer) {
    return (
      <Container>
        <Flex flexDirection="row" alignItems="center" justifyContent="center">
          <LogoContainer>
            <Logo size={30} />
          </LogoContainer>
          {error && (
            <>
              <Flex
                flexDirection="row"
                width="17px"
                height="2px"
                backgroundColor="neutral.c30"
              ></Flex>
              <LogoContainer>
                <CloseMedium size={32} color="error.c50" />
              </LogoContainer>
              <Flex
                flexDirection="row"
                width="17px"
                height="2px"
                backgroundColor="neutral.c30"
              ></Flex>
            </>
          )}
          <Flex
            style={{
              transform: !error ? "translateX(-26px)" : "",
            }}
          >
            <LogoContainer>
              <img
                src={iconProposer}
                alt="Picture of the proposer"
                width={45}
                style={{
                  borderRadius: "50%",
                  borderLeft: `3px solid ${colors.background.main}`,
                }}
                height={45}
              />
            </LogoContainer>
          </Flex>
        </Flex>
      </Container>
    );
  } else {
    return (
      <LogoContainer>
        <WalletConnectMedium size={30} />
      </LogoContainer>
    );
  }
}

const DAppContainer = styled(Flex).attrs(
  (p: { size: number; borderColor: string; backgroundColor: string }) => ({
    borderRadius: 50.0,
    border: `3px solid ${p.borderColor}`,
    backgroundColor: p.backgroundColor,
    zIndex: 0,
  }),
)<{ size: number }>``;
