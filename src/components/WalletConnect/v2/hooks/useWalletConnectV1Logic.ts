/* eslint-disable @typescript-eslint/no-explicit-any */
import { convertEthToLiveTX } from '@/helpers/converters'
import { compareETHAddresses } from '@/helpers/generic'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import LedgerLivePlarformSDK, { Account } from '@ledgerhq/live-app-sdk'
import { useRef, useEffect, useCallback, Dispatch, SetStateAction } from 'react'
import { useAppStore, appSelector } from 'src/store/App.store'
import WalletConnectClient from '@walletconnect/client'
import useNavigation from './useNavigation'
import { useV1Store } from 'src/store/v1.store'
import { Proposal } from '@/types/types'

type WalletConnectState = {
	session: any | null
	timedOut: boolean
	selectedAccount?: Account
}

const getInitialState = (
	accounts: Account[],
	initialAccountId?: string,
	savedAccountId?: string,
): WalletConnectState => {
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

type WalletConnectV1Props = {
	initialAccountId?: string
	initialURI?: string
	platformSDK: LedgerLivePlarformSDK
	accounts: Account[]
	setUri: Dispatch<SetStateAction<string | undefined>>
}

export let walletConnectV1Logic: any

export default function useWalletConnectV1Logic({
	initialAccountId,
	initialURI,
	platformSDK,
	accounts,
	setUri,
}: WalletConnectV1Props) {
	const selectedAccountRef = useRef<Account>()
	const wcRef = useRef<WalletConnectClient>()
	const networks = useAppStore(appSelector.selectNetworks)
	const { navigate, routes, tabsIndexes } = useNavigation()
	const {
		setSelectedAccount,
		setSession,
		setTimedOut,
		selectedAccount,
		setProposal,
	} = useV1Store()

	useEffect(() => {
		const {
			selectedAccount: selectedAccountLocal,
			timedOut,
			session,
		} = getInitialState(accounts, initialAccountId, selectedAccount?.id)
		setSelectedAccount(selectedAccountLocal)
		setTimedOut(timedOut)
		setSession(session)
	}, [accounts, initialAccountId])

	const isV1 = (uri: string) => uri?.includes('@1?')

	useEffect(() => {
		selectedAccountRef.current = selectedAccount
		const wc = wcRef.current

		if (selectedAccount) {
			setSelectedAccount(selectedAccount)
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
				setSession(wc.session)
			}
		}
	}, [selectedAccount])

	const cleanup = useCallback((timedOut = false) => {
		// cleaning everything and reverting to initial state
		setSession(null)
		setTimedOut(timedOut)
		setSelectedAccount(undefined)
		setProposal(null)
		wcRef.current = undefined
		setUri(undefined)
		localStorage.removeItem('session')
		localStorage.removeItem('sessionURI')
	}, [])

	const createClient = useCallback(
		async (params: { uri?: string; session?: any }): Promise<void> => {
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
				setSession(wc.session)
				setTimedOut(false)
			}

			wc.on('session_request', (error, payload) => {
				console.log('session_request', {
					error,
					payload,
					selectedAccount,
				})

				if (error) {
				}
				setProposal(payload as Proposal)
				syncSessionWithReactState()
				navigate(routes.sessionProposalV1)
			})

			wc.on('connect', () => {
				syncSessionWithReactState()
				localStorage.setItem('session', JSON.stringify(wc.session))

				if (uri) {
					localStorage.setItem('sessionURI', uri)
				}
			})

			wc.on('disconnect', () => {
				cleanup()
			})

			wc.on('error', (error) => {
				console.log('error', { error })
			})

			wc.on('call_request', async (error, payload: any) => {
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

	useEffect(() => {
		const sessionURI = localStorage.getItem('sessionURI')
		if (initialURI && initialURI !== sessionURI && isV1(initialURI)) {
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
				navigate(routes.home, { tab: tabsIndexes.sessions })
			}
		}
	}, [])

	const handleDecline = useCallback(() => {
		if (wcRef.current) {
			wcRef.current.rejectSession({
				message: 'DECLINED_BY_USER',
			})
		}
		navigate(routes.home)
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

			setSelectedAccount(newSelectedAccount)
		} catch (error) {
			console.log('request account canceled by user')
		}
	}, [])

	const handleTimeout = useCallback(() => {
		cleanup(true)
	}, [])

	const handleCancel = useCallback(() => {
		cleanup()
	}, [])

	walletConnectV1Logic = {
		handleDisconnect,
		handleSwitchAccount,
		handleAccept,
		handleDecline,
		handleTimeout,
		handleCancel,
		createClient,
		isV1,
		cleanup,
	}
}
