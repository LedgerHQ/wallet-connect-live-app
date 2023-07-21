import styled from 'styled-components'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { QrCodeMedium } from '@ledgerhq/react-ui/assets/icons'
import { useCallback, useEffect, useState } from 'react'
import { PasteMedium } from '@ledgerhq/react-ui/assets/icons'
import { QRScanner } from './QRScanner'
import { InputMode } from '@/types/types'
import { useTranslation } from 'next-i18next'
import useAnalytics from '@/hooks/useAnalytics'
import { useErrors } from '@/hooks/useErrors'

const QRScannerContainer = styled.div`
	display: flex;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	position: relative;
	overflow: hidden;
	height: 280px;
	width: 280px;
	border: ${(p) => `1px solid ${p.theme.colors.neutral.c100}`};
	border-radius: ${(p) => p.theme.space[8]}px;
`

const QrCodeButton = styled.div`
	display: flex;
	align-items: center;
	justify-content: center;
	cursor: pointer;
	padding: 8px;
	margin-right: 8px;
	&:disabled {
		color: ${(p) => p.theme.colors.neutral.c50};
		cursor: unset;
	}
`

export type ConnectProps = {
	initialURI?: string
	onConnect: (uri: string) => void
	mode?: InputMode
}

export function Connect({ initialURI, onConnect, mode }: ConnectProps) {
	const { t } = useTranslation()
	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)
	const [scanner, setScanner] = useState(mode === 'scan')
	const analytics = useAnalytics()
	const { captureInfoMessage } = useErrors()

	const handleConnect = useCallback(() => {
		try {
			const uri = new URL(inputValue)
			setInputValue('')
			onConnect(uri.toString())
			analytics.track('button_clicked', {
				button: 'WC-Connect',
				page: 'Connect',
			})
		} catch (error) {
			console.log('invalid uri: ', error)
			setErrorValue(t('error.invalidUri'))
		}
	}, [onConnect, inputValue])

	const startScanning = useCallback(() => {
		setScanner(true)
		analytics.track('button_clicked', {
			button: 'WC-Scan QR Code',
			page: 'Connect',
		})
	}, [])

	useEffect(() => {
		if (initialURI) {
			onConnect(initialURI)
		}
		analytics.page('Wallet Connect')
	}, [initialURI])

	const isRunningInAndroidWebview = useCallback(
		() =>
			navigator.userAgent &&
			navigator.userAgent.includes('; wv') &&
			navigator.userAgent.includes('Android'),
		[],
	)

	const handlePasteClick = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setInputValue(text)
			analytics.track('button_clicked', {
				button: 'WC-Paste Url',
				page: 'Connect',
			})
		} catch {
			captureInfoMessage('COPY/PASTE FAILED')
		}
	}, [])

	const tryConnect = useCallback(
		(rawURI: string) => {
			try {
				const url = new URL(rawURI)

				switch (url.protocol) {
					// handle usual wallet connect URIs
					case 'wc:': {
						onConnect(url.toString())
						break
					}

					// handle Ledger Live specific URIs
					case 'ledgerlive:': {
						const uriParam = url.searchParams.get('uri')

						if (url.pathname === '//wc' && uriParam) {
							tryConnect(uriParam)
						}
						break
					}
				}
			} catch (error) {
				// bad urls are just ignored
				if (error instanceof TypeError) {
					return
				}
				throw error
			}
		},
		[onConnect],
	)

	return (
		<Flex
			flexDirection="column"
			width="100%"
			height="100%"
			justifyContent="space-between"
		>
			<Flex justifyContent="center" width="100%" my={14}>
				<QRScannerContainer>
					{scanner ? (
						<QRScanner onQRScan={tryConnect} />
					) : (
						<>
							<QrCodeMedium size={32} color="neutral.c100" />
							<Flex position="absolute" bottom={6}>
								<Button
									onClick={startScanning}
									data-test="connect-button"
									variant="main"
									size="medium"
								>
									<Text
										fontSize="body"
										fontWeight="semiBold"
										color="neutral.c00"
									>
										{t('connect.scanQRCode')}
									</Text>
								</Button>
							</Flex>
						</>
					)}
				</QRScannerContainer>
			</Flex>
			<Flex flexDirection="column" width="100%" mb={6}>
				<Text
					variant="paragraph"
					fontWeight="medium"
					color="neutral.c100"
					mb={6}
					textAlign="center"
				>
					{t('connect.useWalletConnectUrl')}
				</Text>
				<Input
					value={inputValue}
					onChange={setInputValue}
					error={errorValue}
					data-test="input-uri"
					renderRight={
						!isRunningInAndroidWebview() ? (
							<QrCodeButton
								onClick={handlePasteClick}
								data-test="copy-button"
							>
								<PasteMedium size={18} color="neutral.c100" />
							</QrCodeButton>
						) : null
					}
					placeholder={t('connect.pasteUrl')}
				/>
				<Button
					mt={6}
					onClick={handleConnect}
					data-test="connect-button"
					variant="main"
					size="large"
					disabled={!inputValue}
				>
					<Text
						fontSize="body"
						fontWeight="semiBold"
						color={!inputValue ? 'neutral.c50' : 'neutral.c00'}
					>
						{t('connect.cta')}
					</Text>
				</Button>
			</Flex>
		</Flex>
	)
}
