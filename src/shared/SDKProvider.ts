import React, { useEffect, useRef, useState } from "react";
import LedgerLivePlatformSDK, {
    Account,
	WindowMessageTransport,
} from '@ledgerhq/live-app-sdk'

type SDKProviderProps = {
    children: (sdk: LedgerLivePlatformSDK, accounts: Account[]) => React.ReactElement
}

export function SDKProvider({ children }: SDKProviderProps) {
	const platformSDKRef = useRef<LedgerLivePlatformSDK>(
		new LedgerLivePlatformSDK(new WindowMessageTransport()),
	)

    const [accounts, setAccounts] = useState<Account[] | undefined>(undefined);

    useEffect(() => {
        const platformSDK = platformSDKRef.current;
        platformSDK.connect();
        platformSDK.listAccounts().then(accounts => {
            setAccounts(accounts);
        });
    }, []);

    if (accounts) {
        return children(platformSDKRef.current, accounts);
    }
    return null;
}
