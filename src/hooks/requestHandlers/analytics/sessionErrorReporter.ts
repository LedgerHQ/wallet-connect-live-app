import type { IWalletKit } from "@reown/walletkit";

type SessionErrorReporter = (error: unknown) => void;

const reporters = new WeakMap<IWalletKit, SessionErrorReporter>();

export const registerSessionErrorReporter = (
  walletKit: IWalletKit,
  report: SessionErrorReporter,
) => {
  reporters.set(walletKit, report);
};

export const reportSessionError = (walletKit: IWalletKit, error: unknown) => {
  reporters.get(walletKit)?.(error);
};
