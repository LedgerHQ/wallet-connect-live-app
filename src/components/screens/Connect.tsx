import styled from 'styled-components'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { QrCodeMedium } from '@ledgerhq/react-ui/assets/icons'
import { useCallback, useEffect, useState } from 'react'
import { PasteMedium } from '@ledgerhq/react-ui/assets/icons'
import { QRScanner } from './QRScanner'
import { InputMode } from '@/types/types'
import { useTranslation } from 'next-i18next'
import { ButtonsContainer } from '@/components/atoms/containers/Elements'
import { WalletConnectPopin } from '@/components/atoms/popin/WalletConnectPopin'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import { isV1 } from '@/helpers/walletConnect.util'
import { formatUrl } from '@/helpers/helper.util'

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
	const walletConnectClient = useV1Store(v1Selector.selectWalletConnectClient)
	const session = walletConnectClient?.session
	const sessionUri = useV1Store(v1Selector.selectSessionUri)
	const isModalOpen = useV1Store(v1Selector.selectModalOpen)
	const setModalOpen = useV1Store(v1Selector.setModalOpen)
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

	const startScanning = useCallback(() => {
		setScanner(true)
	}, [])

	useEffect(() => {
		if (initialURI && !isV1(initialURI)) {
			onConnect(initialURI)
		}
	}, [initialURI])

	const handlePasteClick = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setInputValue(text)
		} catch (err) {
			console.error(err)
		}
	}, [])

	const tryConnect = useCallback(
		(rawURI: string) => {
			try {
				const url = new URL(rawURI)

				switch (url.protocol) {
					// handle usual wallet connect URIs
					case 'wc:': {
						if (
							isV1(url.toString()) &&
							session &&
							sessionUri !== url.toString()
						) {
							setInputValue(url.toString())
							setModalOpen(true)
						} else {
							onConnect(url.toString())
						}

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

	const closeModal = useCallback(() => {
		setModalOpen(false)
	}, [])

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
						<QrCodeButton
							onClick={handlePasteClick}
							data-test="copy-button"
						>
							<PasteMedium size={18} color="neutral.c100" />
						</QrCodeButton>
					}
					placeholder={t('connect.pasteUrl')}
				/>
				<Button
					mt={6}
					onClick={() => tryConnect(inputValue)}
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
				{session && session.peerMeta ? (
					<WalletConnectPopin
						isOpen={isModalOpen}
						onClose={closeModal}
					>
						<Flex flexDirection="column" mx={6}>
							<Text variant="h4" color="neutral.c100" mb={10}>
								{t('connect.modal.title', {
									appName:
										session.peerMeta.name ||
										formatUrl(session.peerMeta.url),
								})}
							</Text>

							<Text
								variant="bodyLineHeight"
								color="neutral.c70"
								mb={3}
							>
								{t('connect.modal.desc', {
									appName:
										session.peerMeta.name ||
										formatUrl(session.peerMeta.url),
								})}
							</Text>

							<ButtonsContainer>
								<Button
									variant="shade"
									flex={0.9}
									mr={6}
									onClick={closeModal}
								>
									<Text
										variant="body"
										fontWeight="semiBold"
										color="neutral.c100"
									>
										{t('connect.modal.cancel')}
									</Text>
								</Button>

								<Button
									variant="main"
									flex={0.9}
									onClick={handleConnect}
								>
									<Text
										variant="body"
										fontWeight="semiBold"
										color="neutral.c00"
									>
										{t('connect.modal.continue')}
									</Text>
								</Button>
							</ButtonsContainer>
						</Flex>
					</WalletConnectPopin>
				) : null}
			</Flex>
		</Flex>
	)
}
