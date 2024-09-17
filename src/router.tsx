import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { indexRoute } from "@/routes";
import { detailRoute } from "@/routes/detail";
import { updateRoute } from "@/routes/update";
import { proposalRoute } from "@/routes/proposalRoute";
import { protocolNotSupportedRoute } from "@/routes/protocolNotSupportedRoute";
import { connectRoute } from "@/routes/connect";

const routeTree = rootRoute.addChildren([
  indexRoute,
  connectRoute,
  detailRoute,
  updateRoute,
  proposalRoute,
  protocolNotSupportedRoute,
]);

export const router = createRouter({ routeTree });
