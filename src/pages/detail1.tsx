import {
	formatUrl,
	getTicker,
	truncate,
} from '@/components/WalletConnect/v2/utils/HelperUtil'
import { Box, Button, CryptoIcon, Flex, Text } from '@ledgerhq/react-ui'
import { ArrowLeftMedium } from '@ledgerhq/react-ui/assets/icons'
import { useCallback } from 'react'
import styled from 'styled-components'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import Link from 'next/link'
import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { InfoSessionProposal } from '@/components/WalletConnect/v2/components/SessionProposal/InfoSessionProposal'
import {
	ButtonsContainer,
	Row,
} from '@/components/WalletConnect/v2/components/Containers/util'
import { ResponsiveContainer } from '@/styles/styles'
import { walletConnectV1Logic } from '@/components/WalletConnect/v2/hooks/useWalletConnectV1Logic'

export { getServerSideProps } from '../lib/serverProps'

const DetailContainer = styled(Flex)`
	border-radius: 12px;
	background-color: ${(props) => props.theme.colors.neutral.c20};
	padding: 12px;
	flex-direction: column;
`

const V1Container = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	border: ${(p) => `1px solid ${p.theme.colors.neutral.c70}`};
	border-radius: ${(p) => p.theme.space[2]}px;
	padding: ${(p) => p.theme.space[2]}px;
`

export default function SessionDetail() {
	const { t } = useTranslation()
	const { routes, navigate, tabsIndexes } = useNavigation()

	const session = walletConnectV1Logic.session
	const account = walletConnectV1Logic.selectedAccount

	const navigateToSessionsHomeTab = useCallback(() => {
		navigate(routes.home, { tab: tabsIndexes.sessions })
	}, [routes, tabsIndexes])

	const handleDelete = useCallback(async () => {
		if (!session) return
		walletConnectV1Logic.handleDisconnect()
		navigateToSessionsHomeTab()
	}, [session])

	const metadata = session?.peerMeta

	if (!session) {
		return null
	}

	return (
		<Flex
			flex={1}
			alignItems="center"
			justifyContent="center"
			width="100%"
			height="100%"
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
						<Flex onClick={navigateToSessionsHomeTab}>
							<Flex mt={10} mb={8}>
								<ArrowLeftMedium
									size={24}
									color="neutral.c100"
								/>
							</Flex>
						</Flex>

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
									<Image
										src={metadata?.icons[0] ?? ''}
										alt="Picture of the proposer"
										width={32}
										style={{
											borderRadius: '8px',
										}}
										height={32}
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
								<Flex>
									<V1Container>
										<Text
											variant="tiny"
											fontWeight="semiBold"
											color="neutral.c70"
										>
											WalletConnect v1
										</Text>
									</V1Container>
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
									{/* TODO : Save date of connection instead of displaying the current date */}
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

								<Text
									variant="small"
									fontWeight="medium"
									color="neutral.c70"
								>
									{new Date(session.expiry).toDateString()}
								</Text>
							</Row>
						</DetailContainer>
						<Text variant="h4" mt={8} mb={6} color="neutral.c100">
							{t('sessions.detail.account')}
						</Text>
						<Box key={account.currency} mb={6} flex={1}>
							<GenericRow
								title={account.name}
								subtitle={truncate(account.address, 30)}
								onClick={
									walletConnectV1Logic.handleSwitchAccount
								}
								LeftIcon={
									<CryptoIcon
										name={getTicker(account.currency)}
										circleIcon
										size={24}
									/>
								}
								rightElement={
									<Text
										variant="small"
										fontWeight="medium"
										color="neutral.c70"
									>
										{t('sessions.switch')}
									</Text>
								}
								rowType={RowType.Detail}
							/>
						</Box>
						<Box mt={6}>
							<InfoSessionProposal isInSessionDetails />
						</Box>
					</Flex>
					<ButtonsContainer mt={4}>
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
