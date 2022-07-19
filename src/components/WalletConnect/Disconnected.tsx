import styled from 'styled-components'
import { Input, Button, Text } from '@ledgerhq/react-ui'
import { useCallback, useState } from 'react'

const DisconnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
`

export type DisconnectedProps = {
	onConnect: (uri: string) => void
}

export function Disconnected({ onConnect }: DisconnectedProps) {
	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)

	const handleConnect = useCallback(() => {
		if (!inputValue) {
			setErrorValue('No input value')
		} else {
			try {
				const uri = new URL(inputValue)
				onConnect(uri.toString())
			} catch (error) {
				console.log("invalid uri: ", error )
				setErrorValue('Invalid URI')
			}
		}
	}, [onConnect, inputValue])

	return (
		<DisconnectedContainer>
			<Input
				value={inputValue}
				onChange={setInputValue}
				error={errorValue}
			/>
			<Button onClick={handleConnect}>
				<Text>Connect</Text>
			</Button>
		</DisconnectedContainer>
	)
}
