import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import {
  SolanaFMParser,
  checkIfInstructionParser,
  ParserType,
} from "@solanafm/explorer-kit";
import {
  decodeInstruction,
  decodeTransferInstruction,
} from "@solana/spl-token";
import { getProgramIdl } from "@solanafm/explorer-kit-idls";
import bs58 from "bs58";
import {
  ElrondTransaction,
  EthereumTransaction,
  SolanaTransaction as SolanaTransactionLive,
  TransactionModel,
} from "@ledgerhq/wallet-api-client";

import type {
  // Transaction as solanaTransaction,
  Command,
  TransferCommand,
} from "@ledgerhq/coin-solana/types";

// import type { SystemProgram } from "@solana/web3.js";

import {
  // PublicKey,
  Transaction,
  SystemProgram,
  SystemInstruction,
  TransactionInstruction,
  // VersionedTransaction,
} from "@solana/web3.js";

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

// export type SolanaTransaction = {
//   model: TransactionModel
//   message: string;
//   signature: string;
//   publicKey: string;
// };

export type SolanaTransaction = Transaction;

// type SolanaSignTransactionWithDeprecatedFields = {
//   feePayer: string;
//   instructions: [
//     {
//       programId: string;
//       data?: string;
//       keys: {
//         isSigner: boolean;
//         isWritable: boolean;
//         pubkey: string;
//       }[];
//     },
//   ];
//   recentBlockhash: string;
//   partialSignatures: {
//     pubkey: string;
//     signature: string;
//   }[];
//   signatures: {
//     publicKey: string;
//     signature: string;
//   }[];
// } & SolanaSignTransactionRequiredFields;

// type SolanaSignTransactionRequiredFields = {
//   transaction: string;
// };

export function convertSolanaToLiveTX(
  tx: SolanaTransaction,
): SolanaTransactionLive {
  let model: TransactionModel | null = null;
  let amount: BigNumber = new BigNumber(0);
  let recipient: string = "";

  debugger;
  if (tx.instructions && tx.instructions.length > 0) {
    if (
      String(tx.instructions[0].programId) ===
      SystemProgram.programId.toString()
    ) {
      /*
{
    "feePayer": "AavRo1X6ZrArYAKqLP1UTJB7Hxij1CkkSW4zThvaetcc",
    "recentBlockhash": "Fxqugym9P4xfsPhjKcKMvyDMVCtd4ehpWJwNvTQx653c",
    "instructions": [
        {
            "programId": "11111111111111111111111111111111",
            "data": [
                2,
                0,
                0,
                0,
                1,
                0,
                0,
                0,
                0,
                0,
                0,
                0
            ],
            "keys": [
                {
                    "isSigner": true,
                    "isWritable": true,
                    "pubkey": "AavRo1X6ZrArYAKqLP1UTJB7Hxij1CkkSW4zThvaetcc"
                },
                {
                    "isSigner": false,
                    "isWritable": true,
                    "pubkey": "6F7JxPshGc1JDLst62kg5hRk3s5CQSP1Z4YsmDaxkoVr"
                }
            ]
        }
    ]
}
      */

      const data = tx.instructions[0].data;
      const decodedTransfer = SystemInstruction.decodeTransfer({
        ...tx.instructions[0],
        data: Buffer.from(data),
        // data: Uint8Array.from(data),
        programId: SystemProgram.programId,
      });
      /* 
    {
     fromPubkey : "AavRo1X6ZrArYAKqLP1UTJB7Hxij1CkkSW4zThvaetcc"
     lamports :  1n
     toPubkey: "8fKj2eAc2cR4rf9xmVtF3tmiQYHXJW2qWyspyJ7in2go"
    }
      */
      debugger;
      const decodedAmount = decodedTransfer.lamports.toString()

      let command: TransferCommand = {
        kind: "transfer",
        amount: Number(decodedAmount), // bs58.decode(tx.instructions[0].data),
        // sender: String(tx.instructions[0].keys[0].pubkey),
        sender: String(decodedTransfer.fromPubkey),
        // recipient: String(tx.instructions[0].keys[1].pubkey),
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
    amount: amount, // new BigNumber(0),
    recipient: recipient, //String(tx.instructions[0].keys[1].pubkey), //.toBase58(), //tx.signatures[0].publicKey.toBase58(),
  };
}
