import { Container } from "@/styles/styles";
import { Logo } from "@/icons/LedgerLiveLogo";
import LogoContainer from "@/components/atoms/logoContainers/LedgerLogoContainer";
import { useTheme } from "styled-components";
import { Flex } from "@ledgerhq/react-ui";
import {
  WalletConnectMedium,
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
          <LogoContainer width="46px" height="46px">
            <Logo size={22} />
          </LogoContainer>
          {error && (
            <>
              <Flex
                flexDirection="row"
                width="17px"
                height="2px"
                backgroundColor="neutral.c30"
              ></Flex>
              <LogoContainer width="40px" height="40px">
                <CloseMedium size={20} color="error.c50" />
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
              transform: !error ? "translateX(-10px)" : "",
            }}
          >
            <LogoContainer width="50px" height="50px">
              <div
                style={{
                  position: "absolute",
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  transform: "translateX(-4px)",
                  zIndex: -1,
                  border: `4px solid ${colors.background.main}`,
                }}
              ></div>
              <img
                src={iconProposer}
                alt="Picture of the proposer"
                width={50}
                style={{
                  borderRadius: "50%",
                }}
                height={50}
              />
            </LogoContainer>
          </Flex>
        </Flex>
      </Container>
    );
  }
  return (
    <LogoContainer>
      <WalletConnectMedium size={30} />
    </LogoContainer>
  );
}
