/* eslint-disable @typescript-eslint/no-explicit-any */
// import ModalStore from '@/store/ModalStore'

import { useCallback, useEffect } from 'react'
import useNavigation from './useNavigation'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import { platformSDK } from './useLedgerLive'
import { convertEthToLiveTX } from '@/helpers/converters'
import { wc } from '@/helpers/walletConnectV1.util'
import { EIP155_SIGNING_METHODS } from '@/data/EIP155Data'
import { useV1Store, v1Selector } from '@/storage/v1.store'
import { Proposal } from '@/types/types'
import { appSelector, useAppStore } from '@/storage/app.store'
import { compareETHAddresses } from '@/helpers/generic'
import useWalletConnectV1Utils from './useWalletConnectV1Utils'

export default function useWalletConnectEventsManagerV1(initialized: boolean) {
	const networks = useAppStore(appSelector.selectNetworks)
	const { navigate, routes, tabsIndexes } = useNavigation()
	const { cleanup, handleSwitchAccount } = useWalletConnectV1Utils()
	const { setProposal, selectedAccount } = useV1Store()
	const setWalletConnectClient = useV1Store(v1Selector.setWalletConnectClient)

	const onSessionRequest = useCallback(
		async (error: any, payload: Proposal) => {
			if (error) {
			}
			console.log('ON SESS REQ', error, payload)
			setProposal(payload)
			setTimeout(() => {
				navigate(routes.sessionProposalV1)
			}, 500)
		},
		[],
	)

	const onConnect = useCallback(async () => {
		setWalletConnectClient(wc)
		navigate(routes.sessionDetailsV1)
	}, [])

	const onDisconnect = useCallback(() => {
		cleanup()
		navigate(routes.home, { tab: tabsIndexes.sessions })
	}, [])

	const onCallRequest = useCallback(async (error: any, payload: any) => {
		console.log('call_request', { error, payload })
		if (error) {
		}

		switch (payload.method) {
			case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION: {
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
			case EIP155_SIGNING_METHODS.PERSONAL_SIGN: {
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
			case EIP155_SIGNING_METHODS.ETH_SIGN: {
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
			case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA: {
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
			case EIP155_SIGNING_METHODS.SWITCH_CHAIN: {
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
		console.log('RESET LISTENERS', initialized, wc)
		if (initialized && wc) {
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
}
