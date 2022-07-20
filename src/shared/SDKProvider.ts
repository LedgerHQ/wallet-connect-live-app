import React, { useEffect, useRef, useState } from "react";
import LedgerLivePlatformSDK, {
    Account,
	WindowMessageTransport,
} from '@ledgerhq/live-app-sdk'
import { NetworkConfig } from "./types/types";

type SDKProviderProps = {
    networks: NetworkConfig[]
    children: (sdk: LedgerLivePlatformSDK, accounts: Account[]) => React.ReactElement
}

function filterAccountsForNetworks(accounts: Account[], networks: NetworkConfig[]): Account[] {
    const supportedCurrencies = networks.map(network => network.currency);

    return accounts.filter(account => {
        return supportedCurrencies.includes(account.currency);
    })
}

export function SDKProvider({ networks, children }: SDKProviderProps) {
	const platformSDKRef = useRef<LedgerLivePlatformSDK>(
		new LedgerLivePlatformSDK(new WindowMessageTransport()),
	)

    const [accounts, setAccounts] = useState<Account[] | undefined>(undefined);

    useEffect(() => {
        const platformSDK = platformSDKRef.current;
        platformSDK.connect();
        platformSDK.listAccounts().then(allAccounts => {
            const filteredAccounts = filterAccountsForNetworks(allAccounts, networks)
            setAccounts(filteredAccounts);
        });
    }, [networks]);

    if (accounts) {
        return children(platformSDKRef.current, accounts);
    }
    return null;
}
