import { InputMode, NetworkConfig } from '@/types/types'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { Link, Text } from '@ledgerhq/react-ui'
import GlitchText from '@ledgerhq/react-ui/components/animations/GlitchText'

import { convertEthToLiveTX } from '@/helpers/converters'
import { compareETHAddresses } from '@/helpers/generic'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import WalletConnectClient from '@walletconnect/client'
import { IJsonRpcRequest, IWalletConnectSession } from '@walletconnect/types'
import { useTranslation } from 'next-i18next'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import styled, { css, keyframes } from 'styled-components'
import { TimedOutAlert } from '../alerts/ErrorTimedOut'
import { InfoConnectionAlert } from '../alerts/InfoConnection'
import { Connected } from './Connected'
import { Disconnected } from './Disconnected'
import { PendingConnection } from './PendingConnection'
import { PendingRequest } from './PendingRequest'
import { ArrowRightMedium } from '@ledgerhq/react-ui/assets/icons'

const pulseAnimationLight = keyframes`
	0% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(255, 255, 255, 0.7);
	}

	70% {
		transform: scale(1);
		box-shadow: 0 0 0 10px rgba(255, 255, 255, 0);
	}

	100% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(255, 255, 255, 0);
	}
`

const pulseAnimationDark = keyframes`
	0% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0.7);
	}

	70% {
		transform: scale(1);
		box-shadow: 0 0 0 10px rgba(0, 0, 0, 0);
	}

	100% {
		transform: scale(0.95);
		box-shadow: 0 0 0 0 rgba(0, 0, 0, 0);
	}
`

const pulsing = css`
	animation: ${({ theme }) =>
			theme.theme === 'light' ? pulseAnimationDark : pulseAnimationLight}
		2s infinite;
`

const StatusIcon = styled.div<{ pulse: boolean }>`
	pointer-events: none;
	display: flex;
	align-items: center;
	justify-content: center;
	user-select: none;

	background: ${({ theme }) => theme.colors.neutral.c100};
	border-radius: 50%;
	height: 80px;
	width: 80px;

	box-shadow: 0 0 0 0 rgba(255, 255, 255, 1);
	transform: scale(1);
	${({ pulse }) => (pulse ? pulsing : null)}
`

const WalletConnectContainer = styled.div`
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
	width: 100%;
	height: 100%;
`

const BannerContainer = styled(TransitionGroup)`
	z-index: 99;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;
	padding: 12px;

	> div {
		margin-top: 12px;
	}

	div:first-child {
		margin-top: 0px;
	}
`

type WalletConnectState = {
	session: IWalletConnectSession | null
	timedOut: boolean
	selectedAccount?: Account
}

const getInitialState = (
	accounts: Account[],
	initialAccountId?: string,
): WalletConnectState => {
	const savedAccountId = localStorage.getItem('accountId')

	const initialAccount = initialAccountId
		? accounts.find((account) => account.id === initialAccountId)
		: undefined
	const savedAccount = savedAccountId
		? accounts.find((account) => account.id === savedAccountId)
		: undefined
	const defaultAccount = accounts.length > 0 ? accounts[0] : undefined

	const selectedAccount = initialAccount || savedAccount || defaultAccount
	return {
		session: null,
		timedOut: false,
		selectedAccount,
	}
}

export type WalletConnectProps = {
	initialMode?: InputMode
	initialAccountId?: string
	initialURI?: string
	networks: NetworkConfig[]
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
}

export function WalletConnect({
	initialMode,
	initialAccountId,
	initialURI,
	networks = [],
	platformSDK,
	accounts,
}: WalletConnectProps) {
	const selectedAccountRef = useRef<Account>()
	const wcRef = useRef<WalletConnectClient>()

	const [{ session, selectedAccount, timedOut }, setState] =
		useState<WalletConnectState>(
			getInitialState(accounts, initialAccountId),
		)

	useEffect(() => {
		selectedAccountRef.current = selectedAccount
		const wc = wcRef.current

		if (selectedAccount) {
			localStorage.setItem('accountId', selectedAccount.id)
			if (wc && wc.connected) {
				const networkConfig = networks.find(
					(networkConfig) =>
						networkConfig.currency === selectedAccount.currency,
				)
				if (networkConfig) {
					wc.updateSession({
						chainId: networkConfig.chainId,
						accounts: [selectedAccount.address],
					})
				}
				setState((oldState) => ({
					...oldState,
					session: {
						...wc.session,
					},
				}))
			}
		}
	}, [selectedAccount])

	const createClient = useCallback(
		async (params: {
			uri?: string
			session?: IWalletConnectSession
		}): Promise<void> => {
			if (wcRef.current) {
				await wcRef.current.killSession()
			}
			const { uri, session } = params
			if (!uri && !session) {
				throw new Error(
					'Need either uri or session to be provided to createClient',
				)
			}

			const wc = new WalletConnectClient({ uri, session })

			// synchronize WC state with react and trigger necessary rerenders
			const syncSessionWithReactState = () => {
				setState((oldState) => ({
					...oldState,
					timedOut: false,
					session: {
						...wc.session,
					},
				}))
			}

			wc.on('session_request', (error, payload) => {
				console.log('session_request', {
					error,
					payload,
				})

				if (error) {
				}

				syncSessionWithReactState()
			})

			wc.on('connect', () => {
				syncSessionWithReactState()
				localStorage.setItem('session', JSON.stringify(wc.session))

				if (uri) {
					localStorage.setItem('sessionURI', uri)
				}
			})

			wc.on('disconnect', () => {
				// cleaning everything and reverting to initial state
				setState((oldState) => {
					return {
						...oldState,
						session: null,
					}
				})
				wcRef.current = undefined
				localStorage.removeItem('session')
				localStorage.removeItem('sessionURI')
			})

			wc.on('error', (error) => {
				console.log('error', { error })
			})

			wc.on('call_request', async (error, payload: IJsonRpcRequest) => {
				console.log('call_request', { error, payload })
				if (error) {
				}

				switch (payload.method) {
					case 'eth_sendTransaction': {
						const ethTX = payload.params[0]
						console.log('eth_sendTransaction', {
							ethTX,
							selectedAccount: selectedAccountRef.current,
						})
						if (
							selectedAccountRef.current &&
							compareETHAddresses(
								selectedAccountRef.current.address,
								ethTX.from,
							)
						) {
							try {
								const liveTX = convertEthToLiveTX(ethTX)
								const signedTransaction =
									await platformSDK.signTransaction(
										selectedAccountRef.current.id,
										liveTX,
									)
								const hash =
									await platformSDK.broadcastSignedTransaction(
										selectedAccountRef.current.id,
										signedTransaction,
									)
								wc.approveRequest({
									id: payload.id,
									jsonrpc: '2.0',
									result: hash,
								})
							} catch (error) {
								wc.rejectRequest({
									id: payload.id,
									jsonrpc: '2.0',
									error: {
										code: 3,
										message: 'Transaction declined',
									},
								})
							}
						}
					}
					// https://ethereum.org/en/developers/docs/apis/json-rpc/#eth_sign
					// https://docs.walletconnect.com/json-rpc-api-methods/ethereum
					// Discussion about the diff between eth_sign and personal_sign:
					// https://github.com/WalletConnect/walletconnect-docs/issues/32#issuecomment-644697172
					case 'personal_sign': {
						if (
							selectedAccountRef.current &&
							compareETHAddresses(
								selectedAccountRef.current.address,
								payload.params[1],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[0],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccountRef.current.id,
										Buffer.from(message, 'hex'),
									)
								wc.approveRequest({
									id: payload.id,
									jsonrpc: '2.0',
									result: signedMessage,
								})
							} catch (error) {
								wc.rejectRequest({
									id: payload.id,
									jsonrpc: '2.0',
									error: {
										code: 3,
										message:
											'Personal message signed declined',
									},
								})
							}
							break
						}
					}
					case 'eth_sign': {
						if (
							selectedAccountRef.current &&
							compareETHAddresses(
								selectedAccountRef.current.address,
								payload.params[0],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[1],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccountRef.current.id,
										Buffer.from(message, 'hex'),
									)
								wc.approveRequest({
									id: payload.id,
									jsonrpc: '2.0',
									result: signedMessage,
								})
							} catch (error) {
								wc.rejectRequest({
									id: payload.id,
									jsonrpc: '2.0',
									error: {
										code: 3,
										message: 'Message signed declined',
									},
								})
							}
							break
						}
					}
					case 'eth_signTypedData': {
						if (
							selectedAccountRef.current &&
							compareETHAddresses(
								selectedAccountRef.current.address,
								payload.params[0],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[1],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccountRef.current.id,
										Buffer.from(message),
									)
								wc.approveRequest({
									id: payload.id,
									jsonrpc: '2.0',
									result: signedMessage,
								})
							} catch (error) {
								wc.rejectRequest({
									id: payload.id,
									jsonrpc: '2.0',
									error: {
										code: 3,
										message: 'Message signed declined',
									},
								})
							}
							break
						}
					}
				}
			})

			// saving the client instance ref for further usage
			wcRef.current = wc
			syncSessionWithReactState()

			// a client is already connected
			if (wc.connected && selectedAccountRef.current) {
				// if a uri was provided, then the user probably want to connect to another dapp, we disconnect the previous one
				if (uri) {
					await wc.killSession()
					return createClient({ uri })
				}

				const networkConfig = networks.find(
					(networkConfig) =>
						networkConfig.currency ===
						selectedAccountRef.current?.currency,
				)
				if (networkConfig) {
					wc.updateSession({
						chainId: networkConfig.chainId,
						accounts: [selectedAccountRef.current.address],
					})
				}
			}
		},
		[],
	)

	const { t } = useTranslation()

	useEffect(() => {
		const sessionURI = localStorage.getItem('sessionURI')
		if (initialURI && initialURI !== sessionURI) {
			if (isV2(initialURI)) {
				goToWalletConnectV2(initialURI)
				return
			}
			createClient({ uri: initialURI })
			return
		}
		// restoring WC session if one is to be found in local storage
		const rawSession = localStorage.getItem('session')
		if (rawSession) {
			const session = JSON.parse(rawSession)
			createClient({ session })
		}
	}, [])

	const handleAccept = useCallback(() => {
		const account = selectedAccountRef.current
		if (wcRef.current && account) {
			const networkConfig = networks.find(
				(networkConfig) => networkConfig.currency === account.currency,
			)
			if (networkConfig) {
				wcRef.current.approveSession({
					chainId: networkConfig.chainId,
					accounts: [account.address],
				})
			}
		}
	}, [])

	const handleDecline = useCallback(() => {
		if (wcRef.current) {
			wcRef.current.rejectSession({
				message: 'DECLINED_BY_USER',
			})
		}
	}, [])

	const handleDisconnect = useCallback(() => {
		if (wcRef.current) {
			wcRef.current.killSession()
		}
	}, [])

	const handleSwitchAccount = useCallback(async () => {
		const enabledCurrencies = networks.map(
			(networkConfig) => networkConfig.currency,
		)
		try {
			const newSelectedAccount = await platformSDK.requestAccount({
				currencies: enabledCurrencies,
			})

			setState((oldState) => ({
				...oldState,
				selectedAccount: newSelectedAccount,
			}))
		} catch (error) {
			console.log('request account canceled by user')
		}
	}, [])

	const handleTimeout = useCallback(() => {
		setState((oldState) => ({
			...oldState,
			session: null,
			timedOut: true,
		}))
	}, [])

	const handleCancel = useCallback(() => {
		setState((oldState) => ({
			...oldState,
			session: null,
		}))
	}, [])

	const handleConnect = useCallback((uri: string) => {
		if (isV2(uri)) {
			goToWalletConnectV2(uri)
			return
		}
		createClient({ uri })
	}, [])

	const isV2 = (uri: string) => uri?.includes('@2?')

	const goToWalletConnectV2 = (uri?: string) => {
		const uriParam = `?uri=${uri ? encodeURIComponent(uri) : ''}`
		window.location.assign(
			`ledgerlive://discover/ledger-wallet-connect-v2${uriParam}`,
		)
	}

	return (
		<WalletConnectContainer>
			<BannerContainer>
				{session && session.peerMeta && session.connected ? (
					<CSSTransition classNames="fade" timeout={200}>
						<InfoConnectionAlert peerMeta={session.peerMeta} />
					</CSSTransition>
				) : null}
				{timedOut ? (
					<CSSTransition classNames="fade" timeout={200}>
						<TimedOutAlert />
					</CSSTransition>
				) : null}
			</BannerContainer>
			<WalletConnectInnerContainer>
				{session && selectedAccount ? (
					<>
						{session.peerMeta ? (
							<>
								{session.connected ? (
									<Link
										onClick={() => goToWalletConnectV2()}
										mb={6}
										mr={6}
										alignSelf="flex-end"
										Icon={ArrowRightMedium}
									>
										{t('goToWalletConnectV2')}
									</Link>
								) : null}
								<StatusIcon pulse={session.connected}>
									<Image
										width="55px"
										height="55px"
										src="/icons/walletconnect-logo.svg"
										alt="walletconnect-logo"
									/>
								</StatusIcon>
								<Text variant="h4" mt={8} textAlign="center">
									<GlitchText
										duration={2000}
										delay={0}
										text={
											session.connected
												? t('session.connected', {
														appName:
															session.peerMeta
																.name,
												  })
												: t('session.connecting', {
														appName:
															session.peerMeta
																.name,
												  })
										}
									/>
								</Text>
								{session.peerMeta.description ? (
									<Text
										variant="paragraphLineHeight"
										mt={5}
										color="neutral.c70"
										textAlign="center"
									>
										{session.peerMeta.description}
									</Text>
								) : null}
								{session.connected ? (
									<CSSTransition
										classNames="fade"
										timeout={200}
									>
										<Connected
											account={selectedAccount}
											onDisconnect={handleDisconnect}
											onSwitchAccount={
												handleSwitchAccount
											}
										/>
									</CSSTransition>
								) : (
									<CSSTransition
										classNames="fade"
										timeout={200}
									>
										<PendingRequest
											account={selectedAccount}
											onAccept={handleAccept}
											onDecline={handleDecline}
											onSwitchAccount={
												handleSwitchAccount
											}
										/>
									</CSSTransition>
								)}
							</>
						) : (
							<PendingConnection
								timeout={10000}
								onTimeout={handleTimeout}
								onCancel={handleCancel}
							/>
						)}
					</>
				) : (
					<CSSTransition classNames="fade" timeout={200}>
						<Disconnected
							mode={initialMode}
							initialURI={initialURI}
							onConnect={handleConnect}
						/>
					</CSSTransition>
				)}
			</WalletConnectInnerContainer>
		</WalletConnectContainer>
	)
}
