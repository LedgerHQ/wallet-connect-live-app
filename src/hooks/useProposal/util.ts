import { SUPPORTED_NETWORK } from "@/data/network.config";
import {
  getCurrencyByChainId,
  getDisplayName,
  getNamespace,
} from "@/utils/helper.util";
import { Account } from "@ledgerhq/wallet-api-client";
import { ProposalTypes, SessionTypes } from "@walletconnect/types";

export type AccountsInChain = {
  chain: string;
  isSupported: boolean;
  isRequired: boolean;
  accounts: Account[];
  displayName: string;
};

export function sortAlphabetic(array: AccountsInChain[]) {
  return array.sort((a, b) => a.chain.localeCompare(b.chain));
}

/**
 *
 * @param chains
 * @returns Chains sorted first by required then by chain with accounts and chains without accounts
 */

export function sortChains(chains: AccountsInChain[]) {
  const chainsRequired = sortAlphabetic(
    chains.filter((chain) => chain.isRequired),
  );
  const chainsAccount = sortAlphabetic(
    chains.filter((chain) => chain.accounts.length > 0),
  );
  const chainsWithoutAccount = sortAlphabetic(
    chains.filter((chain) => chain.accounts.length === 0),
  );

  const newOrder = [
    ...new Set(
      chainsRequired.concat(chainsAccount).concat(chainsWithoutAccount),
    ),
  ];

  return newOrder;
}

export const getChains = (
  proposal: ProposalTypes.Struct | SessionTypes.Struct,
) => {
  const requiredNamespaces = Object.values(proposal.requiredNamespaces).map(
    (namespace) => ({
      ...namespace,
      required: true,
    }),
  );
  const optionalNamespaces = proposal.optionalNamespaces
    ? Object.values(proposal.optionalNamespaces).map((namespace) => ({
        ...namespace,
        required: false,
      }))
    : [];

  return [...requiredNamespaces, ...optionalNamespaces];
};

export const formatAccountsByChain = (
  proposal: ProposalTypes.Struct | SessionTypes.Struct,
  accounts: Account[],
) => {
  const families = getChains(proposal);

  const chains = families
    .map((f) => f.chains ?? [])
    .reduce((acc, value) => acc.concat(value), []);

  const chainsDeduplicated = Array.from(new Set(chains));

  const mappedAccountsByChains = chainsDeduplicated.reduce<AccountsInChain[]>(
    (acc, chain) => {
      const formattedChain = getCurrencyByChainId(chain);

      const chainIsRequired = families.some(
        (family) => family.required && family.chains?.includes(chain),
      );

      // Remove solana (legacy) only if main solana is already present
      // And the chain is not required
      const ns = getNamespace(formattedChain);
      if (
        ns !== chain &&
        !chainIsRequired &&
        chainsDeduplicated.find((value) => value === ns)
      ) {
        return acc;
      }

      acc.push({
        chain: formattedChain,
        displayName: getDisplayName(formattedChain),
        isSupported: Boolean(SUPPORTED_NETWORK[formattedChain] !== undefined),
        isRequired: chainIsRequired,
        accounts: accounts.filter((acc) => {
          return acc.currency === formattedChain;
        }),
      });

      return acc;
    },
    [],
  );

  return mappedAccountsByChains;
};
