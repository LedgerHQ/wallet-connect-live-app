import { atomWithStorage } from 'jotai/utils';
import { atom } from 'jotai';
import { SignClientTypes } from '@walletconnect/types';

type MetadataWithDate = SignClientTypes.Metadata & {
  date: Date;
};

type StoredValueType = Record<string, MetadataWithDate>;

export const initialValue = {}

export const recentConnectionAppsAtom = atomWithStorage<StoredValueType>(
  "connectionApps",
  initialValue,
  undefined,
  { getOnInit: true }
);

export const sortedRecentConnectionAppsAtom = atom(
  (get): MetadataWithDate[] => {
    const storedValue: StoredValueType = get(recentConnectionAppsAtom);
    const flattenedArray = Object.values(storedValue);
    return flattenedArray.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
  },
  (_, set, newMetadata: SignClientTypes.Metadata) => {
    set(recentConnectionAppsAtom, (storedValue) => ({
      ...storedValue,
      [newMetadata.url]: { ...newMetadata, date: new Date() },
    }));
  },
);