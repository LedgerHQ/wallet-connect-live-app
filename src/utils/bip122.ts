import type { BIP122AccountAddress } from "@/data/methods/BIP122.methods";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";

export async function findBip122MessageSigner(
  accounts: Account[],
  client: WalletAPIClient,
  address: string,
  sessionAccountAddress: string,
  chainId: string,
): Promise<{ account: Account; address: string; path?: string } | undefined> {
  const account = getAccountWithAddressAndChainId(accounts, address, chainId);
  if (account) {
    return { account, address: account.address };
  }

  const sessionAccount = getAccountWithAddressAndChainId(
    accounts,
    sessionAccountAddress,
    chainId,
  );
  if (!sessionAccount) {
    return undefined;
  }

  const entry = (await fetchBip122Addresses(sessionAccount, client)).find(
    (a) => a.path && a.address.toLowerCase() === address.toLowerCase(),
  );
  return entry
    ? { account: sessionAccount, address: entry.address, path: entry.path }
    : undefined;
}

export async function fetchBip122Addresses(
  account: Account,
  client: WalletAPIClient,
  intentions?: string[],
): Promise<BIP122AccountAddress[]> {
  try {
    const entries = await client.bitcoin.getAddresses(
      account.id,
      intentions as ("payment" | "ordinal")[] | undefined,
    );
    if (entries.length > 0) {
      return entries;
    }
  } catch {
    // fall through to default
  }
  return [{ address: account.address }];
}
