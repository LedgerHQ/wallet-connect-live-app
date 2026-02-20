import type { IWalletKit } from "@reown/walletkit";
import * as Sentry from "@sentry/react";
import type { ZodError } from "zod";

const MAX_ISSUES_IN_CONTEXT = 20;

export type ReportZodErrorParams = {
  error: ZodError;
  topic: string;
  request: { method: string };
  chainId: string;
  walletKit: IWalletKit;
};

function getDappInfo(
  walletKit: IWalletKit,
  topic: string,
): { name: string | undefined; url: string | undefined } {
  try {
    const session = walletKit.engine.signClient.session.get(topic);
    const metadata = session?.peer?.metadata;
    if (!metadata) return { name: undefined, url: undefined };
    return {
      name: typeof metadata.name === "string" ? metadata.name : undefined,
      url: typeof metadata.url === "string" ? metadata.url : undefined,
    };
  } catch {
    return { name: undefined, url: undefined };
  }
}

type SerializedIssue = {
  code: string;
  path: string;
  message: string;
  keys?: string[];
};

function buildZodValidationContext(error: ZodError): {
  issues: SerializedIssue[];
  hasUnrecognizedKeys: boolean;
} {
  const issues = error.issues.slice(0, MAX_ISSUES_IN_CONTEXT).map((issue) => {
    const path = issue.path.map(String).join(".");
    const serialized: SerializedIssue = {
      code: issue.code,
      path,
      message: issue.message,
    };
    if (
      issue.code === "unrecognized_keys" &&
      "keys" in issue &&
      Array.isArray(issue.keys)
    ) {
      serialized.keys = issue.keys;
    }
    return serialized;
  });

  const hasUnrecognizedKeys = error.issues.some(
    (i) => i.code === "unrecognized_keys",
  );

  return { issues, hasUnrecognizedKeys };
}

export function reportZodError(params: ReportZodErrorParams): void {
  const { error, topic, request, chainId, walletKit } = params;
  const { issues, hasUnrecognizedKeys } = buildZodValidationContext(error);
  const dapp = getDappInfo(walletKit, topic);

  const dappNameOrTopic = dapp.name ?? dapp.url ?? topic;

  Sentry.withScope((scope) => {
    scope.setContext("dapp", {
      topic,
      name: dapp.name,
      url: dapp.url,
    });
    scope.setContext("request", {
      method: request.method,
      chainId,
    });
    scope.setContext("zod_validation", { issues });

    scope.setTag("request_method", request.method);
    scope.setTag("chain_id", chainId);
    scope.setTag("dapp_name", dappNameOrTopic);
    scope.setTag(
      "has_unrecognized_keys",
      hasUnrecognizedKeys ? "true" : "false",
    );

    scope.setFingerprint([
      request.method,
      dappNameOrTopic,
      hasUnrecognizedKeys ? "unrecognized_keys" : "other",
    ]);

    Sentry.captureException(error);
  });
}
