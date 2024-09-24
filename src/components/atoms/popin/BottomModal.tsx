import styled from "styled-components";

import { Flex } from "@ledgerhq/react-ui";
import { CloseMedium } from "@ledgerhq/react-ui/assets/icons";
import TransitionInOut from "./TransitionInOut";
import TransitionScale from "./TransitionScale";

export type PopinProps = {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

const Wrapper = styled(Flex).attrs((p) => ({
  borderTopLeftRadius: "16px",
  borderTopRightRadius: "16px",
  padding: "16px",
  backgroundColor: "background.drawer",
  alignItems: "center",
  justifyContent: "center",

  flexDirection: "column",
  zIndex: p.theme.zIndexes[8],
}))``;

const Overlay = styled(Flex).attrs((p) => ({
  justifyContent: "end",
  alignItems: "end",
  width: "100vw",
  height: "100vh",
  zIndex: p.theme.zIndexes[8],
  position: "fixed",
  top: 0,
  left: 0,
  backgroundColor: "constant.overlay",
}))``;

const Popin = ({ isOpen, children, onClose, ...props }: PopinProps) => (
  <TransitionInOut in={isOpen} appear mountOnEnter unmountOnExit>
    <Overlay onClick={onClose}>
      <TransitionScale in={isOpen} appear>
        <Wrapper {...props}>{children}</Wrapper>
      </TransitionScale>
    </Overlay>
  </TransitionInOut>
);

type Props = {
  isOpen: boolean;
  children: React.ReactNode;
  onClose: () => void;
};

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
export function BottomModal({ isOpen, children, onClose }: Readonly<Props>) {
  return (
    <Popin isOpen={isOpen} onClose={onClose}>
      <CloseButton onClick={onClose} data-testid="close-button">
        <CloseMedium size={16} color="neutral.c100" />
      </CloseButton>
      {children}
    </Popin>
  );
}
