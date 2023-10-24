import { get } from "@vercel/edge-config";
import { NextMiddleware, NextResponse } from "next/server";
import { LiveAppConfig, MiddlewareFactory } from "../types";
import packageInfo from "package.json";

/**
 * https://stackoverflow.com/questions/76603369/how-to-use-multiple-middlewares-in-next-js-using-the-middleware-ts-file
 * @param functions
 * @param index
 */
export function combineMiddlewares(functions: MiddlewareFactory[] = [], index = 0): NextMiddleware {
  const current = functions[index];
  if (current) {
    const next = combineMiddlewares(functions, index + 1);
    return current(next);
  }
  return () => NextResponse.next();
}

export const getAppConfig = async (): Promise<LiveAppConfig | undefined> => {
  return await get(packageInfo.name);
};
