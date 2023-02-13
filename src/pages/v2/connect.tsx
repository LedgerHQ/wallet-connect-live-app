import { Text } from '@ledgerhq/react-ui'
import styled from 'styled-components'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	user-select: none;
	background: ${({ theme }) => theme.colors.background.main};
`
export default function Connect() {
	return (
		<WalletConnectContainer>
			<Text variant="h1">Connected</Text>
		</WalletConnectContainer>
	)
}
