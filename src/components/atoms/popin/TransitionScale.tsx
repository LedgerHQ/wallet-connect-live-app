import { useRef } from "react";
import { CSSTransition } from "react-transition-group";
import { CSSTransitionProps } from "react-transition-group/CSSTransition";
import styled from "styled-components";
const duration = 150;
const ChildrenWrapper = styled.div`
  transition: transform ${duration}ms;

  &.transition-scale-appear {
    transform: scale(0.9);
  }

  &.transition-scale-appear-active {
    transform: scale(1);
  }

  &.transition-scale-exit {
    transform: scale(1);
  }

  &.transition-scale-exit-active {
    transform: scale(0.9);
  }
`;
type TransitionScaleProps = Partial<
  CSSTransitionProps & {
    children: React.ReactNode;
    in: boolean;
    timeout?: number;
    appear?: boolean;
    mountOnEnter?: boolean;
    unmountOnExit?: boolean;
  }
>;

const TransitionScale = ({
  children,
  in: inProp,
  timeout = duration,
  ...TransitionProps
}: TransitionScaleProps) => {
  // Using a ref to avoid StrictMode warning
  // https://github.com/reactjs/react-transition-group/issues/820#issuecomment-1248508631
  const nodeRef = useRef(null);
  return (
    <CSSTransition
      {...TransitionProps}
      in={inProp}
      timeout={timeout}
      classNames="transition-scale"
      nodeRef={nodeRef}
    >
      <ChildrenWrapper ref={nodeRef}>{children}</ChildrenWrapper>
    </CSSTransition>
  );
};

export default TransitionScale;
