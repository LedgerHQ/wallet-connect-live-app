import { Text } from '@ledgerhq/react-ui'
import styled from 'styled-components'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	width: 100%;
	height: 100%;
	user-select: none;
	align-items: center;
	justify-content: center;
	background: ${({ theme }) => theme.colors.background.main};
`
export default function Reject() {
	return (
		<WalletConnectContainer>
			<Text variant="h1" color="error.c80">
				Rejected
			</Text>
		</WalletConnectContainer>
	)
}
