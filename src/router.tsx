import { createRouter } from "@tanstack/react-router";
import { rootRoute } from "@/routes/root";
import { indexRoute } from "@/routes";
import { detailRoute } from "@/routes/detail";
import { detailEditRoute } from "@/routes/detailEditRoute";
import { proposalRoute } from "@/routes/proposalRoute";
import { protocolNotSupportedRoute } from "@/routes/protocolNotSupportedRoute";
import { connectRoute } from "@/routes/connect";
import { oneClickAuthRoute } from "@/routes/oneClickAuthRoute";

const routeTree = rootRoute.addChildren([
  indexRoute,
  connectRoute,
  detailRoute,
  detailEditRoute,
  proposalRoute,
  oneClickAuthRoute,
  protocolNotSupportedRoute,
]);

export const router = createRouter({ routeTree });
