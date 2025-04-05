import { Account } from "@ledgerhq/wallet-api-client";
import { getCurrencyByChainId } from "./helper.util";
import { getAddressFromAccount } from "@walletconnect/utils";

export const getDefaultLanguage = (
  fallbackLang: string,
  locales?: string[],
  lang?: string,
  locale?: string,
): string => {
  if (lang && locales?.includes(lang)) return lang;
  if (locale && locales?.includes(locale)) return locale;
  return fallbackLang;
};

export const compareAddresses = (addr1: string, addr2: string) =>
  addr1.toLowerCase() === addr2.toLowerCase();

export const getAccountWithAddress = (account: Account[], addr: string) =>
  account.find((a) => a.address.toLowerCase() === addr.toLowerCase());

export const getAccountWithAddressAndChainId = (
  accounts: Account[],
  addr: string,
  chainId: string,
) =>
  accounts.find(
    (a) =>
      a.address.toLowerCase() === addr.toLowerCase() &&
      a.currency === getCurrencyByChainId(chainId),
  );

export const getAddressWithAccount = (request: {
  params: { account: string; address?: string };
}): string =>
  request.params?.address ??
  getAddressFromAccount(request.params.account) ??
  request.params.account;
