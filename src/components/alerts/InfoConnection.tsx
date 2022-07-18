import { IClientMeta } from '@walletconnect/types'
import { Alert, Text } from '@ledgerhq/react-ui'

type InfoConnectionAlertProps = {
	peerMeta: IClientMeta
}

export function InfoConnectionAlert({ peerMeta }: InfoConnectionAlertProps) {
	return (
		<Alert
			type="warning"
			renderContent={() => (
				<Text variant="paragraphLineHeight">
					Leaving this page will not disconnect you from{' '}
					<Text fontWeight="semiBold">{peerMeta.name}</Text>, but will
					prevent any further interaction with this wallet.
				</Text>
			)}
		/>
	)
}
