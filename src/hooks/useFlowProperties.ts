import {
  connectionEntriesAtom,
  getConnectionEntry,
} from "@/store/connectionEntry.store";
import { useAtomValue } from "jotai";
import { useMemo } from "react";

export function useFlowProperties(pairingTopic: string) {
  const connectionEntries = useAtomValue(connectionEntriesAtom);

  return useMemo(
    () => ({
      entry: getConnectionEntry(connectionEntries, pairingTopic),
      flow_id: pairingTopic,
    }),
    [connectionEntries, pairingTopic],
  );
}
