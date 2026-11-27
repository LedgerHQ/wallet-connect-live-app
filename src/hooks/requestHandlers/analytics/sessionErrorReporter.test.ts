import type { IWalletKit } from "@reown/walletkit";
import { describe, expect, it, vi } from "vitest";
import {
  registerSessionErrorReporter,
  reportSessionError,
} from "./sessionErrorReporter";

describe("sessionErrorReporter", () => {
  it("forwards the error to the reporter registered for the walletKit", () => {
    const walletKit = {} as IWalletKit;
    const report = vi.fn();
    const error = new Error("boom");

    registerSessionErrorReporter(walletKit, report);
    reportSessionError(walletKit, error);

    expect(report).toHaveBeenCalledTimes(1);
    expect(report).toHaveBeenCalledWith(error);
  });

  it("does not forward the error to a reporter registered for another walletKit", () => {
    const report = vi.fn();

    registerSessionErrorReporter({} as IWalletKit, report);
    reportSessionError({} as IWalletKit, new Error("boom"));

    expect(report).not.toHaveBeenCalled();
  });
});
