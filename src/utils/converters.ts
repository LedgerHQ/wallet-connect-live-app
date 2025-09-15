import {
  BitcoinTransaction,
  ElrondTransaction,
  EthereumTransaction,
  RippleTransaction,
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

export const mvxTransactionSchema = z.strictObject({
  nonce: z.number(),
  value: z.string(),
  receiver: z.string(),
  sender: z.string(),
  gasPrice: z.number(),
  gasLimit: z.number(),
  data: z.string().optional(),
  chainID: z.string(),
  version: z.number().optional(),
  options: z.string().optional(),
  guardian: z.string().optional(),
  receiverUsername: z.string().optional(),
  senderUsername: z.string().optional(),
});

export type MvxTransaction = z.infer<typeof mvxTransactionSchema>;

export function convertMvxToLiveTX(tx: MvxTransaction): ElrondTransaction {
  return {
    family: "elrond",
    mode: "send",
    amount: tx.value !== undefined ? new BigNumber(tx.value) : new BigNumber(0),
    recipient: tx.receiver,
    gasLimit: tx.gasLimit,
    data: tx.data,
  };
}

// Ressource :
// https://xpring-eng.github.io/xrp-api/XRPAPI-data-types-transaction_common_fields.html
export const xrpTransactionSchema = z.strictObject({
  hash: z.string().optional(),
  TransactionType: z.string(),
  Account: z.string(),
  Flags: z.number().optional(), // NOTE: conflicted documentation here, https://xrpl.org/docs/references/protocol/transactions/common-fields, the sample https://react-app.walletconnect.com/ code here doesn't set flags: https://github.com/reown-com/web-examples/pull/340
  Amount: z.union([z.number(), z.string()]),
  Destination: z.string(),
  Fee: z.string().optional(),
});

export type XrpTransaction = z.infer<typeof xrpTransactionSchema>;

export function convertXrpToLiveTX(tx: XrpTransaction): RippleTransaction {
  const rippleTransaction: RippleTransaction = {
    family: "ripple",
    tag: 0,
    amount: tx.Amount ? new BigNumber(tx.Amount) : new BigNumber(0),
    recipient: tx.Destination,
  };

  if (tx.Fee) rippleTransaction.fee = new BigNumber(tx.Fee);

  return rippleTransaction;
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
