import { Flex, Text, Button } from '@ledgerhq/react-ui'
import { CloseMedium } from '@ledgerhq/react-ui/assets/icons'
import { useTranslation } from 'next-i18next'
import { useEffect } from 'react'
import useAnalytics from 'src/shared/useAnalytics'
import styled from 'styled-components'
import router from 'next/router'

export { getServerSideProps } from '../lib/serverProps'

const LogoContainer = styled(Flex)`
	border-radius: 50%;
	align-items: center;
	justify-content: center;
	background-color: ${(p) => p.theme.colors.error.c50};
	height: 50px;
	width: 50px;
`

export default function ProtocolNotSupported() {
	const { t } = useTranslation()
	const analytics = useAnalytics()

	useEffect(() => {
		analytics.page('Wallet Connect Error Unsupported Protocol V1')
	}, [])

	return (
		<Flex
			alignItems="center"
			justifyContent="center"
			flexDirection="column"
			flex={1}
			height={'100%'}
			width={'100%'}
			px={6}
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
				{t('connect.errorProtocol.title')}
			</Text>
			<Text
				variant="bodyLineHeight"
				fontWeight="medium"
				color="neutral.c80"
				mt={10}
				textAlign="center"
			>
				{t('connect.errorProtocol.desc')}
			</Text>

			<Button
				mt={12}
				onClick={() => router.push('/')}
				data-test="connect-button"
				variant="main"
				size="large"
			>
				<Text
					fontSize="body"
					fontWeight="semiBold"
					color={'neutral.c00'}
				>
					{t('close')}
				</Text>
			</Button>
		</Flex>
	)
}
