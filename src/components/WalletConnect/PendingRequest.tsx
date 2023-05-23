import { Account } from '@ledgerhq/live-app-sdk'
import { Button, Flex, Text } from '@ledgerhq/react-ui'
import {
	CheckAloneRegular,
	CloseRegular,
	RedelegateRegular,
} from '@ledgerhq/react-ui/assets/icons'
import styled from 'styled-components'
import { useTranslation } from 'next-i18next'

const PendingRequestContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type PendingRequestProps = {
	onAccept: () => void
	onDecline: () => void
	onSwitchAccount: () => void
	account: Account
}

export function PendingRequest({
	onAccept,
	onDecline,
	onSwitchAccount,
	account,
}: PendingRequestProps) {
	const { t } = useTranslation()

	return (
		<PendingRequestContainer>
			<Flex
				mt={8}
				flexDirection="row"
				flexWrap="wrap-reverse"
				justifyContent="center"
			>
				<Button
					m={3}
					variant="color"
					Icon={CheckAloneRegular}
					outline
					onClick={onAccept}
					data-test="connect-accept-button"
				>
					<Text>{t('connect.accept')}</Text>
				</Button>
				<Button
					m={3}
					variant="error"
					Icon={CloseRegular}
					outline
					onClick={onDecline}
					data-test="connect-decline-button"
				>
					<Text>{t('connect.decline')}</Text>
				</Button>
			</Flex>
			<Flex
				mt={8}
				flexDirection="column"
				flexWrap="wrap-reverse"
				justifyContent="center"
			>
				<Text marginBottom={4} variant="bodyLineHeight">
					{t('account.saved', { account: account.name })}
				</Text>
				<Button
					outline
					variant="main"
					m={3}
					Icon={RedelegateRegular}
					onClick={onSwitchAccount}
					data-test="account-switch-button"
				>
					<Text>{t('account.switch')}</Text>
				</Button>
			</Flex>
		</PendingRequestContainer>
	)
}
