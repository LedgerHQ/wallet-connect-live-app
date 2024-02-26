import { createRoute } from "@tanstack/react-router";
import ProtocolNotSupported from "@/components/screens/ProtocolNotSupported";
import { rootRoute } from "@/routes/root";

export const protocolNotSupportedRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/protocol-not-supported",
  component: ProtocolNotSupported,
});
