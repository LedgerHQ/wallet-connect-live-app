import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { indexRoute } from "@/routes";
import { detailRoute } from "@/routes/detail";
import { proposalRoute } from "@/routes/proposalRoute";
import { protocolNotSupportedRoute } from "@/routes/protocolNotSupportedRoute";
import { connectRoute } from "@/routes/connect";
import { oneCllickAuthRoute } from "@/routes/oneCllickAuthRoute";

const routeTree = rootRoute.addChildren([
  indexRoute,
  connectRoute,
  detailRoute,
  proposalRoute,
  oneCllickAuthRoute,
  protocolNotSupportedRoute,
]);

export const router = createRouter({ routeTree });
