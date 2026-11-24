import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { reportSessionError } from "./analytics/sessionErrorReporter";
import { handleXrpRequest } from "./Ripple";
import * as utils from "./utils";

vi.mock("./analytics/sessionErrorReporter", () => ({
  reportSessionError: vi.fn(),
}));

vi.mock("./utils", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./utils")>()),
  acceptRequest: vi.fn(),
  rejectRequest: vi.fn(),
}));

describe("handleXrpRequest", () => {
  const address = "rPT1Sjq2YGrBMTttX4GZHjKu9dyfzbpAYe";
  const account = {
    id: "xrp-account-id",
    address,
    currency: "ripple",
  } as Account;
  const walletKit = {} as IWalletKit;
  const topic = "topic";
  const id = 1;
  const chainId = "xrpl:0";
  const request = {
    method: RIPPLE_SIGNING_METHODS.RIPPLE_SIGN_TRANSACTION,
    params: {
      tx_json: {
        TransactionType: "Payment",
        Account: address,
        Destination: address,
        Amount: "1000",
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports the error and rejects the request when the user cancels signing", async () => {
    const cancel = new Error("Canceled by user");
    const client = {
      transaction: { signRaw: vi.fn(() => Promise.reject(cancel)) },
    } as unknown as WalletAPIClient;

    await handleXrpRequest(
      request,
      topic,
      id,
      chainId,
      [account],
      client,
      walletKit,
    );

    expect(reportSessionError).toHaveBeenCalledTimes(1);
    expect(reportSessionError).toHaveBeenCalledWith(walletKit, cancel);
    expect(utils.rejectRequest).toHaveBeenCalledWith(
      walletKit,
      topic,
      id,
      utils.Errors.txDeclined,
    );
  });

  it("rethrows errors that are not a cancellation without reporting them", async () => {
    const failure = new Error("Network failure");
    const client = {
      transaction: { signRaw: vi.fn(() => Promise.reject(failure)) },
    } as unknown as WalletAPIClient;

    await expect(
      handleXrpRequest(
        request,
        topic,
        id,
        chainId,
        [account],
        client,
        walletKit,
      ),
    ).rejects.toThrow(failure);

    expect(reportSessionError).not.toHaveBeenCalled();
    expect(utils.rejectRequest).not.toHaveBeenCalled();
  });
});
