import { useState, useEffect } from 'react'
import type { NextPage } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'

import { Container } from '@/styles/styles'
import { WalletApiClientProvider } from 'src/shared/WalletApiClientProvider'
import WalletConnect from '@/components/screens'

export { getServerSideProps } from '../lib/serverProps'

const Index: NextPage = () => {
	const router = useRouter()

	const { uri: rawURI, mode: rawInitialMode } = router.query

	const uri = rawURI && typeof rawURI === 'string' ? rawURI : undefined

	const initialMode =
		rawInitialMode === 'scan' || rawInitialMode === 'text'
			? rawInitialMode
			: undefined

	const [isMounted, setMounted] = useState<boolean>(false)

	useEffect(() => {
		setMounted(true)
	}, [])

	return (
		<Container>
			<Head>
				<title>Ledger WalletConnect</title>
				<meta
					name="Ledger WalletConnect"
					content="Ledger WalletConnect"
				/>
			</Head>
			{isMounted ? (
				<WalletApiClientProvider>
					{(accounts, userId, walletInfo) => (
						<WalletConnect
							initialMode={initialMode}
							initialURI={uri}
							accounts={accounts}
							userId={userId}
							walletInfo={walletInfo}
						/>
					)}
				</WalletApiClientProvider>
			) : null}
		</Container>
	)
}

export default Index
