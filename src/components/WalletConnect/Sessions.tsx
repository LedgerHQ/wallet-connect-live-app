import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { formatUrl } from '@/components/WalletConnect/v2/utils/HelperUtil'
import { Box, Button, Flex, Text } from '@ledgerhq/react-ui'
import { useCallback } from 'react'
import Image from 'next/image'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import {
	ButtonsContainer,
	List,
} from '@/components/WalletConnect/v2/components/Containers/util'
import { useTranslation } from 'next-i18next'
import { WalletConnectPopin } from '@/components/WalletConnect/v2/components/Popin/WalletConnectPopin'
import useWalletConnectPopin from '@/components/WalletConnect/v2/hooks/useWalletConnectPopin'
import {
	Session,
	sessionSelector,
	useSessionsStore,
} from 'src/store/Sessions.store'
import { web3wallet } from './v2/utils/WalletConnectUtil'
import { walletConnectV1Logic } from './v2/hooks/useWalletConnectV1Logic'
import styled from 'styled-components'

export type SessionsProps = {
	sessions: Session[]
	goToConnect: () => void
}

const V1Container = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	border: ${(p) => `1px solid ${p.theme.colors.neutral.c70}`};
	border-radius: ${(p) => p.theme.space[2]}px;
	padding: ${(p) => p.theme.space[2]}px;
`

export default function Sessions({ sessions, goToConnect }: SessionsProps) {
	const { t } = useTranslation()
	const { navigate, routes } = useNavigation()
	const { openModal, closeModal, isModalOpen } = useWalletConnectPopin()
	const clearSessions = useSessionsStore(sessionSelector.clearSessions)
	const goToDetailSession = useCallback((topic: string, isV1?: boolean) => {
		if (isV1) {
			navigate(routes.sessionDetailsV1)
		} else {
			navigate(routes.sessionDetails, topic)
		}
	}, [])

	const v1Session = walletConnectV1Logic.session

	const disconnect = useCallback(async () => {
		if (v1Session && v1Session.peerMeta) {
			walletConnectV1Logic.handleDisconnect()
			walletConnectV1Logic.cleanup()
		}
		await Promise.all(
			sessions.map((session) =>
				web3wallet.disconnectSession({
					topic: session.topic,
					reason: {
						code: 3,
						message: 'Disconnect Session',
					},
				}),
			),
		)
			.catch((err) => console.error(err))
			.finally(() => {
				clearSessions()
				closeModal()
			})
	}, [sessions])

	if (
		(!sessions || !sessions.length || sessions.length === 0) &&
		(!v1Session || !v1Session.peerMeta)
	) {
		return (
			<Flex
				flexDirection="column"
				width="100%"
				height="100%"
				alignItems="center"
				justifyContent="center"
				my={6}
			>
				<Text variant="h2" fontWeight="medium" textAlign="center">
					{t('sessions.emptyState.title')}
				</Text>
				<Text
					variant="bodyLineHeight"
					fontWeight="medium"
					color="neutral.c80"
					mt={6}
					textAlign="center"
				>
					{t('sessions.emptyState.desc')}
				</Text>
				<Button
					variant="main"
					size="large"
					mt={10}
					onClick={goToConnect}
				>
					<Text
						variant="body"
						fontWeight="semiBold"
						color="neutral.c00"
					>
						{t('sessions.emptyState.goToConnect')}
					</Text>
				</Button>
			</Flex>
		)
	}

	return (
		<Flex flexDirection="column" width="100%" height="100%" mt={6}>
			<List>
				{v1Session && v1Session.peerMeta ? (
					<Box key={v1Session.handshakeTopic} mt={3}>
						<GenericRow
							key={v1Session.handshakeTopic}
							title={v1Session.peerMeta.name}
							subtitle={formatUrl(v1Session.peerMeta.url)}
							LeftIcon={
								<Image
									src={v1Session.peerMeta.icons[0]}
									alt="Picture of the proposer"
									width={32}
									style={{
										borderRadius: '8px',
									}}
									height={32}
								/>
							}
							rowType={RowType.Detail}
							rightElement={
								<V1Container>
									<Text
										variant="tiny"
										fontWeight="semiBold"
										color="neutral.c70"
									>
										WalletConnect v1
									</Text>
								</V1Container>
							}
							onClick={() =>
								goToDetailSession(
									v1Session.handshakeTopic,
									true,
								)
							}
						/>
					</Box>
				) : null}
				{sessions.map((session) => (
					<Box key={session.topic} mt={3}>
						<GenericRow
							key={session.topic}
							title={session.peer.metadata.name}
							subtitle={formatUrl(session.peer.metadata.url)}
							LeftIcon={
								<Image
									src={session.peer.metadata.icons[0]}
									alt="Picture of the proposer"
									width={32}
									style={{
										borderRadius: '8px',
									}}
									height={32}
								/>
							}
							rowType={RowType.Detail}
							onClick={() => goToDetailSession(session.topic)}
						/>
					</Box>
				))}
			</List>

			<ButtonsContainer mt={4}>
				<Button variant="shade" flex={1} onClick={openModal}>
					<Text
						variant="body"
						fontWeight="semiBold"
						color="neutral.c100"
					>
						{t('sessions.disconnectAll')}
					</Text>
				</Button>
			</ButtonsContainer>

			<WalletConnectPopin isOpen={isModalOpen} onClose={closeModal}>
				<Flex flexDirection="column">
					<Text variant="h4" color="neutral.c100" mb={10}>
						{t('sessions.modal.title')}
					</Text>

					<Text variant="bodyLineHeight" color="neutral.c70" mb={10}>
						{t('sessions.modal.desc')}
					</Text>

					<ButtonsContainer>
						<Button
							variant="shade"
							flex={0.9}
							mr={6}
							onClick={closeModal}
						>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c100"
							>
								{t('sessions.modal.cancel')}
							</Text>
						</Button>

						<Button variant="main" flex={0.9} onClick={disconnect}>
							<Text
								variant="body"
								fontWeight="semiBold"
								color="neutral.c00"
							>
								{t('sessions.modal.continue')}
							</Text>
						</Button>
					</ButtonsContainer>
				</Flex>
			</WalletConnectPopin>
		</Flex>
	)
}
