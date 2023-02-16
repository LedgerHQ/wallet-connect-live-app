import {
	GenericRow,
	RowType,
} from '@/components/WalletConnect/v2/components/GenericRow'
import { formatUrl } from '@/components/WalletConnect/v2/utils/HelperUtil'
import { web3wallet } from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { Box, Flex, Text } from '@ledgerhq/react-ui'
import { SessionTypes } from '@walletconnect/types'
import { useCallback, useEffect, useState } from 'react'
import Image from 'next/image'
import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import {
	List,
	WalletConnectContainer,
} from '@/components/WalletConnect/v2/components/Containers/util'
export { getServerSideProps } from '../../lib/serverProps'

export default function Connect() {
	const { navigate, routes } = useNavigation()
	const [sessions, setSessions] = useState<[string, SessionTypes.Struct][]>(
		[],
	)
	useEffect(() => {
		setSessions(Object.entries(web3wallet.getActiveSessions()))
	}, [])

	const goToDetailSession = useCallback((topic: string) => {
		navigate(routes.sessionDetails, topic)
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
		</WalletConnectContainer>
	)
}
