import { IClientMeta } from '@walletconnect/types'
import { Alert, Text } from '@ledgerhq/react-ui'
import { useTranslation } from 'next-i18next'

type InfoConnectionAlertProps = {
	peerMeta: IClientMeta
}

export function InfoConnectionAlert({ peerMeta }: InfoConnectionAlertProps) {
	const { t } = useTranslation()
	return (
		<Alert
			type="warning"
			renderContent={() => (
				<Text variant="paragraphLineHeight">
					{t('info.connection', { appName: peerMeta.name })}
				</Text>
			)}
		/>
	)
}
