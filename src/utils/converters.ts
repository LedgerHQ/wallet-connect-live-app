import {
  BitcoinTransaction,
  ElrondTransaction,
  EthereumTransaction,
  RippleTransaction,
} from "@ledgerhq/wallet-api-client";
import { BigNumber } from "bignumber.js";
import eip55 from "eip55";

import { VersionedMessage, VersionedTransaction } from "@solana/web3.js";

export function encodeAccountIdWithTokenAccountAddress(
  accountId: string,
  address: string,
): string {
  return `${accountId}+${address}`;
}

export function toTokenId(mint: string): string {
  return `solana/spl/${mint}`;
}

export type RawCommand = {
  kind: "raw";
  instructions: unknown;
  versionnedMessage?: VersionedMessage; // lost in serialization
  versionnedTx?: VersionedTransaction; // lost in serialization
  msg?: Uint8Array; // uint8, not good
  transaction?: string;
};

export type EthTransaction = {
  value: string;
  to?: string;
  gasPrice: string;
  gas: string;
  data: string;
};

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
    gasLimit:
      ethTX.gas !== undefined
        ? new BigNumber(ethTX.gas.replace("0x", ""), 16)
        : undefined,
    data: ethTX.data
      ? Buffer.from(ethTX.data.replace("0x", ""), "hex")
      : undefined,
  };
}

export type MvxTransaction = {
  nonce: string;
  value: string;
  receiver: string;
  sender: string;
  gasPrice: number;
  gasLimit: number;
  data?: string;
  chainID: string;
  version?: string;
  options?: string;
  guardian?: string;
  receiverUsername?: string;
  senderUsername?: string;
};

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
export type XrpTransaction = {
  hash?: string;
  TransactionType: string;
  Account: string;
  Flags: number;
  Amount: number | string;
  Destination: string;
  Fee?: string;
};

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

export type BtcTransaction = {
  account: string;
  recipientAddress: string;
  amount: string;
};

export function convertBtcToLiveTX(btcTX: BtcTransaction): BitcoinTransaction {
  return {
    family: "bitcoin",
    amount: btcTX.amount ? new BigNumber(btcTX.amount) : new BigNumber(0),
    recipient: btcTX.recipientAddress,
  };
}
