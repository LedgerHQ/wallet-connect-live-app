import { Flex, Text, Box, CryptoIcon } from '@ledgerhq/react-ui'
import styled, { useTheme } from 'styled-components'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import { Proposal } from '@/types/types'
import {
	formatChainName,
	formatUrl,
} from '@/components/WalletConnect/v2/utils/HelperUtil'
import { useTranslation } from 'next-i18next'
import LogoContainer from '@/components/WalletConnect/v2/components/LedgerLogoContainer'
import { Logo } from '@/components/WalletConnect/v2/components/LedgerLiveLogo'
import Image from 'next/image'
import { SelectableRow } from '@/components/WalletConnect/v2/components/SelectableRow'
import { useCallback, useState } from 'react'
import { space } from '@ledgerhq/react-ui/styles/theme'

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

export default function SessionProposal() {
	const { colors } = useTheme()
	const { router } = useNavigation()
	const { t } = useTranslation()
	const proposal = JSON.parse(router.query.data as string) as Proposal
	const proposer = proposal.params.proposer
	const getChains = (proposal: Proposal) =>
		Object.values(proposal.params.requiredNamespaces)

	const [selectedAccounts, setSelectedAccounts] = useState<string[]>([])

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

	return (
		<WalletConnectContainer>
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

				<Text variant="h4" color={colors.neutral.c80} uppercase={false}>
					{formatUrl(proposer.metadata.url)}
				</Text>
			</Header>

			<ListChains>
				{getChains(proposal).map((value) => (
					<>
						{value.chains.map((chain, index) => (
							<Box key={chain} mb={6}>
								<Box mb={6}>
									<Text
										variant="subtitle"
										color={colors.neutral.c70}
									>
										{formatChainName(chain)}
									</Text>
								</Box>
								<List>
									<li
										key={chain}
										style={{
											marginBottom:
												index !==
												value.chains.length - 1
													? space[3]
													: 0,
										}}
									>
										<SelectableRow
											title={formatChainName(chain)}
											subtitle={formatChainName(chain)}
											isSelected={selectedAccounts.includes(
												formatChainName(chain),
											)}
											onSelect={() =>
												handleClick(
													formatChainName(chain),
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
								</List>
							</Box>
						))}
					</>
				))}
			</ListChains>
		</WalletConnectContainer>
	)
}
