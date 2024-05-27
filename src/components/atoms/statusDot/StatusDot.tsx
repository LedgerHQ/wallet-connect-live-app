import { Text } from "@ledgerhq/react-ui";
import { ReactNode } from "react";
import "./styles.css";

type Props = {
  children: ReactNode;
  status: "success" | "loading" | "error";
};

const colors = {
  success: "success.c50",
  error: "error.c50",
  loading: "neutral.c50",
};

export function StatusDot({ children, status }: Props) {
  let textColor = colors[status];

  return (
    <div className="status-container">
      <div className={"dot " + `dot-${status}`}></div>
      <Text variant="paragraph" fontSize={"10px"} color={textColor}>
        {children}
      </Text>
    </div>
  );
}
