import styled from 'styled-components'
import { Input, Button, Text } from '@ledgerhq/react-ui'
import { IClientMeta } from '@walletconnect/types'
import { useState } from 'react'

const DisconnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type DisconnectedProps = {
	onConnect: (uri: string) => void
}

export function Disconnected({ onConnect }: DisconnectedProps) {
	const [inputValue, setInputValue] = useState<string>("")

	return (
		<DisconnectedContainer>
			<Input value={inputValue} onChange={setInputValue} />
			<Button onClick={() => onConnect(inputValue)}>
				<Text>Connect</Text>
			</Button>
		</DisconnectedContainer>
	)
}
