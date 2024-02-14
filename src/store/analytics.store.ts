import { atom } from "jotai";
import { walletAPIwalletInfoAtom } from "./wallet-api.store";

export const analyticsWriteKeyAtom = atom(async (get) => {
  const { data: walletInfo } = await get(walletAPIwalletInfoAtom);
  const walletName = walletInfo.wallet.name;

  let writeKey: string | undefined = undefined;

  if (walletName === "ledger-live-desktop") {
    writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_DESKTOP;
  } else if (walletName === "ledger-live-mobile") {
    writeKey = import.meta.env.VITE_PUBLIC_SEGMENT_API_KEY_MOBILE;
  }
  return writeKey
})