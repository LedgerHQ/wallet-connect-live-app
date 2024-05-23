import { Text } from "@ledgerhq/react-ui";
import { ReactNode } from "react";
import "./styles.css";

type Props = {
  children: ReactNode;
  status: "success" | "loading" | "error";
};

export function StatusDot({ children, status }: Props) {
  let textColor = "neutral.c50";

  if (status === "success") {
    textColor = "success.c50";
  } else if (status === "error") {
    textColor = "error.c50";
  }

  return (
    <div className="status-container">
      <div className={"dot " + `dot-${status}`}></div>
      <Text variant="paragraph" fontSize={"10px"} color={textColor}>
        {children}
      </Text>
    </div>
  );
}
