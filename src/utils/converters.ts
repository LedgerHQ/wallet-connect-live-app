import {
  BitcoinTransaction,
  EthereumTransaction,
} from "@ledgerhq/wallet-api-client";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { z } from "zod";

export const ethTransactionSchema = z.strictObject({
  from: z.string(),
  to: z.string().optional(),
  data: z.string().optional(),
  gas: z.string().optional(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().nullable().optional(),
  maxPriorityFeePerGas: z.string().nullable().optional(),
  value: z.string().optional(),
  nonce: z.string().optional(),
  chainId: z.string().optional(),
  type: z.string().optional(),
});

export type EthTransaction = z.infer<typeof ethTransactionSchema>;

export function convertEthToLiveTX(ethTX: EthTransaction): EthereumTransaction {
  const nonce = Number(ethTX.nonce);

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
    gasLimit:
      ethTX.gas !== undefined
        ? new BigNumber(ethTX.gas.replace("0x", ""), 16)
        : undefined,
    maxFeePerGas:
      ethTX.maxFeePerGas !== undefined && ethTX.maxFeePerGas !== null
        ? new BigNumber(ethTX.maxFeePerGas.replace("0x", ""), 16)
        : undefined,
    maxPriorityFeePerGas:
      ethTX.maxPriorityFeePerGas !== undefined &&
      ethTX.maxPriorityFeePerGas !== null
        ? new BigNumber(ethTX.maxPriorityFeePerGas.replace("0x", ""), 16)
        : undefined,
    data: ethTX.data
      ? Buffer.from(ethTX.data.replace("0x", ""), "hex")
      : undefined,
    nonce: Number.isNaN(nonce) ? undefined : nonce,
  };
}

export const btcTransactionSchema = z.strictObject({
  account: z.string(),
  recipientAddress: z.string(),
  amount: z.string(),
  memo: z.string().optional(),
  // Uncomment when used in the future
  // changeAddress: z.string().optional(),
});

export type BtcTransaction = z.infer<typeof btcTransactionSchema>;

export function convertBtcToLiveTX(btcTX: BtcTransaction): BitcoinTransaction {
  return {
    family: "bitcoin",
    amount: btcTX.amount ? new BigNumber(btcTX.amount) : new BigNumber(0),
    recipient: btcTX.recipientAddress,
    opReturnData: btcTX.memo ? Buffer.from(btcTX.memo, "hex") : undefined,
  };
}
