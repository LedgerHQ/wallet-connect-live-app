import {
	formatChainName,
	formatUrl,
	getTicker,
	truncate,
} from '@/helpers/helper.util'
import { Box, Button, CryptoIcon, Flex, Text } from '@ledgerhq/react-ui'
import { ArrowLeftMedium } from '@ledgerhq/react-ui/assets/icons'
import { useCallback, useEffect, useMemo } from 'react'
import styled from 'styled-components'
import { useTranslation } from 'next-i18next'
import useNavigation from '@/hooks/common/useNavigation'
import Link from 'next/link'
import { Account } from '@ledgerhq/wallet-api-client'
import { GenericRow, RowType } from '@/components/atoms/GenericRow'
import { InfoSessionProposal } from '@/components/screens/sessions/sessionProposal/InfoSessionProposal'
import { space } from '@ledgerhq/react-ui/styles/theme'
import {
	ButtonsContainer,
	List,
	Row,
} from '@/components/atoms/containers/Elements'
import { ResponsiveContainer } from '@/styles/styles'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'
import { useAccountsStore, accountSelector } from '@/storage/accounts.store'
import useHydratation from 'src/hooks/useHydratation'
import { web3wallet } from '@/helpers/walletConnect.util'
import { ImageWithPlaceholder } from '@/components/atoms/images/ImageWithPlaceholder'
import useAnalytics from 'src/shared/useAnalytics'

export { getServerSideProps } from '../lib/serverProps'

const DetailContainer = styled(Flex)`
	border-radius: 12px;
	background-color: ${(props) => props.theme.colors.neutral.c20};
	padding: 12px;
	flex-direction: column;
`
const BackButton = styled(Flex)`
	cursor: pointer;
	&:hover {
		opacity: 0.7;
	}
`

const CustomList = styled(Flex)`
	flex-direction: column;
`

export default function SessionDetail() {
	const { hydrated } = useHydratation()
	const { t } = useTranslation()
	const { router, routes, navigate, tabsIndexes } = useNavigation()

	const accounts = useAccountsStore(accountSelector.selectAccounts)
	const sessions = useSessionsStore(sessionSelector.selectSessions)
	const removeSession = useSessionsStore(sessionSelector.removeSession)
	const setLastSessionVisited = useSessionsStore(
		sessionSelector.setLastSessionVisited,
	)
	const session = useSessionsStore(sessionSelector.selectLastSession)

	const navigateToSessionsHomeTab = useCallback(() => {
		navigate(routes.home, { tab: tabsIndexes.sessions })
	}, [routes, tabsIndexes])
	const analytics = useAnalytics()

	useEffect(() => {
		analytics.page('Wallet Connect Session Detail', {
			dapp: session?.peer?.metadata?.name,
			url: session?.peer?.metadata?.url,
		})
	}, [])

	useEffect(() => {
		if (!!router.query.data) {
			const session = sessions.find(
				(elem) => elem.topic === JSON.parse(String(router.query?.data)),
			)
			setLastSessionVisited(session || null)
		}
	}, [router.query])

	const handleDelete = useCallback(async () => {
		if (!session) return
		try {
			web3wallet.disconnectSession({
				topic: session.topic,
				reason: {
					code: 3,
					message: 'Disconnect Session',
				},
			})
			analytics.track('button_clicked', {
				button: 'WC-Disconnect Session',
				page: 'Wallet Connect Session Detail',
			})
		} catch (error) {
			throw new Error(String(error))
		}
		removeSession(session.topic)
		navigateToSessionsHomeTab()
	}, [session])

	const onGoBack = useCallback(() => {
		navigateToSessionsHomeTab()
		analytics.track('button_clicked', {
			button: 'WC-Back',
			page: 'Wallet Connect Session Detail',
		})
	}, [])

	const metadata = session?.peer.metadata
	const fullAddresses = !session
		? []
		: Object.entries(session.namespaces).reduce(
				(acc, elem) => acc.concat(elem[1].accounts),
				[] as string[],
		  )

	const getAccountsFromAddresses = (addresses: string[]) => {
		const accountsByChain = new Map<string, Account[]>()

		addresses.forEach((addr) => {
			const addrSplitted = addr.split(':')

			const formatedChain = formatChainName(
				`${addrSplitted[0]}:${addrSplitted[1]}`,
			).toLowerCase()

			const existingEntry = accountsByChain.get(formatedChain)

			const account = accounts.find(
				(a) =>
					a.address === addrSplitted[2] &&
					formatedChain === a.currency,
			)

			if (account) {
				accountsByChain.set(
					formatedChain,
					existingEntry ? [...existingEntry, account] : [account],
				)
			}
		})
		return accountsByChain
	}

	const sessionAccounts = useMemo(
		() => getAccountsFromAddresses(fullAddresses),
		[fullAddresses, accounts],
	)

	if (!hydrated) {
		// Returns null on first render, so the client and server match
		return null
	}

	if (!session) {
		navigateToSessionsHomeTab()
	}

	return (
		<Flex
			flex={1}
			alignItems="center"
			justifyContent="center"
			width="100%"
			height="auto"
		>
			<ResponsiveContainer>
				<Flex
					width="100%"
					height="100%"
					flex={1}
					flexDirection="column"
					alignItems="center"
					justifyContent="space-between"
				>
					<Flex flexDirection="column" width="100%">
						<BackButton onClick={onGoBack}>
							<Flex mt={8} mb={8}>
								<ArrowLeftMedium
									size={24}
									color="neutral.c100"
								/>
							</Flex>
						</BackButton>

						<Text variant="h4" mb={8} color="neutral.c100">
							{t('sessions.detail.title')}
						</Text>

						<DetailContainer>
							<Row
								justifyContent="space-between"
								alignItems="center"
							>
								<Flex
									flexDirection="row"
									justifyContent="space-between"
									alignItems="center"
								>
									<ImageWithPlaceholder
										icon={metadata?.icons[0]}
									/>

									<Flex flexDirection="column" ml={5}>
										<Text
											variant="body"
											fontWeight="semiBold"
											color="neutral.c100"
										>
											{metadata?.name}
										</Text>

										<Text
											variant="small"
											fontWeight="medium"
											color="neutral.c70"
											mt={1}
										>
											{formatUrl(metadata?.url ?? '')}
										</Text>
									</Flex>
								</Flex>
							</Row>

							<Row
								mt={10}
								justifyContent="space-between"
								alignItems="center"
							>
								<Text
									variant="small"
									fontWeight="medium"
									color="neutral.c100"
								>
									{t('sessions.detail.connected')}
								</Text>

								<Text
									variant="small"
									fontWeight="medium"
									color="neutral.c70"
								>
									{new Date().toDateString()}
								</Text>
							</Row>
							<Row
								mt={6}
								justifyContent="space-between"
								alignItems="center"
							>
								<Text
									variant="small"
									fontWeight="medium"
									color="neutral.c100"
								>
									{t('sessions.detail.expires')}
								</Text>
								{session && (
									<Text
										variant="small"
										fontWeight="medium"
										color="neutral.c70"
									>
										{
											//https://stackoverflow.com/a/37001827
											new Date(
												session.expiry * 1000,
											).toDateString()
										}
									</Text>
								)}
							</Row>
						</DetailContainer>
						<Text variant="h4" mt={8} mb={6} color="neutral.c100">
							{t('sessions.detail.accounts')}
						</Text>

						<CustomList>
							{Array.from(sessionAccounts).map(
								([chain, accounts]) => {
									return (
										<Box key={chain} mb={6} flex={1}>
											<Box mb={6}>
												<Text
													variant="subtitle"
													color="neutral.c70"
												>
													{chain}
												</Text>
											</Box>

											<List>
												{accounts.map(
													(
														account: Account,
														index: number,
													) => (
														<li
															key={account.id}
															style={{
																marginBottom:
																	index !==
																	accounts.length -
																		1
																		? space[3]
																		: 0,
															}}
														>
															<GenericRow
																title={
																	account.name
																}
																subtitle={truncate(
																	account.address,
																	30,
																)}
																LeftIcon={
																	<CryptoIcon
																		name={getTicker(
																			chain,
																		)}
																		circleIcon
																		size={
																			24
																		}
																	/>
																}
																rowType={
																	RowType.Default
																}
															/>
														</li>
													),
												)}
											</List>
										</Box>
									)
								},
							)}

							<Box mt={6}>
								<InfoSessionProposal isInSessionDetails />
							</Box>
						</CustomList>
					</Flex>
					<ButtonsContainer mt={5}>
						<Button
							variant="shade"
							size="large"
							flex={1}
							onClick={handleDelete}
						>
							<Link href={routes.home}>
								<Text
									variant="body"
									fontWeight="semiBold"
									color="neutral.c100"
								>
									{t('sessions.detail.disconnect')}
								</Text>
							</Link>
						</Button>
					</ButtonsContainer>
				</Flex>
			</ResponsiveContainer>
		</Flex>
	)
}
