import { Flex, Text, Box, CryptoIcon, Button } from '@ledgerhq/react-ui'
import styled, { useTheme } from 'styled-components'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import { Proposal } from '@/types/types'
import {
	formatChainName,
	formatUrl,
} from '@/components/WalletConnect/v2/utils/HelperUtil'
import { useTranslation } from 'next-i18next'
import LogoContainer from '@/components/WalletConnect/v2/components/LogoContainers/LedgerLogoContainer'
import Image from 'next/image'
import { SelectableRow } from '@/components/WalletConnect/v2/components/SelectableRow'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { space } from '@ledgerhq/react-ui/styles/theme'
import { Account } from '@ledgerhq/live-app-sdk'
import { ErrorIcon } from '@/components/WalletConnect/v2/icons/ErrorIcon'
import { Logo } from '@/components/WalletConnect/v2/icons/LedgerLiveLogo'
import { InfoSessionProposal } from '@/components/WalletConnect/v2/components/SessionProposal/InfoSessionProposal'
import { NoBlockchainSupported } from '@/components/WalletConnect/v2/components/SessionProposal/NoBlockchain'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	width: 100%;
	height: 100%;
	user-select: none;
	background: ${({ theme }) => theme.colors.background.main};
`

const DAppContainer = styled(Flex).attrs(
	(p: { size: number; borderColor: string; backgroundColor: string }) => ({
		position: 'absolute',
		right: '-50px',
		alignItems: 'center',
		justifyContent: 'center',
		heigth: p.size,
		width: p.size,
		borderRadius: 50.0,
		border: `3px solid ${p.borderColor}`,
		backgroundColor: p.backgroundColor,
		zIndex: 0,
	}),
)<{ size: number }>``

const Container = styled(Flex).attrs((p: { size: number }) => ({
	heigth: p.size,
	width: p.size,
	alignItems: 'center',
	justifyContent: 'center',
	position: 'relative',
	left: '-25px',
}))<{ size: number }>``

const ListChains = styled.ul`
	padding-left: 160px;
	padding-right: 160px;
`

const List = styled.ul``

const Header = styled(Flex)`
	flex-direction: column;
	justify-content: center;
	align-items: center;
`

const ButtonsContainer = styled(Flex)`
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	height: 80px;
	padding-left: 160px;
	padding-right: 160px;
`

const SUPPORTED_CHAINS = ['ethereum', 'bsc', 'polygon']

const getChains = (proposal: Proposal) =>
	Object.values(proposal.params.requiredNamespaces)

export default function SessionProposal() {
	const { colors } = useTheme()
	const { router } = useNavigation()
	const { t } = useTranslation()
	const [accounts, setAccounts] = useState<Account[]>([])
	const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

	const proposal = JSON.parse(router.query.data as string) as Proposal
	const proposer = proposal.params.proposer

	useEffect(() => {
		const accs = localStorage.getItem('accounts') ?? ''
		const parsedAccounts = (JSON.parse(accs) as Account[]) ?? []
		setAccounts(parsedAccounts)
	}, [])

	const handleClick = useCallback(
		(account: string) => {
			console.log(account)
			if (selectedAccounts.includes(account)) {
				setSelectedAccounts(
					selectedAccounts.filter((s) => s !== account),
				)
			} else {
				setSelectedAccounts([...selectedAccounts, account])
			}
		},
		[selectedAccounts],
	)

	const handleClose = useCallback(() => {
		router.push('/')
	}, [])

	const formatAccountsByChain = () => {
		const families = getChains(proposal)

		const chainsRequested = Object.values(families)
			.map((f) => f.chains)
			.reduce((value, acc) => acc.concat(value), [])

		const mappedChains = chainsRequested.map((chain) => {
			const formatedChain = formatChainName(chain).toLowerCase()

			return {
				chain: formatedChain,
				isSupported: SUPPORTED_CHAINS.includes(formatedChain),
				accounts: accounts.filter(
					(acc) => acc.currency === formatedChain,
				),
			}
		})

		return mappedChains
	}

	const accountsByChain = useMemo(() => formatAccountsByChain(), [proposal])
	const notSupportedChains = accountsByChain.filter(
		(entry) => !entry.isSupported,
	)
	const noChainsSupported =
		accountsByChain.filter((entry) => !entry.isSupported).length ===
		accountsByChain.length

	return (
		<WalletConnectContainer>
			{noChainsSupported ? (
				<>
					<NoBlockchainSupported />
					<ButtonsContainer>
						<Button variant="main" flex={1} onClick={handleClose}>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c00"
							>
								{t('sessionProposal.close')}
							</Text>
						</Button>
					</ButtonsContainer>
				</>
			) : (
				<>
					<Header mt={12} mb={10}>
						<Container>
							<LogoContainer>
								<Logo size={22} />
							</LogoContainer>

							<DAppContainer borderColor={colors.background.main}>
								<LogoContainer>
									{proposer.metadata.icons.length > 0 ? (
										<Image
											src={proposer.metadata.icons[0]}
											alt="Picture of the proposer"
											width={60}
											style={{
												borderRadius: '50%',
												borderLeft: '3px solid red',
											}}
											height={60}
										/>
									) : (
										<div></div>
									)}
								</LogoContainer>
							</DAppContainer>
						</Container>

						<Text variant="h4" mt={3} mb={2} uppercase={false}>
							{t('sessionProposal.connectTo', {
								name: proposer.metadata.name,
							})}
						</Text>

						<Text
							variant="h4"
							color={colors.neutral.c80}
							uppercase={false}
						>
							{formatUrl(proposer.metadata.url)}
						</Text>
					</Header>

					<ListChains>
						{accountsByChain
							.filter(
								(entry) =>
									entry.isSupported &&
									entry.accounts.length > 0,
							)
							.map((entry) => {
								return (
									<Box key={entry.chain} mb={6}>
										<Box mb={6}>
											<Text
												variant="subtitle"
												color={colors.neutral.c70}
											>
												{entry.chain}
											</Text>
										</Box>
										<List>
											{entry.accounts.map(
												(account, index: number) => (
													<li
														key={account.id}
														style={{
															marginBottom:
																index !==
																entry.accounts
																	.length -
																	1
																	? space[3]
																	: 0,
														}}
													>
														<SelectableRow
															title={account.name}
															subtitle={
																account.address
															}
															isSelected={selectedAccounts.includes(
																account.address,
															)}
															onSelect={() =>
																handleClick(
																	account.address,
																)
															}
															LeftIcon={
																<CryptoIcon
																	name="ETH"
																	circleIcon
																	size={24}
																/>
															}
														/>
													</li>
												),
											)}
										</List>
									</Box>
								)
							})}

						{notSupportedChains.length > 0 ? (
							<SelectableRow
								title={t('sessionProposal.notSupported', {
									count: notSupportedChains.length,
								})}
								subtitle={notSupportedChains
									.map((elem) => elem.chain)
									.join(', ')}
								isSelected={false}
								LeftIcon={<ErrorIcon />}
							/>
						) : null}

						<Box mt={6}>
							<InfoSessionProposal />
						</Box>
					</ListChains>

					<ButtonsContainer>
						<Button variant="shade" flex={0.9} mr={6}>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c100"
							>
								{t('sessionProposal.reject')}
							</Text>
						</Button>

						<Button variant="main" flex={0.9}>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c00"
							>
								{t('sessionProposal.connect')}
							</Text>
						</Button>
					</ButtonsContainer>
				</>
			)}
		</WalletConnectContainer>
	)
}
