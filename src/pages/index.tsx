import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'

import { Container } from '@/styles/styles'
import WalletConnect from '@/components/WalletConnect'
import { NetworkConfig } from '@/types/types'
import { SDKProvider } from 'src/shared/SDKProvider'
import { Flex } from '@ledgerhq/react-ui'
import { useTranslation } from 'next-i18next'

export { getServerSideProps } from '../lib/serverProps'

const Index: NextPage = () => {
	const router = useRouter()

	const {
		params: rawParams,
		uri: rawURI,
		initialAccountId: rawInitialAccountId,
		mode: rawInitialMode,
	} = router.query

	const params =
		rawParams && typeof rawParams === 'string' ? JSON.parse(rawParams) : {}
	const networkConfigs: NetworkConfig[] = params.networks

	const uri = rawURI && typeof rawURI === 'string' ? rawURI : undefined
	const initialAccountId =
		rawInitialAccountId && typeof rawInitialAccountId === 'string'
			? rawInitialAccountId
			: undefined
	const initialMode =
		rawInitialMode === 'scan' || rawInitialMode === 'text'
			? rawInitialMode
			: undefined

	const [isMounted, setMounted] = useState<boolean>(false)

	const { t } = useTranslation()

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<Container>
			<Head>
				<title>Ledger Wallet Connect</title>
				<meta
					name="Ledger Wallet Connect"
					content="Ledger Wallet Connect"
				/>
			</Head>
			{isMounted ? (
				<SDKProvider networks={networkConfigs}>
					{(platformSDK, accounts) =>
						accounts.length > 0 ? (
							<WalletConnect
								initialMode={initialMode}
								initialAccountId={initialAccountId}
								networks={networkConfigs}
								initialURI={uri}
								platformSDK={platformSDK}
								accounts={accounts}
							/>
						) : (
							<Flex>{t('account.needed')}</Flex>
						)
					}
				</SDKProvider>
			) : null}
		</Container>
	)
}

export default Index
