import styled from 'styled-components'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { useCallback, useEffect, useState } from 'react'
import { PasteMedium } from '@ledgerhq/react-ui/assets/icons'
import { QRScanner } from './QRScanner'
import { InputMode } from '@/types/types'
import { useTranslation } from 'next-i18next'

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
	z-index: 3;
	display: flex;
	padding: 0px 16px;
	align-items: center;
	justify-content: center;
`

const TopContainer = styled.div`
	position: absolute;
	top: 50px;
	left: 0;
	right: 0;
	z-index: 2;
	display: flex;
	padding: 0px 16px;
	align-items: center;
	justify-content: center;
`

export type DisconnectedProps = {
	onConnect: (uri: string) => void
	mode?: InputMode
}

let previouslyPasted = ''

export function Disconnected({ onConnect, mode }: DisconnectedProps) {
	const { t } = useTranslation()
	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)
	const [scanner, setScanner] = useState(mode === 'scan')

	const handleConnect = useCallback(() => {
		if (!inputValue) {
			setErrorValue(t('error.noInput'))
		} else {
			try {
				const uri = new URL(inputValue)
				onConnect(uri.toString())
			} catch (error) {
				console.log('invalid uri: ', error)
				setErrorValue(t('error.invalidUri'))
			}
		}
	}, [onConnect, inputValue])

	useEffect(() => {
		const interval = setInterval(async () => {
			try {
				const text = await navigator.clipboard.readText()
				if (text !== previouslyPasted) {
					previouslyPasted = text
					const url = new URL(text)

					if (url.protocol === 'wc:') {
						onConnect(url.toString())
					} else if (url.protocol === 'ledgerlive:' && url.pathname === "/wc") {
						const uriParam = url.searchParams.get("uri");
						if (uriParam) {
							const wcURL = new URL(uriParam);
							if (wcURL.protocol === "wc:") {
								onConnect(wcURL.toString())
							}
						}
					}
				}
			} catch (err) {
				console.error(err)
			}
		}, 500)

		return () => clearInterval(interval)
	}, [])

	const handlePasteClick = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setInputValue(text)
		} catch (err) {
			console.error(err)
		}
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
						data-test="input-uri"
						renderRight={
							<Flex
								alignItems={'center'}
								justifyContent={'center'}
								pr={'8px'}
							>
								<QrCodeButton
									onClick={handlePasteClick}
									data-test="copy-button"
								>
									<PasteMedium size="20px" />
								</QrCodeButton>
							</Flex>
						}
					/>
					<Button
						mt={5}
						onClick={handleConnect}
						data-test="connect-button"
					>
						<Text>{t('connect.cta')}</Text>
					</Button>
				</>
			)}
			<TopContainer>
				<Flex>
					<Text variant="h4" textAlign="center" data-test="title">
						{scanner
							? t('connect.scanQRCode')
							: t('connect.copyURI')}
					</Text>
				</Flex>
			</TopContainer>
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
						<Text>
							{scanner
								? t('connect.switchToText')
								: t('connect.switchToScanner')}
						</Text>
					</Button>
				</Flex>
			</BottomContainer>
		</DisconnectedContainer>
	)
}
