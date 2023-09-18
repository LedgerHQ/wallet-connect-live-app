import { Flex } from "@ledgerhq/react-ui";
import React, { ReactNode } from "react";
import styled from "styled-components";

type Props = {
  children: ReactNode;
};
function LogoContainer(props: Props) {
  return <LiveAppLogoContainer data-test-id="logo">{props.children}</LiveAppLogoContainer>;
}

const LiveAppLogoContainer = styled(Flex).attrs(() => ({
  borderRadius: "46px",
  alignItems: "center",
  justifyContent: "center",
}))`
  color: ${(p) => p.theme.colors.neutral.c100};
  background-color: ${(p) => p.theme.colors.background.drawer};
  box-shadow: 0 2px 24px 0 #00000014;
  width: ${(p) => (p.width ? p.width : "60px")};
  height: ${(p) => (p.height ? p.height : "60px")};
`;

export default LogoContainer;
