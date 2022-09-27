import { Alert, Text } from '@ledgerhq/react-ui'
import { useTranslation } from 'next-i18next'

export function TimedOutAlert() {
	const { t } = useTranslation()
	return (
		<Alert
			type="error"
			renderContent={() => (
				<Text variant="paragraphLineHeight">{t('error.timeout')}</Text>
			)}
		/>
	)
}
