import type { WalletAPIClient } from "@ledgerhq/wallet-api-client";

/**
 * Ledger Wallet groups sign requests by this `meta` key, and `custom.signature.cancel` cancels
 * the pending ones of a group. Each WalletConnect session is a group, keyed by its topic.
 */
const REQUEST_GROUP_META_KEY = "requestGroupId";
const SIGNATURE_CANCEL_METHOD = "custom.signature.cancel";
const SIGNATURE_REQUEST_CANCELLED_ERROR_NAME = "SignatureRequestCancelled";

type Meta = Record<string, unknown>;

/** Position of the `meta` argument of each sign method of the client. */
const META_ARGUMENT_INDEX = {
  transaction: { sign: 3, signAndBroadcast: 3, signRaw: 4 },
  message: { sign: 3 },
} as const;

type Module = keyof typeof META_ARGUMENT_INDEX;

function isModule(property: PropertyKey): property is Module {
  return typeof property === "string" && property in META_ARGUMENT_INDEX;
}

function withMeta(args: unknown[], index: number, meta: Meta): unknown[] {
  const callArgs = [...args];
  while (callArgs.length < index) callArgs.push(undefined);
  const callerMeta = callArgs[index];
  callArgs[index] = {
    ...(typeof callerMeta === "object" && callerMeta !== null
      ? callerMeta
      : {}),
    ...meta,
  };
  return callArgs;
}

/** The error a sign request of a disconnected dApp rejects with. */
function createSignatureRequestCancelledError(): Error {
  const error = new Error("The dApp disconnected before the sign request");
  error.name = SIGNATURE_REQUEST_CANCELLED_ERROR_NAME;
  return error;
}

function scopeModule<T extends object>(
  module: T,
  indexes: Readonly<Record<string, number>>,
  meta: Meta,
  isCancelled: () => boolean,
): T {
  return new Proxy(module, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      const index =
        typeof property === "string" ? indexes[property] : undefined;
      if (index === undefined || typeof value !== "function") return value;
      return (...args: unknown[]): unknown => {
        // Ledger Wallet only cancels the sign requests already pending: one sent later (after
        // an async preparation, or the next of a batch) must not open a drawer for a gone dApp.
        if (isCancelled()) {
          return Promise.reject(createSignatureRequestCancelledError());
        }
        return Reflect.apply(value, target, withMeta(args, index, meta));
      };
    },
  });
}

/**
 * The client a WalletConnect session request is handled with: its sign requests carry the
 * session topic, so Ledger Wallet can cancel them when the dApp disconnects, and once
 * `isCancelled` returns true (the session was deleted) they reject without reaching it.
 */
export function withSignatureRequestGroup(
  client: WalletAPIClient,
  topic: string,
  isCancelled: () => boolean = () => false,
): WalletAPIClient {
  const meta = { [REQUEST_GROUP_META_KEY]: topic };
  return new Proxy(client, {
    get(target, property, receiver) {
      const value: unknown = Reflect.get(target, property, receiver);
      if (!isModule(property) || typeof value !== "object" || value === null) {
        return value;
      }
      return scopeModule(
        value,
        META_ARGUMENT_INDEX[property],
        meta,
        isCancelled,
      );
    },
  });
}

/**
 * Cancels the sign requests of a WalletConnect session still pending in Ledger Wallet.
 * Resolves `false` when Ledger Wallet cannot cancel them (an older version, or a manifest
 * without the permission): the ones already pending then wait for the user as before, while
 * later ones are not sent at all (see `withSignatureRequestGroup`), since the deleted session
 * cannot receive their result.
 */
export async function cancelSignatureRequests(
  client: WalletAPIClient,
  topic: string,
): Promise<boolean> {
  try {
    await client.request(SIGNATURE_CANCEL_METHOD, {
      [REQUEST_GROUP_META_KEY]: topic,
    });
    return true;
  } catch {
    return false;
  }
}

/** The error a sign request rejects with once Ledger Wallet cancelled it. */
export function isSignatureRequestCancelledError(error: unknown): boolean {
  return (
    error instanceof Error &&
    error.name === SIGNATURE_REQUEST_CANCELLED_ERROR_NAME
  );
}
