import { atomWithStorage } from 'jotai/utils';
import { atom, useAtom } from 'jotai';
import { SignClientTypes } from '@walletconnect/types';

type MetadataWithDate = SignClientTypes.Metadata & {
  date: Date;
};

type StoredValueType = Record<string, MetadataWithDate>;

const recentConnectionApps = atomWithStorage<StoredValueType>(
  "connectionApps",
  {},
  undefined,
  { getOnInit: true }
);

//custom read and write in recentConnectionApps Atom
const sortedRecentConnectionApps = atom(
  (get): MetadataWithDate[] => {
    const storedValue: StoredValueType = get(recentConnectionApps);
    const flattenedArray = Object.values(storedValue);
    return flattenedArray.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];
  },
  (get, set, newMetadata: SignClientTypes.Metadata) => {
    const storedValue: StoredValueType = get(recentConnectionApps);
    const updatedStoredValue: StoredValueType = {
      ...storedValue,
      [newMetadata.url]: { ...newMetadata, date: new Date() }
    };
    set(recentConnectionApps, updatedStoredValue);
  }
);

export default function useRecentConnection() {
  const [lastConnectionApps, addAppToLastConnectionApps] = useAtom(sortedRecentConnectionApps);

  return { lastConnectionApps, addAppToLastConnectionApps };
}
