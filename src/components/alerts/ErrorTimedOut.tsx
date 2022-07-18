import { Alert, Text } from '@ledgerhq/react-ui'

export function TimedOutAlert() {
	return (
		<Alert
			type="error"
			renderContent={() => (
				<Text variant="paragraphLineHeight">
					No connection request received in the allowed time. Try
					refreshing the DApp webpage and try again.
				</Text>
			)}
		/>
	)
}
