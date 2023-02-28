import { EIP155_SIGNING_METHODS } from '@/data/EIP155Data'
// import ModalStore from '@/store/ModalStore'

import { SignClientTypes } from '@walletconnect/types'
import { useCallback, useEffect } from 'react'
import { Web3WalletTypes } from '@walletconnect/web3wallet'
import useNavigation from '@/hooks/useNavigation'
import { hasETHAddress } from '@/helpers/generic'
import { stripHexPrefix } from '@/utils/currencyFormatter/helpers'
import { platformSDK } from './useLedgerLive'
import { convertEthToLiveTX } from '@/helpers/converters'
import { accountSelector, useAccountsStore } from 'src/storage/accounts.store'
import { web3wallet } from '@/helpers/walletConnect.util'

enum Errors {
	userDecline = 'User rejected',
	txDeclined = 'Transaction declined',
	msgDecline = 'Message signed declined',
}

export default function useWalletConnectEventsManager(initialized: boolean) {
	const { navigate, routes } = useNavigation()
	const accounts = useAccountsStore(accountSelector.selectAccounts)
	/******************************************************************************
	 * 1. Open session proposal modal for confirmation / rejection
	 *****************************************************************************/
	const onSessionProposal = useCallback(
		(proposal: SignClientTypes.EventArguments['session_proposal']) => {
			navigate(routes.sessionProposal, proposal)
		},
		[],
	)

	const onAuthRequest = useCallback(
		(_request: Web3WalletTypes.AuthRequest) => {
			// ModalStore.open('AuthRequestModal', { request })
		},
		[],
	)

	/******************************************************************************
	 * 3. Open request handling modal based on method that was used
	 *****************************************************************************/
	const onSessionRequest = useCallback(
		async (
			requestEvent: SignClientTypes.EventArguments['session_request'],
		) => {
			const { topic, params, id } = requestEvent
			const { request } = params

			switch (request.method) {
				case EIP155_SIGNING_METHODS.ETH_SIGN:
				case EIP155_SIGNING_METHODS.PERSONAL_SIGN:
					const accountSign = hasETHAddress(
						accounts,
						request.params[1],
					)
					if (!!accountSign) {
						try {
							const message = stripHexPrefix(request.params[0])

							const signedMessage = await platformSDK.signMessage(
								accountSign.id,
								Buffer.from(message, 'hex'),
							)
							acceptRequest(topic, id, signedMessage)
						} catch (error) {
							rejectRequest(topic, id, Errors.userDecline)
						}
						break
					}

				case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA:
				case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V3:
				case EIP155_SIGNING_METHODS.ETH_SIGN_TYPED_DATA_V4:
					const accountSignTyped = hasETHAddress(
						accounts,
						request.params[0],
					)
					if (!!accountSignTyped) {
						try {
							const message = stripHexPrefix(request.params[1])

							const signedMessage = await platformSDK.signMessage(
								accountSignTyped.id,
								Buffer.from(message),
							)
							acceptRequest(topic, id, signedMessage)
						} catch (error) {
							rejectRequest(topic, id, Errors.msgDecline)
						}
						break
					}
				case EIP155_SIGNING_METHODS.ETH_SEND_TRANSACTION:
				case EIP155_SIGNING_METHODS.ETH_SIGN_TRANSACTION:
					const ethTX = request.params[0]
					const accountTX = hasETHAddress(accounts, ethTX.from)
					if (!!accountTX) {
						try {
							const liveTX = convertEthToLiveTX(ethTX)
							const signedTransaction =
								await platformSDK.signTransaction(
									accountTX.id,
									liveTX,
								)
							const hash =
								await platformSDK.broadcastSignedTransaction(
									accountTX.id,
									signedTransaction,
								)

							acceptRequest(topic, id, hash)
						} catch (error) {
							rejectRequest(topic, id, Errors.txDeclined)
						}
					}

				default:
					return // ModalStore.open('SessionUnsuportedMethodModal', { requestEvent, requestSession })
			}
		},
		[],
	)

	/******************************************************************************
	 * Set up WalletConnect event listeners
	 *****************************************************************************/
	useEffect(() => {
		if (initialized) {
			// sign
			web3wallet.on('session_proposal', onSessionProposal)
			web3wallet.on('session_request', onSessionRequest)
			// auth
			web3wallet.on('auth_request', onAuthRequest)

			// TODOs
			// signClient.on('session_ping', data => console.log('ping', data))
			// signClient.on('session_event', data => console.log('event', data))
			// signClient.on('session_update', data => console.log('update', data))
			// signClient.on('session_delete', data => console.log('delete', data))
		}
	}, [initialized, onSessionProposal, onSessionRequest, onAuthRequest])

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
