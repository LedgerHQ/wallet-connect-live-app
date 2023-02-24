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

export type SessionsProps = {
	sessions: Session[]
	goToConnect: () => void
}

export default function Sessions({ sessions, goToConnect }: SessionsProps) {
	const { t } = useTranslation()
	const { navigate, routes } = useNavigation()
	const { openModal, closeModal, isModalOpen } = useWalletConnectPopin()
	const clearSessions = useSessionsStore(sessionSelector.clearSessions)
	const goToDetailSession = useCallback((topic: string) => {
		navigate(routes.sessionDetails, topic)
	}, [])

	const disconnect = useCallback(async () => {
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

	if (!sessions || !sessions.length || sessions.length === 0) {
		return (
			<Flex
				flexDirection="column"
				width="100%"
				height="100%"
				alignItems="center"
				justifyContent="center"
				my={6}
			>
				<Text variant="h2" fontWeight="medium">
					{t('sessions.emptyState.title')}
				</Text>
				<Text
					variant="bodyLineHeight"
					fontWeight="medium"
					color="neutral.c80"
					mt={6}
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
