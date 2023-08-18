import { Account } from "@ledgerhq/wallet-api-client"
import BigNumber from "bignumber.js"

const ACCOUNT_MOCK: Account = {
  id: "AccountID",
  name: "MckTest",
  address: "0x98BD1afBf1775A1FA55Cbb84B42AC482aA15Ff6E",
  currency: "ethereum",
  balance: BigNumber(0.34),
  spendableBalance: BigNumber(0.32),
  blockHeight: 45668,
  lastSyncDate: new Date(),
}

export { ACCOUNT_MOCK }
