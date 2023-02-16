import { Flex, Text, Box, CryptoIcon, Button } from '@ledgerhq/react-ui'
import styled, { useTheme } from 'styled-components'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import { Proposal } from '@/types/types'
import { formatUrl } from '@/components/WalletConnect/v2/utils/HelperUtil'
import { useTranslation } from 'next-i18next'
import LogoContainer from '@/components/WalletConnect/v2/components/LogoContainers/LedgerLogoContainer'
import Image from 'next/image'
import { SelectableRow } from '@/components/WalletConnect/v2/components/SelectableRow'
import { space } from '@ledgerhq/react-ui/styles/theme'
import { ErrorIcon } from '@/components/WalletConnect/v2/icons/ErrorIcon'
import { Logo } from '@/components/WalletConnect/v2/icons/LedgerLiveLogo'
import { InfoSessionProposal } from '@/components/WalletConnect/v2/components/SessionProposal/InfoSessionProposal'
import { ErrorBlockchainSupport } from '@/components/WalletConnect/v2/components/SessionProposal/ErrorBlockchainSupport'
import { useProposal } from '@/components/WalletConnect/v2/hooks/useProposal'
import { useMemo } from 'react'
import { AddAccountPlaceholder } from '@/components/WalletConnect/v2/components/SessionProposal/AddAccountPlaceholder'
import { WalletConnectMedium } from '@ledgerhq/react-ui/assets/icons'

export { getServerSideProps } from '../../lib/serverProps'

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
		right: '-55px',
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

export default function SessionProposal() {
	const { colors } = useTheme()
	const { router } = useNavigation()
	const { t } = useTranslation()
	const proposal = JSON.parse(router.query.data as string) as Proposal
	const {
		handleClick,
		handleClose,
		approveSession,
		rejectSession,
		formatAccountsByChain,
		accounts,
		selectedAccounts,
		proposer,
		addNewAccount,
	} = useProposal({ proposal })

	const accountsByChain = useMemo(
		() => formatAccountsByChain(proposal, accounts),
		[proposal, accounts],
	)
	const notSupportedChains = accountsByChain.filter(
		(entry) => !entry.isSupported,
	)
	const noChainsSupported =
		accountsByChain.filter((entry) => !entry.isSupported).length ===
		accountsByChain.length

	const PartialChainsSupported =
		!!accountsByChain.find((entry) => !entry.isSupported) &&
		!!accountsByChain.find((entry) => entry.isSupported)

	const allChainsSupported =
		accountsByChain.filter((entry) => entry.isSupported).length ===
		accountsByChain.length

	return (
		<WalletConnectContainer>
			{noChainsSupported || PartialChainsSupported ? (
				<>
					<ErrorBlockchainSupport appName={proposer.metadata.name} />
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
			) : null}

			{allChainsSupported ? (
				<>
					<Header mt={12} mb={10}>
						{proposer.metadata.icons.length > 0 ? (
							<Container>
								<LogoContainer>
									<Logo size={30} />
								</LogoContainer>

								<DAppContainer
									borderColor={colors.background.main}
								>
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
						) : (
							<LogoContainer>
								<WalletConnectMedium size={30} />
							</LogoContainer>
						)}

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
							.filter((entry) => entry.isSupported)
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
										{entry.accounts.length > 0 ? (
											<List>
												{entry.accounts.map(
													(
														account,
														index: number,
													) => (
														<li
															key={account.id}
															style={{
																marginBottom:
																	index !==
																	entry
																		.accounts
																		.length -
																		1
																		? space[3]
																		: 0,
															}}
														>
															<SelectableRow
																title={
																	account.name
																}
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
																		size={
																			24
																		}
																	/>
																}
															/>
														</li>
													),
												)}
											</List>
										) : (
											<AddAccountPlaceholder
												onClick={() =>
													addNewAccount(entry.chain)
												}
											/>
										)}
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
						<Button
							variant="shade"
							flex={0.9}
							mr={6}
							onClick={rejectSession}
						>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c100"
							>
								{t('sessionProposal.reject')}
							</Text>
						</Button>

						<Button
							variant="main"
							flex={0.9}
							onClick={approveSession}
							disabled={selectedAccounts.length === 0}
						>
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
			) : null}
		</WalletConnectContainer>
	)
}
