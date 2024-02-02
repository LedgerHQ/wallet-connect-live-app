import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { indexRoute } from "@/routes";
import { detailRoute } from "@/routes/detail";
import { proposalRoute } from "@/routes/proposalRoute";
import { protocolNotSupportedRoute } from "@/routes/protocolNotSupportedRoute";

const routeTree = rootRoute.addChildren([
  indexRoute,
  detailRoute,
  proposalRoute,
  protocolNotSupportedRoute,
]);

export const router = createRouter({ routeTree });
