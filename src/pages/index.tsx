import { useState, useEffect, useContext } from 'react'
import type { GetServerSideProps, NextPage } from 'next'
import { useRouter } from 'next/router'
import Head from 'next/head'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import { getDefaultLanguage } from '@/helpers/generic'

import { Main, Container, MainContainer } from '@/styles/styles'
import { WalletConnect } from '@/components/WalletConnect'
import { NetworkConfig } from '@/types/types'

export const getServerSideProps: GetServerSideProps = async ({
	query,
	locale,
	locales,
}) => ({
	props: {
		...(await serverSideTranslations(
			getDefaultLanguage('en', locales, query.lang as string, locale),
			['common'],
		)),
	},
})

const Index: NextPage = () => {
	const router = useRouter()

	const { params: rawParams } = router.query

	const params =
		rawParams && typeof rawParams === 'string' ? JSON.parse(rawParams) : {}
	const networkConfigs: NetworkConfig[] = params.networks

	const [isMounted, setMounted] = useState<boolean>(false)

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
			{isMounted ? <WalletConnect networks={networkConfigs} /> : null}
		</Container>
	)
}

export default Index
