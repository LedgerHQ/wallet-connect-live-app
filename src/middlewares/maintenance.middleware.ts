import { NextFetchEvent, NextMiddleware, NextRequest, NextResponse } from "next/server";
import { MiddlewareFactory } from "@/middlewares/types";
import { getAppConfig } from "@/middlewares/utils";
import { Routes } from "@/shared/navigation";

export const withMaintenance: MiddlewareFactory = (next: NextMiddleware) => {
  return async (request: NextRequest, _next: NextFetchEvent) => {
    await next(request, _next);

    //Filter requests only on our routes to avoid fetching EdgeConfig every time and limit quota consumption.
    if (
      Object.values(Routes)
        .map((e) => e.toString())
        .includes(request.nextUrl.pathname)
    ) {
      const appConfig = await getAppConfig();

      if (!appConfig?.enabled) {
        request.nextUrl.pathname = Routes.Maintenance;
        return NextResponse.rewrite(request.nextUrl);
      }
      if (appConfig?.enabled && request.nextUrl.pathname === Routes.Maintenance) {
        request.nextUrl.pathname = Routes.Home;
        return NextResponse.rewrite(request.nextUrl);
      }
    }
  };
};
