import { SignClientTypes } from "@walletconnect/types";
import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";

const recentConnectionApps = atomWithStorage<SignClientTypes.Metadata[]>(
  "connectionApps",
  [],
  undefined,
  { getOnInit: true },
);

export default function useRecentConnection() {
  const [lastConnectionApps, setLastConnectionApps] =
    useAtom(recentConnectionApps);

  return { lastConnectionApps, setLastConnectionApps };
}
