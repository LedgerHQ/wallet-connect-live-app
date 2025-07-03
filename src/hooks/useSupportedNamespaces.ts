import { BIP122_SIGNING_METHODS } from "@/data/methods/BIP122.methods";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { MULTIVERSX_SIGNING_METHODS } from "@/data/methods/MultiversX.methods";
// import { RIPPLE_SIGNING_METHODS } from "@/data/methods/Ripple.methods";
import { SOLANA_SIGNING_METHODS } from "@/data/methods/Solana.methods";
import { WALLET_METHODS } from "@/data/methods/Wallet.methods";
import {
  BIP122_CHAINS,
  EIP155_CHAINS,
  MULTIVERS_X_CHAINS,
  // RIPPLE_CHAINS,
  SOLANA_CHAINS,
  SupportedNamespace,
} from "@/data/network.config";
import useAccounts from "@/hooks/useAccounts";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
import { walletAPIClientAtom, walletInfosAtom } from "@/store/wallet-api.store";
import { getNamespace, isSolanaSupportEnabled } from "@/utils/helper.util";
import { ProposalTypes, SessionTypes } from "@walletconnect/types";
import { BuildApprovedNamespacesParams } from "@walletconnect/utils";
import { useAtomValue } from "jotai";
import { useCallback } from "react";

export function useSupportedNamespaces(
  session: SessionTypes.Struct | ProposalTypes.Struct,
  selectedAccounts: string[],
) {
  const client = useAtomValue(walletAPIClientAtom);
  const walletInfos = useAtomValue(walletInfosAtom);
  const accounts = useAccounts(client);

  const buildEip155Namespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
        walletInfos,
      ).filter((a) => {
        return (
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(EIP155_CHAINS).includes(a.chain)
        );
      });
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(EIP155_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.EIP155]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.EIP155]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];
      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.EIP155]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.EIP155]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [session, accounts.data, walletInfos, selectedAccounts],
  );

  const buildMvxNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
        walletInfos,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(MULTIVERS_X_CHAINS).includes(a.chain),
      );
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(MULTIVERSX_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.MVX]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.MVX]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.MVX]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.MVX]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [session, accounts.data, walletInfos, selectedAccounts],
  );

  const buildBip122Namespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
        walletInfos,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(BIP122_CHAINS).includes(a.chain),
      );
      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => ({
                account: `${getNamespace(a.currency)}:${a.address}`,
                chain: getNamespace(a.currency),
              })),
          ),
        [],
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(BIP122_SIGNING_METHODS),
      ];

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.BIP122]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.BIP122]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.BIP122]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.BIP122]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [session, accounts.data, walletInfos, selectedAccounts],
  );

  // const buildXrpNamespace = useCallback(
  //   (
  //     requiredNamespaces: ProposalTypes.RequiredNamespaces,
  //     optionalNamespaces: ProposalTypes.OptionalNamespaces,
  //   ) => {
  //     const accountsByChain = formatAccountsByChain(
  //       session,
  //       accounts.data,
  //       walletInfos,
  //     ).filter(
  //       (a) =>
  //         a.accounts.length > 0 &&
  //         a.isSupported &&
  //         Object.keys(RIPPLE_CHAINS).includes(a.chain),
  //     );
  //     const dataToSend = accountsByChain.reduce<
  //       { account: string; chain: string }[]
  //     >(
  //       (accum, elem) =>
  //         accum.concat(
  //           elem.accounts
  //             .filter((acc) => selectedAccounts.includes(acc.id))
  //             .map((a) => ({
  //               account: `${getNamespace(a.currency)}:${a.address}`,
  //               chain: getNamespace(a.currency),
  //             })),
  //         ),
  //       [],
  //     );

  //     const supportedMethods: string[] = [
  //       ...Object.values(WALLET_METHODS),
  //       ...Object.values(RIPPLE_SIGNING_METHODS),
  //     ];

  //     const methods = [
  //       ...new Set([
  //         ...(requiredNamespaces[SupportedNamespace.XRPL]?.methods.filter(
  //           (method) => supportedMethods.includes(method),
  //         ) ?? []),
  //         ...(optionalNamespaces[SupportedNamespace.XRPL]?.methods.filter(
  //           (method) => supportedMethods.includes(method),
  //         ) ?? []),
  //       ]),
  //     ];

  //     const events = [
  //       ...new Set([
  //         ...(requiredNamespaces[SupportedNamespace.XRPL]?.events ?? []),
  //         ...(optionalNamespaces[SupportedNamespace.XRPL]?.events ?? []),
  //       ]),
  //     ];

  //     return {
  //       chains: [...new Set(dataToSend.map((e) => e.chain))],
  //       methods,
  //       events,
  //       accounts: dataToSend.map((e) => e.account),
  //     };
  //   },
  //   [session, accounts.data, walletInfos, selectedAccounts],
  // );

  const buildSolanaNamespace = useCallback(
    (
      requiredNamespaces: ProposalTypes.RequiredNamespaces,
      optionalNamespaces: ProposalTypes.OptionalNamespaces,
    ) => {
      const accountsByChain = formatAccountsByChain(
        session,
        accounts.data,
        walletInfos,
      ).filter(
        (a) =>
          a.accounts.length > 0 &&
          a.isSupported &&
          Object.keys(SOLANA_CHAINS).includes(a.chain),
      );

      const supportedMethods: string[] = [
        ...Object.values(WALLET_METHODS),
        ...Object.values(SOLANA_SIGNING_METHODS),
      ];

      const isLegacy =
        requiredNamespaces[SupportedNamespace.SOLANA]?.chains?.[0] ===
          "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ" ||
        optionalNamespaces[SupportedNamespace.SOLANA]?.chains?.[0] ===
          "solana:4sGjMW1sUnHzSxGspuhpqLDx6wiyjNtZ";

      const dataToSend = accountsByChain.reduce<
        { account: string; chain: string }[]
      >(
        (accum, elem) =>
          accum.concat(
            elem.accounts
              .filter((acc) => selectedAccounts.includes(acc.id))
              .map((a) => {
                let currency = a.currency;
                if (isLegacy) {
                  currency = "solana (legacy)";
                }
                return {
                  account: `${getNamespace(currency)}:${a.address}`,
                  chain: getNamespace(currency),
                };
              }),
          ),
        [],
      );

      const methods = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.SOLANA]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
          ...(optionalNamespaces[SupportedNamespace.SOLANA]?.methods.filter(
            (method) => supportedMethods.includes(method),
          ) ?? []),
        ]),
      ];

      const events = [
        ...new Set([
          ...(requiredNamespaces[SupportedNamespace.SOLANA]?.events ?? []),
          ...(optionalNamespaces[SupportedNamespace.SOLANA]?.events ?? []),
        ]),
      ];

      return {
        chains: [...new Set(dataToSend.map((e) => e.chain))],
        methods,
        events,
        accounts: dataToSend.map((e) => e.account),
      };
    },
    [session, accounts.data, walletInfos, selectedAccounts],
  );

  const buildSupportedNamespaces = useCallback(
    (session: SessionTypes.Struct | ProposalTypes.Struct) => {
      const { requiredNamespaces, optionalNamespaces } = session;

      const supportedNamespaces: BuildApprovedNamespacesParams["supportedNamespaces"] =
        {};

      if ("bip122" in requiredNamespaces || "bip122" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.BIP122] = buildBip122Namespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      if ("eip155" in requiredNamespaces || "eip155" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.EIP155] = buildEip155Namespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      if ("mvx" in requiredNamespaces || "mvx" in optionalNamespaces) {
        supportedNamespaces[SupportedNamespace.MVX] = buildMvxNamespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      // if ("xrpl" in requiredNamespaces || "xrpl" in optionalNamespaces) {
      //   supportedNamespaces[SupportedNamespace.XRPL] = buildXrpNamespace(
      //     requiredNamespaces,
      //     optionalNamespaces,
      //   );
      // }
      if (
        ("solana" in requiredNamespaces || "solana" in optionalNamespaces) &&
        isSolanaSupportEnabled(walletInfos)
      ) {
        supportedNamespaces[SupportedNamespace.SOLANA] = buildSolanaNamespace(
          requiredNamespaces,
          optionalNamespaces,
        );
      }
      return supportedNamespaces;
    },
    [
      buildBip122Namespace,
      buildEip155Namespace,
      buildMvxNamespace,
      // buildXrpNamespace,
      buildSolanaNamespace,
      walletInfos,
    ],
  );

  return {
    buildEip155Namespace,
    buildSupportedNamespaces,
  };
}
