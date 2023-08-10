import { Flex, StyleProvider, Text } from '@ledgerhq/react-ui'
import { CloseMedium } from '@ledgerhq/react-ui/assets/icons'
import { ThemeNames } from '@ledgerhq/react-ui/styles'
import { useTranslation } from 'next-i18next'
import { useRouter } from 'next/router'
import { useEffect, useMemo } from 'react'
import useAnalytics from 'src/shared/useAnalytics'
import styled from 'styled-components'

const LogoContainer = styled(Flex)`
	border-radius: 50%;
	align-items: center;
	justify-content: center;
	background-color: ${(p) => p.theme.colors.error.c50};
	height: 50px;
	width: 50px;
`

export function ApplicationDisabled() {
	const { t } = useTranslation()
	const analytics = useAnalytics()
	const router = useRouter()

	const theme = useMemo(
		() => router?.query?.theme || 'light',
		[router?.query?.theme],
	)

	useEffect(() => {
		analytics.page('WalletConnect Has Been Disabled')
	}, [])

	return (
		<StyleProvider
			selectedPalette={theme as ThemeNames | undefined}
			fontsPath="/fonts"
		>
			<Flex
				alignItems="center"
				justifyContent="center"
				flexDirection="column"
				flex={1}
			>
				<LogoContainer>
					<CloseMedium size={32} color="background.main" />
				</LogoContainer>
				<Text
					variant="h4"
					fontWeight="medium"
					color="neutral.c100"
					mt={10}
					textAlign="center"
				>
					{t('applicationDisabled.title')}
				</Text>
				<Text
					variant="bodyLineHeight"
					fontWeight="medium"
					color="neutral.c80"
					mt={10}
					textAlign="center"
				>
					{t('applicationDisabled.desc')}
				</Text>
			</Flex>
		</StyleProvider>
	)
}
