import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { getBase58Encoder, getBase64Encoder } from "@solana/codecs-strings";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import * as token from "@solana/spl-token";
import {
  Account,
  ElrondTransaction,
  EthereumTransaction,
  SolanaTransaction as SolanaTransactionLive,
  TokenCreateATACommand,
  TransactionModel,
} from "@ledgerhq/wallet-api-client";

import type {
  TransferCommand,
  TokenTransferCommand,
} from "@ledgerhq/coin-solana/types";

import {
  Transaction,
  SystemProgram,
  SystemInstruction,
  VersionedMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { encode } from "bs58";
import { cryptocurrenciesById, getTokenById } from "@ledgerhq/cryptoassets";


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
  instructions: any;
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

export type SolanaTransaction = Transaction;
// NOTE: https://solana.com/docs/rpc/json-structures

export function convertSolanaToLiveTX(
  tx: Transaction,
  accounts: Account[],
): SolanaTransactionLive {
  let model: TransactionModel | null = null;
  let amount = new BigNumber(0);
  let recipient = "";
  debugger;
  if (tx.instructions.length > 1) {
    // NOTE: we should loop over instructions and create liveTx for each
    throw new Error("Not supporting multiple instructions yet");
  }
  let programId = String(tx.instructions[0].programId);
  if (programId === SystemProgram.programId.toString()) {
    const data = tx.instructions[0].data;
    const decodedTransfer = SystemInstruction.decodeTransfer({
      ...tx.instructions[0],
      data: Buffer.from(data),
      programId: SystemProgram.programId,
    });
    const decodedAmount = decodedTransfer.lamports.toString();

    const command: TransferCommand = {
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
  } else if (programId === token.TOKEN_PROGRAM_ID.toString()) {
    const data = tx.instructions[0].data;
    const decoded = token.decodeTransferCheckedInstruction({
      ...tx.instructions[0],
      data: Buffer.from(data),
      programId: token.TOKEN_PROGRAM_ID,
      // programId: SystemProgram.programId,
    });
    /*

    export type TokenRecipientDescriptor = {
  walletAddress: string;
  tokenAccAddress: string;
  shouldCreateAsAssociatedTokenAccount: boolean;
};
*/
    if (!tx.feePayer) {
      throw new Error("Missing fee payer, used to infer wallet address");
    }

    const accAddress = String(tx.feePayer);
    const tokenAccAddress = String(decoded.keys.destination.pubkey);

    // amount = new BigNumber(decodedAmount);
    // recipient = String(decodedTransfer.toPubkey);

    recipient = accAddress;

    const command: TokenTransferCommand = {
      kind: "token.transfer",
      amount: Number(decoded.data.amount),
      ownerAddress: String(decoded.keys.owner.pubkey),
      ownerAssociatedTokenAccountAddress: String(decoded.keys.source.pubkey),
      recipientDescriptor: {
        // walletAddress: String(decoded.keys.destination.pubkey),
        walletAddress: accAddress,
        tokenAccAddress: tokenAccAddress,
        shouldCreateAsAssociatedTokenAccount: true,
      },
      mintAddress: String(decoded.keys.mint.pubkey),
      mintDecimals: decoded.data.decimals,
    };
    // from LL: "sub account id is required for token transfer";

    // const wSolSubAccId = encodeAccountIdWithTokenAccountAddress(
    //   mainAccId,
    //   testOnChainData.wSolSenderAssocTokenAccAddress,
    // );
    const mainAccId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: "solana",
      xpubOrAddress: accAddress, //testOnChainData.fundedSenderAddress,
      derivationMode: "solanaMain",
    });
    const tokenAccountId = encodeAccountIdWithTokenAccountAddress(
      mainAccId,
      tokenAccAddress,
    );
    debugger;

    model = {
      commandDescriptor: {
        command: command,
        fee: 0,
        warnings: {},
        errors: {},
      },
      kind: "token.transfer",
      uiState: {
        subAccountId: tokenAccountId, // TODO: create sub account before hand
      },
    };
    debugger;
  } else if (programId === token.ASSOCIATED_TOKEN_PROGRAM_ID.toString()) {
    const data = tx.instructions[0].data;
    const keys = tx.instructions[0].keys
//     The data field for this instruction is usually empty or contains very little data, as the accounts themselves are enough to determine what the instruction is doing.
    const fundingAccount = keys[0].pubkey;
    const associatedTokenAccount = keys[1].pubkey;
    const ownerAccount = keys[2].pubkey;
    const mintAccount = keys[3].pubkey;
    const systemProgramAccount = keys[4].pubkey;
    const tokenProgramAccount = keys[5].pubkey;

    debugger;

    const command: TokenCreateATACommand = {
      kind: "token.createATA",
      owner: ownerAccount.toString(),
      mint: mintAccount.toString(),
      associatedTokenAccountAddress: associatedTokenAccount.toString(),
    }
    const mainAccId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: "solana",
      xpubOrAddress: fundingAccount.toString(), //testOnChainData.fundedSenderAddress,
      derivationMode: "solanaMain",
    });
    const tokenAccountId = encodeAccountIdWithTokenAccountAddress(
      mainAccId,
      associatedTokenAccount.toString(),
    );

    // const tokenId = toTokenId(assocTokenAcc.info.mint.toBase58());
    const tokenId = toTokenId(mintAccount.toString());
    // debugger;
    // const tokenCurrency = getTokenById(tokenId);
    debugger;


    model = {
      commandDescriptor: {
        command: command,
        fee: 0,
        warnings: {},
        errors: {},
      },
      kind: "token.createATA",
      uiState: {
        tokenId,
        // subAccountId: tokenAccountId, // TODO: create sub account before hand
      },
    };
  } else {
    throw new Error("Unsupported Solana instruction");
  }
  // else {
  //   throw new Error("Unsupported Solana rpc transaction format");
  // }

  debugger;
  if (model === null) {
    throw new Error("Unsupported Solana transaction");
  }

  return {
    model,
    family: "solana",
    amount: amount,
    recipient: recipient,
  };
}
