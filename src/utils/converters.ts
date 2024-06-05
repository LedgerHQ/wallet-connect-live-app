import { BigNumber } from "bignumber.js";
import eip55 from "eip55";
import { encodeAccountId } from "@ledgerhq/coin-framework/account/accountId";
import * as token from "@solana/spl-token";
import {
  Account,
  ElrondTransaction,
  EthereumTransaction,
  RippleTransaction,
  BitcoinTransaction,
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
} from "@solana/web3.js";
import { PublicKey } from "@solana/web3.js";

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

export type SolanaTransaction = Transaction;
// NOTE: https://solana.com/docs/rpc/json-structures

export function convertSolanaToLiveTX(
  tx: VersionedMessage,
  accounts: Account[],
  serializedTransaction?: string,
): [SolanaTransactionLive, PublicKey | undefined] {
  let model: TransactionModel | null = null;
  let amount = new BigNumber(0);
  let recipient = "";
  let feePayer: PublicKey | undefined = undefined;
  console.log(tx);
  // debugger;

  if (tx.version === "legacy") {
    let instructionIndex = 0;
    const supportedProgramIds = [
      SystemProgram.programId.toString(),
      token.TOKEN_PROGRAM_ID.toString(),
      //token.ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
    ];
    while (
      !!tx.compiledInstructions[instructionIndex] &&
      !supportedProgramIds.includes(
        tx.staticAccountKeys[
          tx.compiledInstructions[instructionIndex].programIdIndex
        ].toString(),
      )
    ) {
      instructionIndex += 1;
    }

    if (!tx.compiledInstructions[instructionIndex]) {
      // NOTE: we should loop over instructions and create liveTx for each
      throw new Error("Didn't find a supported instruction");
    }

    const feePayerIdx = tx.compiledInstructions[
      instructionIndex
    ].accountKeyIndexes.find((idx) => {
      return tx.isAccountSigner(idx);
    });
    if (feePayerIdx === undefined) {
      throw new Error("Missing signer, used to infer wallet address");
    }

    feePayer = tx.staticAccountKeys[feePayerIdx];
    if (!feePayer) {
      throw new Error("Missing fee payer, used to infer wallet address");
    }

    const programId =
      tx.staticAccountKeys[
        tx.compiledInstructions[instructionIndex].programIdIndex
      ].toString();

    switch (programId) {
      case SystemProgram.programId.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        console.log("data: ", data);
        const decodedTransfer = SystemInstruction.decodeTransfer({
          data: Buffer.from(data),
          programId: SystemProgram.programId,
          keys: tx.compiledInstructions[instructionIndex].accountKeyIndexes.map(
            (idx) => {
              return {
                pubkey: tx.staticAccountKeys[idx],
                isSigner: tx.isAccountSigner(idx),
                isWritable: tx.isAccountWritable(idx),
              };
            },
          ),
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
        break;
      }
      case token.TOKEN_PROGRAM_ID.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        const decoded = token.decodeTransferCheckedInstruction({
          data: Buffer.from(data),
          programId: token.TOKEN_PROGRAM_ID,
          keys: tx.compiledInstructions[instructionIndex].accountKeyIndexes.map(
            (idx) => {
              return {
                pubkey: tx.staticAccountKeys[idx],
                isSigner: tx.isAccountSigner(idx),
                isWritable: tx.isAccountWritable(idx),
              };
            },
          ),
        });

        // export type TokenRecipientDescriptor = {
        //   walletAddress: string;
        //   tokenAccAddress: string;
        //   shouldCreateAsAssociatedTokenAccount: boolean;
        // };

        const accAddress = feePayer.toString();
        const tokenAccAddress = decoded.keys.destination.pubkey.toString();

        // amount = new BigNumber(decodedAmount);
        // recipient = String(decodedTransfer.toPubkey);

        recipient = accAddress;

        const command: TokenTransferCommand = {
          kind: "token.transfer",
          amount: Number(decoded.data.amount),
          ownerAddress: String(decoded.keys.owner.pubkey),
          ownerAssociatedTokenAccountAddress: String(
            decoded.keys.source.pubkey,
          ),
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
        break;
      }
      case token.ASSOCIATED_TOKEN_PROGRAM_ID.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        const keys = tx.compiledInstructions[
          instructionIndex
        ].accountKeyIndexes.map((idx) => {
          return {
            pubkey: tx.staticAccountKeys[idx],
            isSigner: tx.isAccountSigner(idx),
            isWritable: tx.isAccountWritable(idx),
          };
        });
        //     The data field for this instruction is usually empty or contains very little data, as the accounts themselves are enough to determine what the instruction is doing.
        const fundingAccount = keys[0].pubkey;
        const associatedTokenAccount = keys[1].pubkey;
        const ownerAccount = keys[2].pubkey;
        const mintAccount = keys[3].pubkey;
        //const systemProgramAccount = keys[4].pubkey;
        //const tokenProgramAccount = keys[5].pubkey;

        const command: TokenCreateATACommand = {
          kind: "token.createATA",
          owner: ownerAccount.toString(),
          mint: mintAccount.toString(),
          associatedTokenAccountAddress: associatedTokenAccount.toString(),
        };
        const mainAccId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "solana",
          xpubOrAddress: fundingAccount.toString(), //testOnChainData.fundedSenderAddress,
          derivationMode: "solanaMain",
        });
        /*const tokenAccountId = encodeAccountIdWithTokenAccountAddress(
          mainAccId,
          associatedTokenAccount.toString(),
        );*/

        // const tokenId = toTokenId(assocTokenAcc.info.mint.toBase58());
        const tokenId = toTokenId(mintAccount.toString());
        // debugger;
        // const tokenCurrency = getTokenById(tokenId);

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
        break;
      }
      default:
        throw new Error("Unsupported Solana instruction");
    }
  } else {
    let instructionIndex = 0;
    const supportedProgramIds = [
      SystemProgram.programId.toString(),
      token.TOKEN_PROGRAM_ID.toString(),
      //token.ASSOCIATED_TOKEN_PROGRAM_ID.toString(),
    ];
    while (
      !!tx.compiledInstructions[instructionIndex] &&
      !supportedProgramIds.includes(
        tx.staticAccountKeys[
          tx.compiledInstructions[instructionIndex].programIdIndex
        ].toString(),
      )
    ) {
      instructionIndex += 1;
    }

    const feePayerIdx = tx.compiledInstructions[
      instructionIndex
    ].accountKeyIndexes.find((idx) => {
      return tx.isAccountSigner(idx);
    });

    feePayer = tx.staticAccountKeys[feePayerIdx];

    console.log(
      "instructionIndex: ",
      instructionIndex,
      tx.compiledInstructions[instructionIndex],
      [
        SystemProgram.programId,
        token.TOKEN_PROGRAM_ID,
        token.ASSOCIATED_TOKEN_PROGRAM_ID,
      ].includes(
        tx.staticAccountKeys[
          tx.compiledInstructions[instructionIndex]?.programIdIndex
        ],
      ),
      tx.staticAccountKeys[
        tx.compiledInstructions[instructionIndex]?.programIdIndex
      ] === SystemProgram.programId,
      tx.staticAccountKeys[
        tx.compiledInstructions[instructionIndex]?.programIdIndex
      ] === token.TOKEN_PROGRAM_ID,
      tx.staticAccountKeys[
        tx.compiledInstructions[instructionIndex]?.programIdIndex
      ] === token.ASSOCIATED_TOKEN_PROGRAM_ID,
    );

    if (!tx.compiledInstructions[instructionIndex]) {
      // NOTE: we should loop over instructions and create liveTx for each
      throw new Error("Didn't find a supported instruction");
    }
    const programId =
      tx.staticAccountKeys[
        tx.compiledInstructions[instructionIndex].programIdIndex
      ].toString();
    console.log("programId: ", programId);

    switch (programId) {
      case SystemProgram.programId.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        const decodedTransfer = SystemInstruction.decodeTransfer({
          data: Buffer.from(data),
          programId: SystemProgram.programId,
          keys: tx.compiledInstructions[instructionIndex].accountKeyIndexes.map(
            (idx) => {
              return {
                pubkey: tx.staticAccountKeys[idx],
                isSigner: tx.isAccountSigner(idx),
                isWritable: tx.isAccountWritable(idx),
              };
            },
          ),
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
        break;
      }
      case token.TOKEN_PROGRAM_ID.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        const decoded = token.decodeTransferCheckedInstruction({
          data: Buffer.from(data),
          programId: token.TOKEN_PROGRAM_ID,
          keys: tx.compiledInstructions[instructionIndex].accountKeyIndexes.map(
            (idx) => {
              return {
                pubkey: tx.staticAccountKeys[idx],
                isSigner: tx.isAccountSigner(idx),
                isWritable: tx.isAccountWritable(idx),
              };
            },
          ),
        });

        // export type TokenRecipientDescriptor = {
        //   walletAddress: string;
        //   tokenAccAddress: string;
        //   shouldCreateAsAssociatedTokenAccount: boolean;
        // };

        const feePayerIdx = tx.compiledInstructions[
          instructionIndex
        ].accountKeyIndexes.find((idx) => {
          return tx.isAccountSigner(idx);
        });

        if (!feePayerIdx) {
          throw new Error("Missing signer, used to infer wallet address");
        }

        const feePayer = tx.staticAccountKeys[feePayerIdx];
        if (!feePayer) {
          throw new Error("Missing fee payer, used to infer wallet address");
        }

        const accAddress = feePayer.toString();
        const tokenAccAddress = decoded.keys.destination.pubkey.toString();

        // amount = new BigNumber(decodedAmount);
        // recipient = String(decodedTransfer.toPubkey);

        recipient = accAddress;

        const command: TokenTransferCommand = {
          kind: "token.transfer",
          amount: Number(decoded.data.amount),
          ownerAddress: String(decoded.keys.owner.pubkey),
          ownerAssociatedTokenAccountAddress: String(
            decoded.keys.source.pubkey,
          ),
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
        break;
      }
      case token.ASSOCIATED_TOKEN_PROGRAM_ID.toString(): {
        const data = tx.compiledInstructions[instructionIndex].data;
        const keys = tx.compiledInstructions[
          instructionIndex
        ].accountKeyIndexes.map((idx) => {
          return {
            pubkey: tx.staticAccountKeys[idx],
            isSigner: tx.isAccountSigner(idx),
            isWritable: tx.isAccountWritable(idx),
          };
        });
        //     The data field for this instruction is usually empty or contains very little data, as the accounts themselves are enough to determine what the instruction is doing.
        const fundingAccount = keys[0].pubkey;
        const associatedTokenAccount = keys[1].pubkey;
        const ownerAccount = keys[2].pubkey;
        const mintAccount = keys[3].pubkey;
        //const systemProgramAccount = keys[4].pubkey;
        //const tokenProgramAccount = keys[5].pubkey;

        const command: TokenCreateATACommand = {
          kind: "token.createATA",
          owner: ownerAccount.toString(),
          mint: mintAccount.toString(),
          associatedTokenAccountAddress: associatedTokenAccount.toString(),
        };
        const mainAccId = encodeAccountId({
          type: "js",
          version: "2",
          currencyId: "solana",
          xpubOrAddress: fundingAccount.toString(), //testOnChainData.fundedSenderAddress,
          derivationMode: "solanaMain",
        });
        /*const tokenAccountId = encodeAccountIdWithTokenAccountAddress(
          mainAccId,
          associatedTokenAccount.toString(),
        );*/

        // const tokenId = toTokenId(assocTokenAcc.info.mint.toBase58());
        const tokenId = toTokenId(mintAccount.toString());
        // debugger;
        // const tokenCurrency = getTokenById(tokenId);

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
        break;
      }
      default:
        throw new Error("Unsupported Solana instruction");
    }
  }

  // debugger;
  if (model === null) {
    throw new Error("Unsupported Solana transaction");
  }

  return [
    {
      model,
      family: "solana",
      amount: amount,
      recipient: recipient,
      raw: serializedTransaction,
    },
    feePayer,
  ];
}
