import { Flex, Text, Box, CryptoIcon, Button } from '@ledgerhq/react-ui'
import styled, { useTheme } from 'styled-components'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import { Proposal } from '@/types/types'
import {
	formatUrl,
	getTicker,
	truncate,
} from '@/components/WalletConnect/v2/utils/HelperUtil'
import { useTranslation } from 'next-i18next'
import LogoContainer from '@/components/WalletConnect/v2/components/LogoContainers/LedgerLogoContainer'
import Image from 'next/image'
import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { Logo } from '@/components/WalletConnect/v2/icons/LedgerLiveLogo'
import { InfoSessionProposal } from '@/components/WalletConnect/v2/components/SessionProposal/InfoSessionProposal'
import {
	WalletConnectMedium,
	WarningMedium,
} from '@ledgerhq/react-ui/assets/icons'
import {
	ButtonsContainer,
	List,
} from '@/components/WalletConnect/v2/components/Containers/util'
import { ResponsiveContainer } from '@/styles/styles'
import { walletConnectV1Logic } from '@/components/WalletConnect/v2/hooks/useWalletConnectV1Logic'
export { getServerSideProps } from '../lib/serverProps'

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

const ListChains = styled.ul``

const Header = styled(Flex)`
	flex-direction: column;
	justify-content: center;
	align-items: center;
`

export default function SessionProposal() {
	const { colors } = useTheme()
	const { router } = useNavigation()
	const { t } = useTranslation()

	const proposal = JSON.parse(router.query.data as string)
	const proposer = proposal?.params[0]?.peerMeta

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
					flex={1}
					width="100%"
					justifyContent="space-between"
					flexDirection="column"
				>
					<Flex flexDirection="column">
						<Header mt={12} mb={10}>
							{proposer.icons.length > 0 ? (
								<Container>
									<LogoContainer>
										<Logo size={30} />
									</LogoContainer>

									<DAppContainer
										borderColor={colors.background.main}
									>
										<LogoContainer>
											{proposer.icons.length > 0 ? (
												<Image
													src={proposer.icons[0]}
													alt="Picture of the proposer"
													width={60}
													style={{
														borderRadius: '50%',
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
									name: proposer.name,
								})}
							</Text>

							<Text
								variant="h4"
								color={colors.neutral.c80}
								uppercase={false}
							>
								{formatUrl(proposer.url)}
							</Text>
						</Header>

						<ListChains>
							<Box
								key={
									walletConnectV1Logic.selectedAccount
										.currency
								}
								mb={6}
							>
								<Box mb={6}>
									<Text
										variant="subtitle"
										color={colors.neutral.c70}
									>
										{
											walletConnectV1Logic.selectedAccount
												.currency
										}
									</Text>
								</Box>
								<List>
									<li
										key={
											walletConnectV1Logic.selectedAccount
												.id
										}
									>
										<GenericRow
											title={
												walletConnectV1Logic
													.selectedAccount.name
											}
											subtitle={truncate(
												walletConnectV1Logic
													.selectedAccount.address,
												30,
											)}
											onClick={
												walletConnectV1Logic.handleSwitchAccount
											}
											LeftIcon={
												<CryptoIcon
													name={getTicker(
														walletConnectV1Logic
															.selectedAccount
															.currency,
													)}
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
									</li>
								</List>
							</Box>
						</ListChains>
					</Flex>

					<Flex flexDirection="column">
						<Box mt={6}>
							<InfoSessionProposal />
						</Box>
						{walletConnectV1Logic.session ? (
							<Box mt={6}>
								<Text
									variant="small"
									fontWeight="medium"
									color="neutral.c70"
									mb={6}
								>
									{t('sessionProposal.info3')}
								</Text>

								<Flex mt={6} alignItems="center">
									<WarningMedium
										size={16}
										color="warning.c60"
									/>

									<Text
										ml={4}
										variant="small"
										fontWeight="medium"
										color="neutral.c100"
									>
										{t(`sessionProposal.infoBullet.2`, {
											dAppName:
												walletConnectV1Logic.session
													.peerMeta.name,
										})}
									</Text>
								</Flex>
							</Box>
						) : null}
						<ButtonsContainer>
							<Button
								variant="shade"
								size="large"
								flex={0.9}
								mr={6}
								onClick={walletConnectV1Logic.handleDecline}
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
								size="large"
								flex={0.9}
								onClick={walletConnectV1Logic.handleAccept}
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
					</Flex>
				</Flex>
			</ResponsiveContainer>
		</Flex>
	)
}
