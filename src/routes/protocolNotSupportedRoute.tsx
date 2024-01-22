import { Route } from "@tanstack/react-router";
import ProtocolNotSupported from "@/pages/protocol-not-supported";
import { rootRoute } from ".";

export const protocolNotSupportedRoute = new Route({
  getParentRoute: () => rootRoute,
  path: "/protocol-not-supported",
  component: ProtocolNotSupported,
});
