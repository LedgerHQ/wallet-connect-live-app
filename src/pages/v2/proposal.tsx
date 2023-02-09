import { SignClientTypes } from '@walletconnect/types'
import { Account } from '@ledgerhq/live-app-sdk'
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
	accounts: Account[]
	proposal: SignClientTypes.EventArguments['session_proposal']
}

export default function SessionProposal({
	accounts,
}: WalletConnectProps) {
	return (
		<WalletConnectContainer>
			<WalletConnectInnerContainer>
				<Text variant="h2" textAlign="center">
					SESSION PROPOSAL
				</Text>
			</WalletConnectInnerContainer>
		</WalletConnectContainer>
	)
}
