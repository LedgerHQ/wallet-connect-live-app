import styled from 'styled-components'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { useCallback, useState } from 'react'
import { QrCodeMedium } from '@ledgerhq/react-ui/assets/icons'
import { QRScanner } from './QRScanner'
import { InputMode } from '@/types/types'

const DisconnectedContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	height: 100%;
	width: 100%;
	position: relative;
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

const BottomContainer = styled.div`
	position: absolute;
	bottom: 40px;
	left: 0;
	right: 0;
	z-index: 1;
	display: flex;
	padding: 0px 16px;
	align-items: center;
	justify-content: center;
`

export type DisconnectedProps = {
	onConnect: (uri: string) => void
	mode?: InputMode
}

export function Disconnected({ onConnect, mode }: DisconnectedProps) {
	const [inputValue, setInputValue] = useState<string>("");
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined);
	const [scanner, setScanner] = useState(mode === "scan");

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

	return (
		<DisconnectedContainer>
			{scanner ? (
				<QRScanner onQRScan={onConnect} />
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
			<BottomContainer>
				<Flex>
					<Button
						variant="shade"
						outline
						m={3}
						onClick={() => {
							setScanner(!scanner)
						}}
					>
						<Text>{`Switch to ${scanner ? "Text" : "Scanner"}`}</Text>
					</Button>
				</Flex>
			</BottomContainer>
		</DisconnectedContainer>
	)
}
