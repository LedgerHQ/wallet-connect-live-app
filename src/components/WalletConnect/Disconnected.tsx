import styled from 'styled-components'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { useCallback, useState } from 'react'
import { QrCodeMedium } from '@ledgerhq/react-ui/assets/icons'
import { OnResultFunction, QrReader } from 'react-qr-reader'

const DisconnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
`

const QrCodeButton = styled.button`
	display: flex;
	align-items: center;
	justify-content: center;
	width: 32px;
	height: 32px;
	border-radius: 50%;
	border-width: 0;
	color: ${(p) => p.theme.colors.neutral.c00};
	background-color: ${(p) => p.theme.colors.neutral.c100};
	cursor: pointer;
	&:disabled {
		background-color: ${(p) => p.theme.colors.neutral.c30};
		color: ${(p) => p.theme.colors.neutral.c50};
		cursor: unset;
	}
`

const ViewFinderContainer = styled.div`
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	bottom: 0;
	background: black;
	opacity: 0.7;
	z-index: 1;
  	clip-path: polygon(0% 0%, 0% 100%, 25% 100%, 25% 25%, 75% 25%, 75% 75%, 25% 75%, 25% 100%, 100% 100%, 100% 0%);  
`

function ViewFinder() {
	return <ViewFinderContainer>lol</ViewFinderContainer>
}

export type DisconnectedProps = {
	onConnect: (uri: string) => void
}

export function Disconnected({ onConnect }: DisconnectedProps) {
	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)
	const [scanner, setScanner] = useState(false)

	const handleConnect = useCallback(() => {
		if (!inputValue) {
			setErrorValue('No input value')
		} else {
			try {
				const uri = new URL(inputValue)
				onConnect(uri.toString())
			} catch (error) {
				console.log('invalid uri: ', error)
				setErrorValue('Invalid URI')
			}
		}
	}, [onConnect, inputValue])

	const handleQrCodeClick = useCallback(() => {
		setScanner(true)
	}, [])

	const handleQrCodeScan: OnResultFunction = useCallback((result, error) => {
		if (!!result) {
			console.log(result)

			setScanner(false)
			try {
				const uri = new URL(result.toString())
				onConnect(uri.toString())
			} catch (error) {
				console.log('invalid uri: ', error)
				setErrorValue('Invalid URI')
			}
		}
	}, [])

	return (
		<DisconnectedContainer>
			{scanner ? (
				<QrReader
					onResult={handleQrCodeScan}
					constraints={{ facingMode: 'environment' }}
					ViewFinder={ViewFinder}
					videoStyle={{ objectFit: 'cover' }}
					containerStyle={{
						width: '100%',
						maxWidth: '600px',
						borderRadius: '8px',
						margin: '6px',
					}}
				/>
			) : (
				<>
					<Input
						value={inputValue}
						onChange={setInputValue}
						error={errorValue}
						renderRight={
							<Flex
								alignItems={'center'}
								justifyContent={'center'}
								pr={'8px'}
							>
								<QrCodeButton onClick={handleQrCodeClick}>
									<QrCodeMedium size="20px" />
								</QrCodeButton>
							</Flex>
						}
					/>
					<Button mt={5} onClick={handleConnect}>
						<Text>Connect</Text>
					</Button>
				</>
			)}
		</DisconnectedContainer>
	)
}
