import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { formatUrl } from '@/components/WalletConnect/v2/utils/HelperUtil'
import { web3wallet } from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { Box, Button, Flex, Text } from '@ledgerhq/react-ui'
import { SessionTypes } from '@walletconnect/types'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import {
	ButtonsContainer,
	List,
	WalletConnectContainer,
} from '@/components/WalletConnect/v2/components/Containers/util'
import { useTranslation } from 'next-i18next'
import { WalletConnectPopin } from '@/components/WalletConnect/v2/components/Popin/WalletConnectPopin'
import useWalletConnectPopin from '@/components/WalletConnect/v2/hooks/useWalletConnectPopin'
export { getServerSideProps } from '../../lib/serverProps'

export default function Connect() {
	const { t } = useTranslation()
	const { navigate, routes } = useNavigation()
	const { openModal, closeModal, isModalOpen } = useWalletConnectPopin()

	const [sessions, setSessions] = useState<[string, SessionTypes.Struct][]>(
		[],
	)

	useEffect(() => {
		setSessions(Object.entries(web3wallet.getActiveSessions()))
	}, [])

	const goToDetailSession = useCallback((topic: string) => {
		navigate(routes.sessionDetails, topic)
	}, [])

	const disconnect = useCallback(() => {
		sessions.forEach(async ([, value]) => {
			await web3wallet.disconnectSession({
				topic: value.topic,
				reason: {
					code: 3,
					message: 'Disconnect Session',
				},
			})
		})

		setSessions([])
		closeModal()
	}, [])

	return (
		<WalletConnectContainer>
			<Flex
				flexDirection="column"
				alignItems="center"
				justifyContent="center"
				mb={4}
			>
				<Text variant="h1" mb={4} flex={1}>
					Connected
				</Text>
				<Text>Active Sessions : {sessions.length}</Text>
			</Flex>
			<List>
				{sessions.map(([key, value]) => (
					<Box key={key} mt={3}>
						<GenericRow
							key={key}
							title={value.peer.metadata.name}
							subtitle={formatUrl(value.peer.metadata.url)}
							LeftIcon={
								<Image
									src={value.peer.metadata.icons[0]}
									alt="Picture of the proposer"
									width={32}
									style={{
										borderRadius: '8px',
									}}
									height={32}
								/>
							}
							rowType={RowType.Detail}
							onClick={() => goToDetailSession(value.topic)}
						/>
					</Box>
				))}
			</List>

			{sessions.length > 0 && (
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
			)}

			<WalletConnectPopin isOpen={isModalOpen}>
				<Flex
					flexDirection="column"
					justifyContent="center"
					alignItems="center"
					flex={1}
				>
					<Text variant="h4">{t('sessions.modal.title')}</Text>

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
		</WalletConnectContainer>
	)
}
