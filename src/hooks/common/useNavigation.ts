import { useRouter } from 'next/router'

import type { routes } from '@/shared/navigation'

export function useNavigation() {
  const router = useRouter()

  function navigate(route: routes, params?: unknown) {
    router.push({
      pathname: route,
      query: { data: JSON.stringify(params) },
    })
  }

  return {
    navigate,
    router,
  }
}
