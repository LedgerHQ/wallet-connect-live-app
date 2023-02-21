import { useRouter } from 'next/router'

enum routes {
	home = '/',
	sessionProposal = '/proposal',
	sessionDetails = '/detail',
	reject = '/reject',
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
