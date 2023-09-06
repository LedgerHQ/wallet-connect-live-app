import { BigNumber } from "bignumber.js"
import eip55 from "eip55"
import { EthereumTransaction } from "@ledgerhq/wallet-api-client"

export type EthTransaction = {
  value: string
  to?: string
  gasPrice: string
  gas: string
  data: string
}

export function convertEthToLiveTX(ethTX: EthTransaction): EthereumTransaction {
  return {
    family: "ethereum",
    amount:
      ethTX.value !== undefined
        ? new BigNumber(ethTX.value.replace("0x", ""), 16)
        : new BigNumber(0),
    recipient: ethTX.to ? eip55.encode(ethTX.to) : "",
    gasPrice:
      ethTX.gasPrice !== undefined
        ? new BigNumber(ethTX.gasPrice.replace("0x", ""), 16)
        : undefined,
    gasLimit: ethTX.gas !== undefined ? new BigNumber(ethTX.gas.replace("0x", ""), 16) : undefined,
    data: ethTX.data ? Buffer.from(ethTX.data.replace("0x", ""), "hex") : undefined,
  }
}
