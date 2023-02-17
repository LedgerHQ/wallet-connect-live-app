import { useRouter } from 'next/router'

enum routes {
	sessionProposal = '/v2/proposal',
	sessionDetails = '/v2/detail',
	reject = '/v2/reject',
	connect = '/v2/connect',
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
		routes,
		navigate,
		router,
	}
}
