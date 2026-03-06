import type { BIP122AccountAddress } from "@/data/methods/BIP122.methods";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";

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
