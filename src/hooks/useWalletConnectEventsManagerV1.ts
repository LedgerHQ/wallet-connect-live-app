// import ModalStore from '@/store/ModalStore'

import { useCallback, useEffect } from 'react'
import useNavigation from './useNavigation'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import { platformSDK } from './useLedgerLive'
import { convertEthToLiveTX } from '@/helpers/converters'
import { accountSelector, useAccountsStore } from '@/storage/accounts.store'
import { wc } from '@/helpers/walletConnectV1.util'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'

enum Errors {
	userDecline = 'User rejected',
	txDeclined = 'Transaction declined',
	msgDecline = 'Message signed declined',
}

export default function useWalletConnectEventsManagerV1(initialized: boolean) {
	const { navigate, routes, tabsIndexes } = useNavigation()
	const removeSession = useSessionsStore(sessionSelector.removeSession)
	const accounts = useAccountsStore(accountSelector.selectAccounts)

	const onSessionRequest = useCallback(async (error, payload) => {
		if (error) {
		}
		setProposal(payload as Proposal)
		setTimeout(() => {
			navigate(routes.sessionProposalV1)
		}, 500)
	}, [])

	const onConnect = useCallback(async () => {
		setSession(wc.session)

		if (uri) {
			setSessionUri(uri)
		}
	}, [])

	const onDisconnect = useCallback(() => {
		cleanup()
		navigate(routes.home, { tab: tabsIndexes.sessions })
	}, [])

	const onCallRequest = useCallback(async (error, payload: any) => {
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
					compareETHAddresses(selectedAccount.address, ethTX.from)
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
						const message = stripHexPrefix(payload.params[0])

						const signedMessage = await platformSDK.signMessage(
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
								message: 'Personal message signed declined',
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
						const message = stripHexPrefix(payload.params[1])

						const signedMessage = await platformSDK.signMessage(
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
						const message = stripHexPrefix(payload.params[1])

						const signedMessage = await platformSDK.signMessage(
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
						(networkConfig) => networkConfig.chainId === chainId,
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
	}, [])

	/******************************************************************************
	 * Set up WalletConnect event listeners
	 *****************************************************************************/
	useEffect(() => {
		if (initialized) {
			wc.on('session_request', onSessionRequest)

			wc.on('connect', onConnect)

			wc.on('disconnect', onDisconnect)

			wc.on('error', (error) => {
				console.log('error', { error })
			})

			wc.on('call_request', onCallRequest)
		}
	}, [
		wc,
		initialized,
		onSessionRequest,
		onConnect,
		onDisconnect,
		onCallRequest,
	])

	/******************************************************************************
	 * Util functions
	 *****************************************************************************/
	const acceptRequest = (
		topic: string,
		id: number,
		signedMessage: string,
	) => {
		web3wallet.respondSessionRequest({
			topic,
			response: {
				id,
				jsonrpc: '2.0',
				result: signedMessage,
			},
		})
	}

	const rejectRequest = (topic: string, id: number, message: Errors) => {
		web3wallet.respondSessionRequest({
			topic,
			response: {
				id,
				jsonrpc: '2.0',
				error: {
					code: 5000,
					message,
				},
			},
		})
	}
}
