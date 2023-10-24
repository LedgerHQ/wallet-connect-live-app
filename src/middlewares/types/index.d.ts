import { NextMiddleware } from "next/server";

export type MiddlewareFactory = (middleware: NextMiddleware) => NextMiddleware;

export type LiveAppConfig = {
  enabled: boolean;
};
