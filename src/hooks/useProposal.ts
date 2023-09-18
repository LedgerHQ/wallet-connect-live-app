import { Proposal } from "@/types/types";
import { Account } from "@ledgerhq/wallet-api-client";
import { useCallback, useState } from "react";
import { useNavigation } from "@/hooks/common/useNavigation";
import { sessionSelector, useSessionsStore } from "@/storage/sessions.store";
import { accountSelector, useAccountsStore } from "@/storage/accounts.store";
import { getCurrencyByChainId, getDisplayName, getNamespace } from "@/helpers/helper.util";
import { EIP155_SIGNING_METHODS } from "@/data/methods/EIP155Data.methods";
import { web3wallet } from "@/helpers/walletConnect.util";
import useAnalytics from "@/hooks/common/useAnalytics";
import { useLedgerLive } from "./common/useLedgerLive";
import { SupportedNamespace, SUPPORTED_NETWORK } from "@/data/network.config";
import { Routes, TabsIndexes } from "@/shared/navigation";
import { buildApprovedNamespaces } from "@walletconnect/utils";

type Props = {
  proposal: Proposal;
};

type AccountsInChain = {
  chain: string;
  isSupported: boolean;
  isRequired: boolean;
  accounts: Account[];
  displayName: string;
};

export function useProposal({ proposal }: Props) {
  const { navigate, router } = useNavigation();

  const addSession = useSessionsStore(sessionSelector.addSession);
  const accounts = useAccountsStore(accountSelector.selectAccounts);
  const addAccount = useAccountsStore(accountSelector.addAccount);
  const analytics = useAnalytics();

  const { initWalletApiClient, closeTransport } = useLedgerLive();

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>([]);

  const proposer = proposal.params.proposer;

  const handleClick = useCallback(
    (account: string) => {
      if (selectedAccounts.includes(account)) {
        setSelectedAccounts(selectedAccounts.filter((s) => s !== account));
      } else {
        setSelectedAccounts([...selectedAccounts, account]);
      }
    },
    [selectedAccounts],
  );

  const handleClose = useCallback(() => {
    router.push(Routes.Home);
    analytics.track("button_clicked", {
      button: "Close",
      page: "Wallet Connect Error Unsupported Blockchains",
    });
  }, []);

  const getChains = (proposal: Proposal) => {
    const requiredNamespaces = Object.values(proposal.params.requiredNamespaces).map(
      (namespace) => ({ ...namespace, required: true }),
    );
    const optionalNamespaces = proposal.params.optionalNamespaces
      ? Object.values(proposal.params.optionalNamespaces)
      : [];

    return [...requiredNamespaces, ...optionalNamespaces];
  };

  const formatAccountsByChain = (proposal: Proposal, accounts: Account[]) => {
    const families = getChains(proposal);

    const chains = families.map((f) => f.chains).reduce((value, acc) => acc.concat(value), []);

    const chainsDeduplicated = [...Array.from(new Set(chains))];

    const mappedAccountsByChains: AccountsInChain[] = chainsDeduplicated.map((chain) => {
      const formatedChain = getCurrencyByChainId(chain);

      return {
        chain: formatedChain,
        displayName: getDisplayName(formatedChain),
        isSupported: Boolean(SUPPORTED_NETWORK[formatedChain] !== undefined),
        isRequired: families.some((family) => family.required && family.chains.includes(chain)),
        accounts: accounts.filter((acc) => acc.currency === formatedChain),
      };
    });

    return mappedAccountsByChains;
  };

  const buildSupportedNamespaces = (): Record<
    string,
    {
      chains: string[];
      methods: string[];
      events: string[];
      accounts: string[];
    }
  > => {
    const accountsByChain = formatAccountsByChain(proposal, accounts).filter(
      (a) => a.accounts.length > 0 && a.isSupported,
    );
    const dataToSend = accountsByChain.reduce<{ account: string; chain: string }[]>(
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

    const requiredNamespaces = proposal.params.requiredNamespaces;
    const namespace =
      requiredNamespaces && Object.keys(requiredNamespaces).length > 0
        ? requiredNamespaces[SupportedNamespace.EIP155]
        : { methods: [] as string[], events: [] as string[] };

    const methods = [...new Set(namespace.methods.concat(Object.values(EIP155_SIGNING_METHODS)))];
    const events = [
      ...new Set(
        namespace.events.concat([
          "session_proposal",
          "session_request",
          "auth_request",
          "session_delete",
        ]),
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

  const approveSession = useCallback(async () => {
    web3wallet
      .approveSession({
        id: proposal.id,
        namespaces: buildApprovedNamespaces({
          proposal: proposal.params,
          supportedNamespaces: buildSupportedNamespaces(),
        }),
      })
      .then((res) => {
        addSession(res);
        navigate(Routes.SessionDetails, res.topic);
      })
      .catch((error) => {
        console.error(error);
        // TODO : display error toast
        navigate(Routes.Home, { tab: TabsIndexes.Connect });
      });
  }, [proposal]);

  const rejectSession = useCallback(async () => {
    await web3wallet.rejectSession({
      id: proposal.id,
      reason: {
        code: 5000,
        message: "USER_REJECTED_METHODS",
      },
    });
    navigate(Routes.Home);
  }, [proposal]);

  const addNewAccount = useCallback(async (currency: string) => {
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
  }, []);

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
