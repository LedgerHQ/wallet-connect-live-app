import { withMaintenance } from "@/middlewares/maintenance.middleware";
import { combineMiddlewares } from "@/middlewares/utils";
import { Routes } from "./shared/navigation";

const middlewares = [withMaintenance];

export default combineMiddlewares(middlewares);

export const config = {
  matcher: [Object.values(Routes)],
};
