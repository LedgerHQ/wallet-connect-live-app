import { Account } from '@ledgerhq/live-app-sdk'
import { Button, Flex, Text } from '@ledgerhq/react-ui'
import {
	CheckAloneRegular,
	CloseRegular,
	RedelegateRegular
} from '@ledgerhq/react-ui/assets/icons'
import styled from 'styled-components'

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

export function PendingRequest({ onAccept, onDecline, onSwitchAccount, account }: PendingRequestProps) {
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
				>
					<Text>Accept</Text>
				</Button>
				<Button
					m={3}
					variant="error"
					Icon={CloseRegular}
					outline
					onClick={onDecline}
				>
					<Text>Decline</Text>
				</Button>
			</Flex>
			<Flex
				mt={8}
				flexDirection="column"
				flexWrap="wrap-reverse"
				justifyContent="center"
			>
				<Text marginBottom={4} variant="bodyLineHeight">
					Saved Account: {account.name}
				</Text>
				<Button
					outline
					variant="main"
					m={3}
					Icon={RedelegateRegular}
					onClick={onSwitchAccount}
				>
					<Text>Switch account</Text>
				</Button>
			</Flex>
		</PendingRequestContainer>
	)
}
