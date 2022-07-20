import styled from 'styled-components'
import { Button, Flex, Text } from '@ledgerhq/react-ui'
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

export function PendingRequest({ onAccept, onDecline }: PendingRequestProps) {
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
		</PendingRequestContainer>
	)
}
