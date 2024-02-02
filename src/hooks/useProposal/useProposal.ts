import { useCallback, useState } from "react";
import { getNamespace } from "@/utils/helper.util";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import useAnalytics from "@/hooks/useAnalytics";
import { SupportedNamespace } from "@/data/network.config";
import { TabsIndexes } from "@/types/types";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
import { useNavigate } from "@tanstack/react-router";
import { Web3WalletTypes } from "@walletconnect/web3wallet";
import { useQueryClient } from "@tanstack/react-query";
import { web3walletAtom } from "@/store/web3wallet.store";
import { useAtomValue } from "jotai";
import useAccounts, { queryKey as accountsQueryKey } from "@/hooks/useAccounts";
import { walletAPIClientAtom } from "@/store/wallet-api.store";
import { queryKey as sessionsQueryKey } from "../useSessions";

export function useProposal(proposal?: Web3WalletTypes.SessionProposal) {
  const navigate = useNavigate();

  const queryClient = useQueryClient();

  const client = useAtomValue(walletAPIClientAtom);

  const accounts = useAccounts(client);

  const web3wallet = useAtomValue(web3walletAtom);

  const analytics = useAnalytics();

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const proposer = proposal?.params.proposer;

  const handleClick = useCallback(
    (account: string) => {
      if (selectedAccounts.includes(account)) {
        setSelectedAccounts(selectedAccounts.filter((s) => s !== account));
      } else {
        setSelectedAccounts([...selectedAccounts, account]);
      }
    },
    [selectedAccounts]
  );

  const handleClose = useCallback(() => {
    void navigate({
      to: "/",
      search: (search) => ({ ...search, tab: TabsIndexes.Connect }),
    });
    analytics.track("button_clicked", {
      button: "Close",
      page: "Wallet Connect Error Unsupported Blockchains",
    });
  }, [analytics, navigate]);

  const buildSupportedNamespaces = useCallback(
    (proposal: Web3WalletTypes.SessionProposal) => {
      const accountsByChain = formatAccountsByChain(
        proposal,
        accounts.data
      ).filter((a) => a.accounts.length > 0 && a.isSupported);
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
              }))
          ),
        []
      );

      const requiredNamespaces = proposal.params.requiredNamespaces;
      const namespace =
        requiredNamespaces && Object.keys(requiredNamespaces).length > 0
          ? requiredNamespaces[SupportedNamespace.EIP155]
          : { methods: [] as string[], events: [] as string[] };

      const methods = [
        ...new Set(
          namespace.methods.concat(Object.values(EIP155_SIGNING_METHODS))
        ),
      ];
      const events = [
        ...new Set(
          namespace.events.concat([
            "session_proposal",
            "session_request",
            "auth_request",
            "session_delete",
          ])
        ),
      ];

      return {
        [SupportedNamespace.EIP155]: {
          chains: [...new Set(dataToSend.map((e) => e.chain))],
          methods,
          events,
          accounts: dataToSend.map((e) => e.account),
        },
      };
    },
    [accounts.data, selectedAccounts]
  );

  const approveSession = useCallback(async () => {
    if (!proposal) {
      return;
    }

    try {
      const session = await web3wallet.approveSession({
        id: proposal.id,
        namespaces: buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: buildSupportedNamespaces(proposal),
        }),
      });
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      await navigate({
        to: "/detail/$topic",
        params: { topic: session.topic },
        search: (search) => search,
      });
    } catch (error) {
      // TODO : display error toast
      console.error(error);
      await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
      // void navigate({ to: "/", search: (search) => search }); // cannot be typed correctly with default fallback
      await navigate({
        to: "/",
        search: (search) => ({ ...search, tab: TabsIndexes.Connect }),
      });
    }
  }, [buildSupportedNamespaces, navigate, proposal, queryClient, web3wallet]);

  const rejectSession = useCallback(async () => {
    if (!proposal) {
      return;
    }

    await web3wallet.rejectSession({
      id: proposal.id,
      reason: {
        code: 5000,
        message: "USER_REJECTED_METHODS",
      },
    });
    await queryClient.invalidateQueries({ queryKey: sessionsQueryKey });
    await navigate({
      to: "/",
      search: (search) => ({ ...search, tab: TabsIndexes.Connect }),
    });
  }, [navigate, proposal, queryClient, web3wallet]);

  const addNewAccount = useCallback(
    async (currency: string) => {
      if (!client) {
        return;
      }
      try {
        await client.account.request({
          currencyIds: [currency],
        });
        // TODO Maybe we should also select the requested account
      } catch (error) {
        console.error("request account canceled by user");
      }
      // refetch accounts
      await queryClient.invalidateQueries({ queryKey: accountsQueryKey });
    },
    [client, queryClient]
  );

  // No need for a memo as it's directly spread on usage
  return {
    approveSession,
    rejectSession,
    proposer,
    handleClose,
    handleClick,
    accounts: accounts.data,
    selectedAccounts,
    addNewAccount,
  };
}
