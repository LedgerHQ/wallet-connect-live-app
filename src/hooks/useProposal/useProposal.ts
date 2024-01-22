import { useCallback, useState } from "react";
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store";
import { accountSelector, useAccountsStore } from "@/storage/accounts.store";
import { getNamespace } from "@/helpers/helper.util";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { web3wallet } from "@/helpers/walletConnect.util";
import useAnalytics from "@/hooks/common/useAnalytics";
import { useLedgerLive } from "../common/useLedgerLive";
import { SupportedNamespace } from "@/data/network.config";
import { TabsIndexes } from "@/shared/navigation";
import { buildApprovedNamespaces } from "@walletconnect/utils";
import { formatAccountsByChain } from "@/hooks/useProposal/util";
import { useNavigate } from "@tanstack/react-router";
import { Web3WalletTypes } from "@walletconnect/web3wallet";

type ProposalProps = {
  proposal?: Web3WalletTypes.SessionProposal;
};

export function useProposal({ proposal }: ProposalProps) {
  const navigate = useNavigate();

  const addSession = useSessionsStore(sessionSelector.addSession);
  const accounts = useAccountsStore(accountSelector.selectAccounts);
  const addAccount = useAccountsStore(accountSelector.addAccount);
  const analytics = useAnalytics();

  const { initWalletApiClient, closeTransport } = useLedgerLive();

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

  const handleClose = () => {
    void navigate({ to: "/", search: { tab: TabsIndexes.Connect } });
    analytics.track("button_clicked", {
      button: "Close",
      page: "Wallet Connect Error Unsupported Blockchains",
    });
  };

  const buildSupportedNamespaces = (
    proposal: Web3WalletTypes.SessionProposal
  ) => {
    const accountsByChain = formatAccountsByChain(proposal, accounts).filter(
      (a) => a.accounts.length > 0 && a.isSupported
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
  };

  const approveSession = () => {
    if (!proposal) {
      return;
    }

    web3wallet
      .approveSession({
        id: proposal.id,
        namespaces: buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: buildSupportedNamespaces(proposal),
        }),
      })
      .then((res) => {
        addSession(res);
        void navigate({ to: "/detail/$topic", params: { topic: res.topic } });
      })
      .catch((error) => {
        console.error(error);
        // TODO : display error toast
        // void navigate({ to: "/", search: { tab: TabsIndexes.Connect } });
        void navigate({ to: "/" });
      });
  };

  const rejectSession = () => {
    if (!proposal) {
      return;
    }

    void web3wallet
      .rejectSession({
        id: proposal.id,
        reason: {
          code: 5000,
          message: "USER_REJECTED_METHODS",
        },
      })
      .finally(
        () => void navigate({ to: "/", search: { tab: TabsIndexes.Connect } })
      );
  };

  const addNewAccount = async (currency: string) => {
    const walletApiClient = initWalletApiClient();
    try {
      const newAccount = await walletApiClient.account.request({
        currencyIds: [currency],
      });
      addAccount(newAccount);
    } catch (error) {
      console.error("request account canceled by user");
    }
    closeTransport();
  };

  return {
    approveSession,
    rejectSession,
    proposer,
    handleClose,
    handleClick,
    accounts,
    selectedAccounts,
    formatAccountsByChain,
    addNewAccount,
  };
}
