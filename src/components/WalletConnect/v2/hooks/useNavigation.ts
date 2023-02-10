import { useRouter } from 'next/router'

enum routes {
	sessionProposal = '/v2/proposal',
	sessionDetails = '/v2/sessionDetails',
}

export default function useNavigation() {
	const router = useRouter()

	function navigate(route: routes, params?: any) {
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
