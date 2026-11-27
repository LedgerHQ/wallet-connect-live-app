import type { IWalletKit } from "@reown/walletkit";

export type DappInfo = { name?: string; url?: string };

export function getDappInfo(walletKit: IWalletKit, topic: string): DappInfo {
  try {
    const metadata =
      walletKit.engine.signClient.session.get(topic)?.peer?.metadata;
    if (!metadata) return {};
    return {
      name: metadata.name,
      url: metadata.url,
    };
  } catch {
    return {};
  }
}
