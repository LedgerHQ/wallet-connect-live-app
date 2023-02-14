import { Flex, Text } from '@ledgerhq/react-ui'
import { WarningMedium } from '@ledgerhq/react-ui/assets/icons'
import { useTranslation } from 'next-i18next'
import styled from 'styled-components'

const LogoContainer = styled(Flex)`
	border-radius: 50%;
	align-items: center;
	justify-content: center;
	background-color: ${(p) => p.theme.colors.warning.c50};
	height: 50px;
	width: 50px;
`

export function PartialBlockchainSupported() {
	const { t } = useTranslation()
	return (
		<Flex
			alignItems="center"
			justifyContent="center"
			flexDirection="column"
			flex={1}
		>
			<LogoContainer>
				<WarningMedium size={32} color="background.main" />
			</LogoContainer>
			<Text variant="h4" fontWeight="medium" color="neutral.c100" mt={6}>
				{t('sessionProposal.warning.title')}
			</Text>
			<Text
				variant="bodyLineHeight"
				fontWeight="medium"
				color="neutral.c80"
				mt={3}
			>
				{t('sessionProposal.warning.desc')}
			</Text>
		</Flex>
	)
}
