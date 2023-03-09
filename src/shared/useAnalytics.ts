import { useCallback, useMemo, useState } from 'react'
import { WalletInfo } from '@ledgerhq/wallet-api-client'
import { AnalyticsBrowser } from '@segment/analytics-next'
import { sessionSelector, useSessionsStore } from '@/storage/sessions.store'

const analyticsOptions = { ip: '0.0.0.0' }

let analytics: AnalyticsBrowser | undefined

export default function useAnalytics() {
	const [userId, setUserId] = useState<string | undefined>(undefined)
	const sessions = useSessionsStore(sessionSelector.selectSessions)

	const userProperties = useMemo(() => {
		return {
			sessionsConnected: sessions?.length || 0,
		}
	}, [sessions?.length])

	const start = useCallback(
		(userId?: string, walletInfo?: WalletInfo['result']) => {
			console.log('START', analytics)
			if (analytics) return
			if (!userId || !walletInfo) return

			const walletName = walletInfo.wallet.name

			let writeKey: string | undefined = undefined
			if (walletName === 'ledger-live-desktop') {
				writeKey = process.env.NEXT_PUBLIC_SEGMENT_API_KEY_DESKTOP
			} else if (walletName === 'ledger-live-mobile') {
				writeKey = process.env.NEXT_PUBLIC_SEGMENT_API_KEY_MOBILE
			}

			if (walletInfo.tracking && writeKey) {
				analytics = AnalyticsBrowser.load({ writeKey })
				identify()
			}
			setUserId(userId)
		},
		[],
	)

	const identify = useCallback(() => {
		if (!analytics) return

		analytics.identify(userId, userProperties, analyticsOptions)
	}, [userId, userProperties])

	const track = useCallback(
		(eventName: string, eventProperties?: Record<string, unknown>) => {
			if (!analytics) return

			const allProperties = {
				...userProperties,
				...eventProperties,
			}
			analytics.track(eventName, allProperties, analyticsOptions)
		},
		[userProperties],
	)

	const page = useCallback(
		(pageName: string, eventProperties?: Record<string, unknown>) => {
			if (!analytics) return

			const category = 'Wallet Connect v2'

			const allProperties = {
				...userProperties,
				...eventProperties,
			}
			analytics.page(category, pageName, allProperties, analyticsOptions)
		},
		[userProperties],
	)

	return {
		start,
		identify,
		track,
		page,
	}
}