import { SUPPORTED_NETWORK } from "@/data/network.config";
import { getCurrencyByChainId, getDisplayName } from "@/shared/helpers/helper.util";
import { Proposal } from "@/shared/types/types";
import { Account } from "@ledgerhq/wallet-api-client";

export type ProposalProps = {
  proposal: Proposal;
};

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
  const chainsRequired = sortAlphabetic(chains.filter((chain) => chain.isRequired));
  const chainsAccount = sortAlphabetic(chains.filter((chain) => chain.accounts.length > 0));
  const chainsWithoutAccount = sortAlphabetic(
    chains.filter((chain) => chain.accounts.length === 0),
  );

  const newOrder = [...new Set(chainsRequired.concat(chainsAccount).concat(chainsWithoutAccount))];

  return newOrder;
}

export const getChains = (proposal: Proposal) => {
  const requiredNamespaces = Object.values(proposal.params.requiredNamespaces).map((namespace) => ({
    ...namespace,
    required: true,
  }));
  const optionalNamespaces = proposal.params.optionalNamespaces
    ? Object.values(proposal.params.optionalNamespaces)
    : [];

  return [...requiredNamespaces, ...optionalNamespaces];
};

export const formatAccountsByChain = (proposal: Proposal, accounts: Account[]) => {
  const families = getChains(proposal);

  const chains = families.map((f) => f.chains).reduce((value, acc) => acc.concat(value), []);

  const chainsDeduplicated = [...Array.from(new Set(chains))];

  const mappedAccountsByChains: AccountsInChain[] = chainsDeduplicated.map((chain) => {
    const formatedChain = getCurrencyByChainId(chain);

    return {
      chain: formatedChain,
      displayName: getDisplayName(formatedChain),
      isSupported: Boolean(SUPPORTED_NETWORK[formatedChain] !== undefined),
      isRequired: families.some((family) => family.required && family.chains.includes(chain)),
      accounts: accounts.filter((acc) => acc.currency === formatedChain),
    };
  });

  return mappedAccountsByChains;
};
