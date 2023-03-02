/* eslint-disable @typescript-eslint/no-explicit-any */
import { convertEthToLiveTX } from '@/helpers/converters'
import { compareETHAddresses } from '@/helpers/generic'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import { Account } from '@ledgerhq/live-app-sdk'
import { useEffect, useCallback } from 'react'
import { useAppStore, appSelector } from '@/storage/app.store'
import WalletConnectClient from '@walletconnect/client'
import useNavigation from './useNavigation'
import { useV1Store } from '@/storage/v1.store'
import { Proposal } from '@/types/types'
import { isV1 } from '@/helpers/walletConnect.util'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { platformSDK } from './useLedgerLive'

type WalletConnectState = {
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
		timedOut: false,
		selectedAccount,
	}
}

type WalletConnectV1Props = {
	initialAccountId?: string
	initialURI?: string
}

export default function useWalletConnectV1Logic({
	initialAccountId,
	initialURI,
}: WalletConnectV1Props) {
	const networks = useAppStore(appSelector.selectNetworks)
	const accounts = useAccountsStore(accountSelector.selectAccounts)
	const { routes, navigate, tabsIndexes } = useNavigation()
	const {
		setSelectedAccount,
		setTimedOut,
		setProposal,
		setSessionUri,
		clearStore,
		selectedAccount,
		sessionURI,
		walletConnectClient,
		setWalletConnectClient,
	} = useV1Store()

	useEffect(() => {
		if (initialURI && initialURI !== sessionURI && isV1(initialURI)) {
			createClient({ uri: initialURI })
			return
		}
		// restoring WC session if one is to be found in local storage
		if (walletConnectClient?.session) {
			createClient({ session: walletConnectClient.session })
		}
	}, [])

	useEffect(() => {
		const { selectedAccount: selectedAccountLocal, timedOut } =
			getInitialState(accounts, initialAccountId, selectedAccount?.id)
		setSelectedAccount(selectedAccountLocal)
		setTimedOut(timedOut)
	}, [accounts, initialAccountId])

	useEffect(() => {
		console.log('USE EFFECT', selectedAccount)
		console.log('account id', selectedAccount?.id)

		if (
			selectedAccount &&
			walletConnectClient &&
			walletConnectClient.connected
		) {
			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			)
			if (networkConfig) {
				walletConnectClient.updateSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccount.address],
				})
				setWalletConnectClient(walletConnectClient)
			}
		}
	}, [selectedAccount, selectedAccount?.id])

	const cleanup = useCallback(() => {
		// cleaning everything and reverting to initial state

		const tempAcc = selectedAccount
		setSessionUri(undefined)
		clearStore()
		setSelectedAccount(tempAcc)
	}, [])

	const createClient = useCallback(
		async (params: { uri?: string; session?: any }): Promise<void> => {
			if (walletConnectClient && walletConnectClient.session) {
				console.log(
					'walletConnectClient IF',
					walletConnectClient.session,
				)
				await walletConnectClient.killSession()
			}
			const { uri, session } = params
			if (!uri && !session) {
				throw new Error(
					'Need either uri or session to be provided to createClient',
				)
			}

			const wc = new WalletConnectClient({ uri, session })

			console.log('createClient', wc)
			console.log('walletConnectClient', walletConnectClient)
			wc.on('session_request', (error, payload) => {
				setWalletConnectClient(wc)
				if (error) {
				}
				setProposal(payload as Proposal)
				setTimeout(() => {
					navigate(routes.sessionProposalV1)
				}, 500)
			})

			wc.on('connect', async () => {
				setWalletConnectClient(wc)
				if (uri) {
					setSessionUri(uri)
				}
			})

			wc.on('disconnect', () => {
				cleanup()
				navigate(routes.home, { tab: tabsIndexes.sessions })
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
							selectedAccount: selectedAccount,
						})
						if (
							selectedAccount &&
							compareETHAddresses(
								selectedAccount.address,
								ethTX.from,
							)
						) {
							try {
								const liveTX = convertEthToLiveTX(ethTX)
								const signedTransaction =
									await platformSDK.signTransaction(
										selectedAccount.id,
										liveTX,
									)
								const hash =
									await platformSDK.broadcastSignedTransaction(
										selectedAccount.id,
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
							selectedAccount &&
							compareETHAddresses(
								selectedAccount.address,
								payload.params[1],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[0],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccount.id,
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
							selectedAccount &&
							compareETHAddresses(
								selectedAccount.address,
								payload.params[0],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[1],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccount.id,
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
							selectedAccount &&
							compareETHAddresses(
								selectedAccount.address,
								payload.params[0],
							)
						) {
							try {
								const message = stripHexPrefix(
									payload.params[1],
								)

								const signedMessage =
									await platformSDK.signMessage(
										selectedAccount.id,
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
					case 'wallet_switchEthereumChain': {
						try {
							const chainIdParam = payload.params[0]?.chainId
							const chainId = parseInt(chainIdParam)
							const chain = networks.find(
								(networkConfig) =>
									networkConfig.chainId === chainId,
							)
							if (chain) {
								handleSwitchAccount([chain.currency])
							} else {
								wc.rejectRequest({
									id: payload.id,
									jsonrpc: '2.0',
									error: {
										code: 3,
										message: 'This chain is not supported',
									},
								})
							}
						} catch (error) {
							console.log(error)
							wc.rejectRequest({
								id: payload.id,
								jsonrpc: '2.0',
								error: {
									code: 3,
									message: 'An error occured',
								},
							})
						}
						break
					}
				}
			})

			// a client is already connected
			if (
				walletConnectClient &&
				walletConnectClient.connected &&
				selectedAccount
			) {
				// if a uri was provided, then the user probably want to connect to another dapp, we disconnect the previous one
				if (uri) {
					await walletConnectClient.killSession()
					return createClient({ uri })
				}

				const networkConfig = networks.find(
					(networkConfig) =>
						networkConfig.currency === selectedAccount?.currency,
				)

				if (networkConfig) {
					walletConnectClient.updateSession({
						chainId: networkConfig.chainId,
						accounts: [selectedAccount.address],
					})

					setWalletConnectClient(walletConnectClient)
				}
			}
		},
		[walletConnectClient],
	)

	const handleAccept = useCallback(() => {
		console.log(walletConnectClient)
		if (walletConnectClient && selectedAccount) {
			console.log(walletConnectClient, 'azccept')
			const networkConfig = networks.find(
				(networkConfig) =>
					networkConfig.currency === selectedAccount.currency,
			)
			if (networkConfig) {
				walletConnectClient.approveSession({
					chainId: networkConfig.chainId,
					accounts: [selectedAccount.address],
				})
				navigate(routes.sessionDetailsV1)
			}
		}
	}, [])

	const handleDecline = useCallback(() => {
		if (walletConnectClient) {
			walletConnectClient.rejectSession({
				message: 'DECLINED_BY_USER',
			})

			setProposal(undefined)
			setWalletConnectClient(undefined)
		}
		navigate(routes.home)
	}, [])

	const handleDisconnect = useCallback(() => {
		if (walletConnectClient) {
			walletConnectClient.killSession()
		}
		setWalletConnectClient(undefined)
	}, [])

	const handleSwitchAccount = useCallback(async (currencies?: string[]) => {
		const enabledCurrencies = networks.map(
			(networkConfig) => networkConfig.currency,
		)
		try {
			const newSelectedAccount = await platformSDK.requestAccount({
				currencies: currencies || enabledCurrencies,
			})

			setSelectedAccount(newSelectedAccount)
		} catch (error) {
			console.log('request account canceled by user')
		}
	}, [])

	return {
		handleDisconnect,
		handleSwitchAccount,
		handleAccept,
		handleDecline,
		createClient,
		isV1,
		cleanup,
	}
}
