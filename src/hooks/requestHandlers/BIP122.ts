import {
  type BIP122_REQUESTS,
  BIP122_RESPONSES,
  BIP122_SIGNING_METHODS,
  bip122SignMessageLegacySchema,
  bip122SignMessageSchema,
  bip122SignPsbtSchema,
} from "@/data/methods/BIP122.methods";
import { btcTransactionSchema, convertBtcToLiveTX } from "@/utils/converters";
import { getAccountWithAddressAndChainId } from "@/utils/generic";
import { isPSBTSupportEnabled } from "@/utils/helper.util";
import {
  decodePsbt,
  getAccountAddresses,
  getBip122Network,
  validatePsbtAccount,
  validateSignInputs,
} from "@/utils/psbt";
import type { Account, WalletAPIClient } from "@ledgerhq/wallet-api-client";
import type { IWalletKit } from "@reown/walletkit";
import {
  acceptRequest,
  Errors,
  formatMessage,
  isCanceledError,
  rejectRequest,
} from "./utils";

export async function handleBIP122Request(
  request: BIP122_REQUESTS,
  topic: string,
  id: number,
  chainId: string,
  accounts: Account[],
  client: WalletAPIClient,
  walletkit: IWalletKit,
  walletCapabilities: string[] = [],
) {
  switch (request.method) {
    case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE_LEGACY: {
      const params = bip122SignMessageLegacySchema.parse(request.params);

      const accountSign = getAccountWithAddressAndChainId(
        accounts,
        params.address,
        chainId,
      );
      if (accountSign) {
        try {
          const message = params.message;
          const signedMessage = await client.message.sign(
            accountSign.id,
            Buffer.from(message),
          );
          const result: BIP122_RESPONSES[typeof request.method] =
            formatMessage(signedMessage);

          await acceptRequest(walletkit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletkit, topic, id, Errors.userDecline);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletkit, topic, id, Errors.userDecline);
      }
      break;
    }
    case BIP122_SIGNING_METHODS.BIP122_SIGN_MESSAGE: {
      const params = bip122SignMessageSchema.parse(request.params);
      const accountSign = getAccountWithAddressAndChainId(
        accounts,
        params.address ?? params.account,
        chainId,
      );
      if (accountSign) {
        try {
          const message = params.message;
          const signedMessage = await client.message.sign(
            accountSign.id,
            Buffer.from(message),
          );
          const result: BIP122_RESPONSES[typeof request.method] = {
            address: accountSign.address,
            signature: formatMessage(signedMessage).replace("0x", ""),
          };

          await acceptRequest(walletkit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletkit, topic, id, Errors.userDecline);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletkit, topic, id, Errors.userDecline);
      }
      break;
    }
    case BIP122_SIGNING_METHODS.BIP122_SEND_TRANSFERT: {
      const btcTx = btcTransactionSchema.parse(request.params);
      const accountTX = getAccountWithAddressAndChainId(
        accounts,
        btcTx.account,
        chainId,
      );
      if (accountTX) {
        try {
          const liveTx = convertBtcToLiveTX(btcTx);
          const hash = await client.transaction.signAndBroadcast(
            accountTX.id,
            liveTx,
          );

          const result: BIP122_RESPONSES[typeof request.method] = {
            txid: hash,
          };

          await acceptRequest(walletkit, topic, id, result);
        } catch (error) {
          if (isCanceledError(error)) {
            await rejectRequest(walletkit, topic, id, Errors.txDeclined);
          } else {
            throw error;
          }
        }
      } else {
        await rejectRequest(walletkit, topic, id, Errors.txDeclined);
      }
      break;
    }
    case BIP122_SIGNING_METHODS.BIP122_SIGN_PSBT: {
      const params = bip122SignPsbtSchema.parse(request.params);

      // Check if wallet-api supports PSBT signing
      if (!isPSBTSupportEnabled(walletCapabilities)) {
        return rejectRequest(
          walletkit,
          topic,
          id,
          Errors.unsupportedMethods,
          5101,
        );
      }

      const account = getAccountWithAddressAndChainId(
        accounts,
        params.account,
        chainId,
      );

      if (!account) {
        return rejectRequest(walletkit, topic, id, Errors.txDeclined);
      }

      try {
        const network = getBip122Network(chainId);

        // Decode PSBT
        const psbt = decodePsbt(params.psbt);

        // Fetch all payment addresses for the account once (covers change addresses too)
        const accountAddresses = await getAccountAddresses(account, client);

        // Validate PSBT account - check if any input belongs to the account
        const validation = validatePsbtAccount(
          psbt,
          account,
          accountAddresses,
          network,
        );
        if (!validation.isValid || !validation.account) {
          return rejectRequest(walletkit, topic, id, Errors.txDeclined);
        }

        // If signInputs is provided, validate them against the PSBT and account
        if (params.signInputs && params.signInputs.length > 0) {
          const signInputsValidation = validateSignInputs(
            psbt,
            params.signInputs,
            validation.account,
            accountAddresses,
            network,
          );
          if (!signInputsValidation.isValid) {
            return rejectRequest(walletkit, topic, id, Errors.txDeclined);
          }
        }

        // Sign PSBT using wallet-api
        const signedPsbtResult = await client.bitcoin.signPsbt(
          account.id,
          params.psbt,
          params.broadcast ?? false,
        );

        const result: BIP122_RESPONSES[typeof request.method] = {
          psbt: signedPsbtResult.psbtSigned,
          ...(signedPsbtResult.txHash && { txid: signedPsbtResult.txHash }),
        };

        await acceptRequest(walletkit, topic, id, result);
      } catch (error) {
        if (isCanceledError(error)) {
          await rejectRequest(walletkit, topic, id, Errors.txDeclined);
        } else {
          throw error;
        }
      }
      break;
    }
    default:
      await rejectRequest(
        walletkit,
        topic,
        id,
        Errors.unsupportedMethods,
        5101,
      );
  }
}
