import { Text } from '@ledgerhq/react-ui'
import styled from 'styled-components'
import { TransitionGroup } from 'react-transition-group'

const WalletConnectContainer = styled.div`
	display: flex;
	justify-content: center;
	align-items: center;
	position: relative;
	width: 100%;
	height: 100%;
	user-select: none;
`

const WalletConnectInnerContainer = styled(TransitionGroup)`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 50%;
	height: 50%;
	background: ${({ theme }) => theme.colors.primary.c80};
`

export type WalletConnectProps = {
	initialAccountId?: string
}

export function WalletConnectV2({
	initialAccountId,
}: WalletConnectProps) {
	return (
		<WalletConnectContainer>
			<WalletConnectInnerContainer>
				<Text variant="h2" textAlign="center">
					WALLET CONNECT V2
				</Text>
				<Text variant="h4" mt={8} textAlign="center">
					{ initialAccountId }
				</Text>
			</WalletConnectInnerContainer>
		</WalletConnectContainer>
	)
}
