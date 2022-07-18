import styled from 'styled-components'
import { Box, Button, Text } from '@ledgerhq/react-ui'
import { QuitRegular, RedelegateRegular } from '@ledgerhq/react-ui/assets/icons'

const ConnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type ConnectedProps = {
	onDisconnect: () => void
	onSwitchAccount: () => void
}

export function Connected({ onDisconnect, onSwitchAccount }: ConnectedProps) {
	return (
			<ConnectedContainer>
				<Box mt="32px">
					<Button
						variant="shade"
						Icon={RedelegateRegular}
						onClick={onSwitchAccount}
					>
						<Text>Switch account</Text>
					</Button>
					<Button
						ml="24px"
						outline
						variant="error"
						Icon={QuitRegular}
						onClick={onDisconnect}
					>
						<Text>Disconnect</Text>
					</Button>
				</Box>
			</ConnectedContainer>
	)
}
