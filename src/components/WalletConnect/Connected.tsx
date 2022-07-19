import styled from 'styled-components'
import { Flex, Button, Text } from '@ledgerhq/react-ui'
import { QuitRegular, RedelegateRegular } from '@ledgerhq/react-ui/assets/icons'
import { Account } from '@ledgerhq/live-app-sdk'

const ConnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type ConnectedProps = {
	onDisconnect: () => void
	onSwitchAccount: () => void
	account: Account
}

export function Connected({ onDisconnect, onSwitchAccount, account }: ConnectedProps) {
	return (
			<ConnectedContainer>
				<Text variant="bodyLineHeight">
					Current Account: {account.name}
				</Text>
				<Flex mt={8} flexDirection="row" flexWrap="wrap-reverse" justifyContent="center">
				<Button
						outline
						variant="main"
						m={3}
						Icon={QuitRegular}
						onClick={onDisconnect}
					>
						<Text>Disconnect</Text>
					</Button>
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
			</ConnectedContainer>
	)
}
