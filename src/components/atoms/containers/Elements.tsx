import { Flex } from "@ledgerhq/react-ui";
import styled from "styled-components";

const WalletConnectContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  background: ${({ theme }) => theme.colors.background.main};
`;

const ButtonsContainer = styled(Flex)`
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 80px;
  width: 100%;
`;

const Row = styled(Flex)``;
const List = styled.ul``;

export { ButtonsContainer, Row, List, WalletConnectContainer };
