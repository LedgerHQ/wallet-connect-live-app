import { useRouter } from 'next/router'

enum tabsIndexes {
	connect = 0,
	sessions = 1,
}

enum routes {
	home = '/',
	sessionProposal = '/proposal',
	sessionDetails = '/detail',
	protocolNotSupported = '/protocol-not-supported',
}

export default function useNavigation() {
	const router = useRouter()

	function navigate(route: routes, params?: unknown) {
		router.push({
			pathname: route,
			query: { data: JSON.stringify(params) },
		})
	}

	return {
		tabsIndexes,
		routes,
		navigate,
		router,
	}
}
