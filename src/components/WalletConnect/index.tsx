import { NetworkConfig } from '@/types/types'
import { Text } from '@ledgerhq/react-ui'
import GlitchText from '@ledgerhq/react-ui/components/animations/GlitchText'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'

import WalletConnectClient from '@walletconnect/client'
import { IWalletConnectSession, IJsonRpcRequest } from '@walletconnect/types'
import Image from 'next/image'
import { useCallback, useState, useRef, useEffect } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { convertEthToLiveTX } from '@/helpers/converters'
import { compareETHAddresses } from '@/helpers/generic'
import { InfoConnectionAlert } from '../alerts/InfoConnection'
import { CSSTransition, TransitionGroup } from 'react-transition-group'
import { PendingConnection } from './PendingConnection'
import { TimedOutAlert } from '../alerts/ErrorTimedOut'
import { PendingRequest } from './PendingRequest'
import { Connected } from './Connected'
import { Disconnected } from './Disconnected'

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
	z-index: 1;
	position: absolute;
	top: 0;
	left: 0;
	right: 0;

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

const getInitialState = (accounts: Account[], initialAccountId?: string): WalletConnectState => {
	const savedAccountId = localStorage.getItem('accountId')

	const initialAccount = initialAccountId ? accounts.find(account => account.id === initialAccountId) : undefined
	const savedAccount = savedAccountId ? accounts.find(account => account.id === savedAccountId) : undefined
	const defaultAccount = accounts.length > 0 ? accounts [0] : undefined

	const selectedAccount = initialAccount || savedAccount || defaultAccount;
	return {
		session: null,
		timedOut: false,
		selectedAccount,
	}
}

export type WalletConnectProps = {
	initialAccountId?: string
	initialURI?: string
	networks: NetworkConfig[]
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
}

export function WalletConnect({
	initialAccountId,
	initialURI,
	networks = [],
	platformSDK,
	accounts,
}: WalletConnectProps) {
	const selectedAccountRef = useRef<Account | undefined>(accounts[0])
	const clientInstanceRef = useRef<WalletConnectClient>()

	const [state, setState] = useState<WalletConnectState>(getInitialState(accounts, initialAccountId))

	console.log(state)

	const { session, selectedAccount, timedOut } = state

	useEffect(() => {
		selectedAccountRef.current = selectedAccount
		const clientInstance = clientInstanceRef.current

		if (clientInstance && clientInstance.connected && selectedAccount) {
			localStorage.setItem('accountId', selectedAccount.id);

			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			) as NetworkConfig
			clientInstance.updateSession({
				chainId: networkConfig.chainId,
				accounts: [selectedAccount.address],
			})
			setState((oldState) => ({
				...oldState,
				session: {
					...clientInstance.session,
				},
			}))
		}
	}, [selectedAccount])

	const createClient = useCallback(
		async (params: { uri?: string; session?: IWalletConnectSession }): Promise<void> => {
			const { uri, session } = params
			if (!uri && !session) {
				throw new Error(
					'Need either uri or session to be provided to createClient',
				)
			}

			const clientInstance = new WalletConnectClient({ uri, session })

			// synchronize WC state with react and trigger necessary rerenders
			const syncSessionWithReactState = () => {
				setState((oldState) => ({
					...oldState,
					timedOut: false,
					session: {
						...clientInstance.session,
					},
				}))
			}

			clientInstance.on('session_request', (error, payload) => {
				console.log('session_request', {
					error,
					payload,
				})

				if (error) {
				}

				syncSessionWithReactState()
			})

			clientInstance.on('connect', () => {
				syncSessionWithReactState()
				localStorage.setItem(
					'session',
					JSON.stringify(clientInstance.session),
				)

				if (uri) {
					localStorage.setItem("sessionURI", uri);
				}
			})

			clientInstance.on('disconnect', () => {
				// cleaning everything and reverting to initial state
				setState((oldState) => {
					return {
						...oldState,
						session: null,
					}
				})
				clientInstanceRef.current = undefined
				localStorage.removeItem('session')
				localStorage.removeItem('sessionURI')
			})

			clientInstance.on('error', (error) => {
				console.log('error', { error })
			})

			clientInstance.on(
				'call_request',
				async (error, payload: IJsonRpcRequest) => {
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
									clientInstance.approveRequest({
										id: payload.id,
										jsonrpc: '2.0',
										result: hash,
									})
								} catch (error) {
									clientInstance.rejectRequest({
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
					}
				},
			)

			// saving the client instance ref for further usage
			clientInstanceRef.current = clientInstance
			syncSessionWithReactState()

			console.log('COND=', {
				first: clientInstance.connected,
				second: selectedAccountRef.current,
			})

			// a client is already connected
			if (clientInstance.connected && selectedAccountRef.current) {
				// if a uri was provided, then the user probably want to connect to another dapp, we disconnect the previous one
				if (uri) {
					console.log("killing session")
					await clientInstance.killSession();
					return createClient({ uri });
				}

				const networkConfig = networks.find(
					(networkConfig) =>
						networkConfig.currency ===
						selectedAccountRef.current?.currency,
				) as NetworkConfig
				clientInstance.updateSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccountRef.current.address],
				})
			}
		},
		[],
	)

	useEffect(() => {
		const sessionURI = localStorage.getItem('sessionURI')
		if (initialURI && initialURI !== sessionURI) {
			createClient({ uri: initialURI })
			return;
		}
		// restoring WC session if one is to be found in local storage
		const rawSession = localStorage.getItem('session')
		if (rawSession) {
			const session = JSON.parse(rawSession)
			createClient({ session })
		}
	}, [])

	const handleAccept = useCallback(() => {
		if (clientInstanceRef.current && selectedAccountRef.current) {
			clientInstanceRef.current.approveSession({
				chainId: 1,
				accounts: [selectedAccountRef.current.address],
			})
		}
	}, [])

	const handleDecline = useCallback(() => {
		if (clientInstanceRef.current) {
			clientInstanceRef.current.rejectSession({
				message: 'DECLINED_BY_USER',
			})
		}
	}, [])

	const handleDisconnect = useCallback(() => {
		if (clientInstanceRef.current) {
			clientInstanceRef.current.killSession()
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
											? `connected to [${session.peerMeta.name}]`
											: `[${session.peerMeta.name}] is trying to connect`
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
											onAccept={handleAccept}
											onDecline={handleDecline}
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
							onConnect={(uri) => {
								createClient({ uri })
							}}
						/>
					</CSSTransition>
				)}
			</WalletConnectInnerContainer>
		</WalletConnectContainer>
	)
}
