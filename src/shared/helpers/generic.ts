import { Account } from "@ledgerhq/wallet-api-client"
import { getCurrencyByChainId } from "./helper.util"

export const getDefaultLanguage = (
  fallbackLang: string,
  locales?: string[],
  lang?: string,
  locale?: string,
): string => {
  if (lang && locales?.includes(lang)) return lang
  if (locale && locales?.includes(locale)) return locale
  return fallbackLang
}

export const compareAddresses = (addr1: string, addr2: string) =>
  addr1.toLowerCase() === addr2.toLowerCase()

export const getAccountWithAddress = (account: Account[], addr: string) =>
  account.find((a) => a.address.toLowerCase() === addr.toLowerCase())

export const getAccountWithAddressAndChainId = (
  accounts: Account[],
  addr: string,
  chainId: string,
) =>
  accounts.find(
    (a) =>
      a.address.toLowerCase() === addr.toLowerCase() &&
      a.currency === getCurrencyByChainId(chainId),
  )
