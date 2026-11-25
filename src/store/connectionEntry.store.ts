import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type ConnectionEntry = "scan" | "paste" | "deeplink";

export type TrackedConnectionEntry = ConnectionEntry | "unknown";

export type ConnectionEntries = Record<string, ConnectionEntry>;

export const connectionEntriesAtom = atomWithStorage<ConnectionEntries>(
  "connectionEntries",
  {},
  undefined,
  { getOnInit: true },
);

export const getConnectionEntry = (
  entries: ConnectionEntries,
  pairingTopic: string,
): TrackedConnectionEntry => entries[pairingTopic] ?? "unknown";

export const recordConnectionEntryAtom = atom(
  null,
  (
    _get,
    set,
    {
      pairingTopic,
      entry,
      activeTopics,
    }: {
      pairingTopic: string;
      entry: ConnectionEntry;
      activeTopics: string[];
    },
  ) => {
    set(connectionEntriesAtom, (entries) => ({
      ...Object.fromEntries(
        Object.entries(entries).filter(([topic]) =>
          activeTopics.includes(topic),
        ),
      ),
      [pairingTopic]: entry,
    }));
  },
);
