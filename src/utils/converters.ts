import {
  BitcoinTransaction,
  EthereumTransaction,
} from "@ledgerhq/wallet-api-client";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { z } from "zod";

// EIP-2930: Access List validation
// Format: [{ address: string, storageKeys: string[] }]
// Address: 20 bytes (42 chars with 0x prefix)
// Storage key: 32 bytes (66 chars with 0x prefix)
const accessListItemSchema = z.object({
  address: z
    .string()
    .regex(
      /^0x[0-9a-fA-F]{40}$/,
      "Address must be 20 bytes (42 chars with 0x)",
    ),
  storageKeys: z.array(
    z
      .string()
      .regex(
        /^0x[0-9a-fA-F]{64}$/,
        "Storage key must be 32 bytes (66 chars with 0x)",
      ),
  ),
});

export const ethTransactionSchema = z.strictObject({
  from: z.string(),
  to: z.string().optional(),
  data: z.string().optional(),
  gas: z.string().optional(),
  gasLimit: z.string().optional(),
  gasPrice: z.string().optional(),
  maxFeePerGas: z.string().nullable().optional(),
  maxPriorityFeePerGas: z.string().nullable().optional(),
  value: z.string().optional(),
  nonce: z.string().optional(),
  chainId: z.union([z.string(), z.number()]).optional(),
  type: z.string().optional(),
  accessList: z.array(accessListItemSchema).optional(),
});

export type EthTransaction = z.infer<typeof ethTransactionSchema>;

export function convertEthToLiveTX(ethTX: EthTransaction): EthereumTransaction {
  const nonce = Number(ethTX.nonce);
  const gasLimit = ethTX.gasLimit ?? ethTX.gas;

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
      gasLimit !== undefined
        ? new BigNumber(gasLimit.replace("0x", ""), 16)
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
  changeAddress: z.string().optional(),
});

export type BtcTransaction = z.infer<typeof btcTransactionSchema>;

export function convertBtcToLiveTX(btcTX: BtcTransaction): BitcoinTransaction {
  return {
    family: "bitcoin",
    amount: btcTX.amount ? new BigNumber(btcTX.amount) : new BigNumber(0),
    recipient: btcTX.recipientAddress,
    opReturnData: btcTX.memo ? Buffer.from(btcTX.memo, "hex") : undefined,
    changeAddress: btcTX.changeAddress,
  };
}
