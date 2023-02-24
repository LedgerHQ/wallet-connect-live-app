import { useRouter } from 'next/router'

enum tabsIndexes {
	connect = 0,
	sessions = 1,
}

enum routes {
	home = '/',
	sessionProposal = '/proposal',
	sessionDetails = '/detail',

	// Routes specific to Wallet Connect V1
	sessionDetailsV1 = '/detail1',
	sessionProposalV1 = '/proposal1',
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
