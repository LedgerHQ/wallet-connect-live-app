import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from "next/server";
import { MiddlewareFactory } from "@/middlewares/types";
import { getAppConfig } from "@/middlewares/utils";
import { Routes } from "@/shared/navigation";

export const withMaintenance: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    await next(request, _next);

    const appConfig = await getAppConfig();

    if (!appConfig?.enabled) {
      request.nextUrl.pathname = Routes.Maintenance;
      return NextResponse.redirect(request.nextUrl);
    }
  };
};
