import {
	formatChainName,
	formatUrl,
	getTicker,
} from '@/components/WalletConnect/v2/utils/HelperUtil'
import { web3wallet } from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { Box, Button, CryptoIcon, Flex, Text } from '@ledgerhq/react-ui'
import { useCallback, useMemo } from 'react'
import styled from 'styled-components'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import Link from 'next/link'
import { Account } from '@ledgerhq/live-app-sdk'
import { accounts } from '@/components/WalletConnect/v2/hooks/useLedgerLive'
import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { space } from '@ledgerhq/react-ui/styles/theme'
import {
	ButtonsContainer,
	List,
	Row,
	WalletConnectContainer,
} from '@/components/WalletConnect/v2/components/Containers/util'
export { getServerSideProps } from '../../lib/serverProps'

const DetailContainer = styled(Flex)`
	border-radius: 12px;
	background-color: ${(props) => props.theme.colors.neutral.c20};
	padding: 12px;
	flex-direction: column;
`
export default function SessionDetail() {
	const { t } = useTranslation()
	const { router, routes } = useNavigation()

	const session = Object.entries(web3wallet.getActiveSessions()).find(
		([key]) => key === JSON.parse(String(router.query?.data)),
	)?.[1]

	const handleDelete = useCallback(async () => {
		if (!session) return
		await web3wallet.disconnectSession({
			topic: session.topic,
			reason: {
				code: 3,
				message: 'Disconnect Session',
			},
		})
	}, [session])

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

			const account = accounts.find((a) => a.address === addrSplitted[2])

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

	if (!session) {
		return null
	}

	return (
		<WalletConnectContainer>
			<Link href={routes.connect}>
				<Text
					variant="body"
					mb={8}
					color="neutral.c100"
					style={{
						cursor: 'pointer',
					}}
				>
					Back
				</Text>
			</Link>

			<Text variant="h4" mb={8} color="neutral.c100">
				{t('sessions.detail.title')}
			</Text>

			<DetailContainer>
				<Row justifyContent="space-between" alignItems="center">
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
				</Row>

				<Row mt={10} justifyContent="space-between" alignItems="center">
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
				<Row mt={6} justifyContent="space-between" alignItems="center">
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

			<Flex mt={8}>
				{Array.from(sessionAccounts).map(([chain, accounts]) => {
					return (
						<Box key={chain} mb={6} flex={1}>
							<Box mb={6}>
								<Text variant="subtitle" color="neutral.c70">
									{chain}
								</Text>
							</Box>

							<List>
								{accounts.map(
									(account: Account, index: number) => (
										<li
											key={account.id}
											style={{
												marginBottom:
													index !==
													accounts.length - 1
														? space[3]
														: 0,
											}}
										>
											<GenericRow
												title={account.name}
												subtitle={account.address}
												LeftIcon={
													<CryptoIcon
														name={getTicker(chain)}
														circleIcon
														size={24}
													/>
												}
												rowType={RowType.Default}
											/>
										</li>
									),
								)}
							</List>
						</Box>
					)
				})}
			</Flex>
			<ButtonsContainer mt={4}>
				<Button variant="shade" flex={1} onClick={handleDelete}>
					<Link href={routes.connect}>
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
		</WalletConnectContainer>
	)
}
