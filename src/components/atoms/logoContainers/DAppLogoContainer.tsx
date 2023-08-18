import { Flex } from "@ledgerhq/react-ui"
import React from "react"
import styled from "styled-components"

type Props = {
  children: React.ReactNode
}
function DAppLogoContainer(props: Props) {
  return <AppLogoContainer data-test-id="logo">{props.children}</AppLogoContainer>
}

const AppLogoContainer = styled(Flex).attrs(() => ({
  borderRadius: "46px",
  alignItems: "center",
  justifyContent: "center",
}))`
  box-shadow: 0 2px 24px 0 #00000014;
  width: ${(p) => (p.width ? p.width : "60px")};
  height: ${(p) => (p.height ? p.height : "60px")};
`

export default DAppLogoContainer
