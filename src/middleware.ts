import { withMaintenance } from "@/middlewares/maintenance.middleware";
import { combineMiddlewares } from "@/middlewares/utils";

const middlewares = [withMaintenance];

export default combineMiddlewares(middlewares);

export const config = {
  matcher: ["/"],
  runtime: "edge",
};
