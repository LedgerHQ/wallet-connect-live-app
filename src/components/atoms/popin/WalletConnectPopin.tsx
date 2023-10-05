import { Flex } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import React, { ReactNode } from "react";
import styled from "styled-components";
import Popin from "./Popin";

type Props = {
  isOpen: boolean;
  children: ReactNode;
  onClose: () => void;
};

const CustomPopin = styled(Popin)`
  border-radius: 16px;
  padding: 16px;
  margin: 16px;
  background-color: ${(props) => props.theme.colors.background.drawer};
  align-items: center;
  justify-content: center;
`;

const CloseButton = styled(Flex)`
  height: 32px;
  width: 32px;
  margin-bottom: 8px;
  align-items: center;
  justify-content: center;
  align-self: flex-end;
  border-radius: 50px;
  cursor: pointer;
  background-color: ${(props) => props.theme.colors.neutral.c30};
  &:hover {
    opacity: 0.7;
  }
`;
export function WalletConnectPopin({ isOpen, children, onClose }: Props) {
  return (
    <CustomPopin isOpen={isOpen}>
      <CloseButton onClick={onClose}>
        <CloseMedium size={16} color="neutral.c100" />
      </CloseButton>
      {children}
    </CustomPopin>
  );
}
