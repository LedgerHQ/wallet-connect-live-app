import { Flex } from "@ledgerhq/react-ui";
import { ReactNode } from "react";
import styled from "styled-components";

type Props = {
  width?: string;
  height?: string;
  style?: React.CSSProperties;
  children: ReactNode;
};
function LogoContainer({ width, height, children, ...props }: Props) {
  return (
    <LiveAppLogoContainer
      {...props}
      width={width}
      height={height}
      data-test-id="logo"
    >
      {children}
    </LiveAppLogoContainer>
  );
}

const LiveAppLogoContainer = styled(Flex).attrs(() => ({
  borderRadius: "46px",
  alignItems: "center",
  justifyContent: "center",
}))`
  color: ${(p) => p.theme.colors.neutral.c100};
  background-color: ${(p) => p.theme.colors.background.drawer};
  box-shadow: 0 2px 24px 0 #00000014;
  width: ${(p) => p.width ?? "60px"};
  height: ${(p) => p.height ?? "60px"};
`;

export default LogoContainer;
