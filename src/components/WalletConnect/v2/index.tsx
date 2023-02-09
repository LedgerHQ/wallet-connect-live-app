import { useCallback, useState } from 'react'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import styled from 'styled-components'
import { TransitionGroup } from 'react-transition-group'
import { useTranslation } from 'next-i18next'
import { Input, Button, Text, Flex } from '@ledgerhq/react-ui'
import { PasteMedium } from '@ledgerhq/react-ui/assets/icons'
import useInitialization from './hooks/useInitialization'
import useWalletConnectEventsManager from './hooks/useWalletConnectEventsManager'
import { pair } from './utils/WalletConnectUtil'

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
	background: ${({ theme }) => theme.colors.neutral.c20};
`

const PasteButton = styled.button`
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

export type WalletConnectProps = {
	// initialAccountId?: string
	// initialURI?: string
	// networks: NetworkConfig[]
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
	// setUri: Dispatch<SetStateAction<string | undefined>>
}

export function WalletConnectV2({
	platformSDK,
	accounts,
}: WalletConnectProps) {
	const initialized = useInitialization()
	useWalletConnectEventsManager(initialized)

	const { t } = useTranslation()
	const [inputValue, setInputValue] = useState<string>('')
	const [errorValue, setErrorValue] = useState<string | undefined>(undefined)
	
	const handleConnect = useCallback(async () => {
		if (!inputValue) {
			setErrorValue(t('error.noInput'))
		} else {
			try {
				const uri = new URL(inputValue)
				await pair({ uri: uri.toString() })
			  } catch (error: unknown) {
				setErrorValue(t('error.invalidUri'))
			  } finally {
				setInputValue('')
			  }
		}
	}, [inputValue])

	const handlePasteClick = useCallback(async () => {
		try {
			const text = await navigator.clipboard.readText()
			setInputValue(text)
		} catch (err) {
			console.error(err)
		}
	}, [])

	return (
		<WalletConnectContainer>
			<WalletConnectInnerContainer>
				<Text variant="h2" textAlign="center" mb={10}>
					WALLET CONNECT V2
				</Text>
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
								<PasteButton
									onClick={handlePasteClick}
									data-test="copy-button"
								>
									<PasteMedium size="20px" />
								</PasteButton>
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
			</WalletConnectInnerContainer>
		</WalletConnectContainer>
	)
}
