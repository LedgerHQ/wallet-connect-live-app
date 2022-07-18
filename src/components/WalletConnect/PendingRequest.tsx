import styled from 'styled-components'
import { CSSTransition } from 'react-transition-group'
import { Box, Button, Text } from '@ledgerhq/react-ui'
import { IClientMeta } from '@walletconnect/types'
import {
	CheckAloneRegular,
	CloseRegular,
} from '@ledgerhq/react-ui/assets/icons'

const PendingRequestContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type PendingRequestProps = {
	onAccept: () => void
	onDecline: () => void
}

export function PendingRequest({
	onAccept,
	onDecline,
}: PendingRequestProps) {
	return (
			<PendingRequestContainer>
				<Box mt="32px">
					<Button
						mr="24px"
						variant="color"
						Icon={CheckAloneRegular}
						outline
						onClick={onAccept}
					>
						<Text>Accept</Text>
					</Button>
					<Button
						variant="error"
						Icon={CloseRegular}
						outline
						onClick={onDecline}
					>
						<Text>Decline</Text>
					</Button>
				</Box>
			</PendingRequestContainer>
	)
}
