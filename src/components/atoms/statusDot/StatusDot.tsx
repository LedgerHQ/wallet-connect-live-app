import { Flex, Text } from "@ledgerhq/react-ui";
import { ReactNode } from "react";
import styled from "styled-components";
import "./styles.css";

type Props = {
  children: ReactNode;
  status: "success" | "loading" | "error";
};

export function StatusDot({ children, status }: Props) {
  const dotClass = `dot-${status}`;
  let textColor = "neutral.c50"; //status === "error" ? "error.c50" : "success.c50";
  if (status === "success") {
    textColor = "success.c50";
  } else if (status === "error") {
    textColor = "error.c50";
  }
  return (
    <div className="status-container">
      <div className={"dot " + dotClass}></div>
      <div className="text">
        <Text variant="paragraph" fontSize={"10px"} color={textColor}>
          {children}
        </Text>
      </div>
    </div>
  );
}
