import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import {
  ElrondTransaction,
  EthereumTransaction,
  SolanaTransaction as SolanaTransactionLive,
  TransactionModel,
} from "@ledgerhq/wallet-api-client";

import type { TransferCommand } from "@ledgerhq/coin-solana/types";

import { Transaction, SystemProgram, SystemInstruction } from "@solana/web3.js";

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

export type SolanaTransaction = Transaction;

export function convertSolanaToLiveTX(
  tx: SolanaTransaction,
): SolanaTransactionLive {
  let model: TransactionModel | null = null;
  let amount: BigNumber = new BigNumber(0);
  let recipient: string = "";

  if (tx.instructions && tx.instructions.length === 1) {
    // NOTE: we should loop over instructions and create liveTx for each
    if (
      String(tx.instructions[0].programId) ===
      SystemProgram.programId.toString()
    ) {
      const data = tx.instructions[0].data;
      const decodedTransfer = SystemInstruction.decodeTransfer({
        ...tx.instructions[0],
        data: Buffer.from(data),
        programId: SystemProgram.programId,
      });
      debugger;
      const decodedAmount = decodedTransfer.lamports.toString();

      let command: TransferCommand = {
        kind: "transfer",
        amount: Number(decodedAmount),
        sender: String(decodedTransfer.fromPubkey),
        recipient: String(decodedTransfer.toPubkey),
      };
      amount = new BigNumber(decodedAmount);
      recipient = String(decodedTransfer.toPubkey);

      model = {
        commandDescriptor: {
          command: command,
          fee: 0,
          warnings: {},
          errors: {},
        },
        kind: "transfer",
        uiState: {},
      };
    } else {
      debugger;
      throw new Error("Unsupported Solana instruction");
    }
  } else {
    debugger;
    throw new Error("Unsupported Solana non-instruction");
  }

  if (model === null) {
    throw new Error("Unsupported Solana transaction");
  }
  debugger;

  return {
    model,
    family: "solana",
    amount: amount,
    recipient: recipient,
  };
}
