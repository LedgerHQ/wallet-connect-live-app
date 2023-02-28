import { List, ButtonsContainer } from '@/components/atoms/elements/elements'
import { GenericRow, RowType } from '@/components/atoms/genericRow'
import LogoContainer from '@/components/atoms/logoContainers/ledgerLogoContainer'
import { AddAccountPlaceholder } from '@/components/screens/sessions/sessionProposal/addAccountPlaceholder'
import { InfoSessionProposal } from '@/components/screens/sessions/sessionProposal/infoSessionProposal'
import { formatUrl, getTicker, truncate } from '@/helpers/helper.util'
import { walletConnectV1Logic } from '@/hooks/useWalletConnectV1Logic'
import { useV1Store, v1Selector } from '@/store/v1.store'
import { ResponsiveContainer } from '@/styles/styles'
import { Flex, Box, CryptoIcon, Button, Text } from '@ledgerhq/react-ui'
import {
	WalletConnectMedium,
	WarningMedium,
} from '@ledgerhq/react-ui/assets/icons'
import Image from 'next/image'
import { useTranslation } from 'next-i18next'
import { Logo } from 'src/icons/LedgerLiveLogo'
import styled, { useTheme } from 'styled-components'

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

	const { t } = useTranslation()
	const selectedAccount = useV1Store(v1Selector.selectAccount)
	const session = useV1Store(v1Selector.selectSession)
	const proposal = useV1Store(v1Selector.selectProposal)
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
							{proposer && proposer.icons.length > 0 ? (
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

							<Text
								variant="h4"
								mt={3}
								mb={3}
								uppercase={false}
								textAlign="center"
								fontWeight="medium"
							>
								{t('sessionProposal.connectTo', {
									name: proposer?.name,
								})}
							</Text>

							<Text
								variant="body"
								fontWeight="medium"
								textAlign="center"
								color="neutral.c80"
								uppercase={false}
							>
								{formatUrl(proposer?.url ?? '')}
							</Text>
						</Header>

						<ListChains>
							{selectedAccount ? (
								<Box key={selectedAccount.currency} mb={6}>
									<Box mb={6}>
										<Text
											variant="subtitle"
											color="neutral.c70"
										>
											{selectedAccount.currency}
										</Text>
									</Box>
									<List>
										<li key={selectedAccount.id}>
											<GenericRow
												title={selectedAccount.name}
												subtitle={truncate(
													selectedAccount.address,
													30,
												)}
												onClick={
													walletConnectV1Logic.handleSwitchAccount
												}
												LeftIcon={
													<CryptoIcon
														name={getTicker(
															selectedAccount.currency,
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
							) : (
								<AddAccountPlaceholder
									onClick={
										walletConnectV1Logic.handleSwitchAccount
									}
								/>
							)}
						</ListChains>
					</Flex>

					<Flex flexDirection="column">
						<Box mt={6}>
							<InfoSessionProposal />
						</Box>
						{session && session.peerMeta ? (
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
												session.peerMeta.name ||
												formatUrl(session.peerMeta.url),
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
