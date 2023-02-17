import { Flex, Text } from '@ledgerhq/react-ui'
import { CheckAloneMedium } from '@ledgerhq/react-ui/assets/icons'
import { useTranslation } from 'next-i18next'
import styled from 'styled-components'

const Row = styled(Flex)``

export function InfoSessionProposal() {
	const { t } = useTranslation()
	return (
		<Flex flexDirection="column">
			<Text
				variant="small"
				fontWeight="medium"
				color="neutral.c70"
				mb={6}
			>
				{t('sessionProposal.info')}
			</Text>

			{[0, 1].map((e) => (
				<Row mt={3} key={e}>
					<CheckAloneMedium size={16} color="success.c80" />

					<Text
						ml={4}
						variant="small"
						fontWeight="medium"
						color="neutral.c100"
					>
						{t(`sessionProposal.infoBullet.${e}`)}
					</Text>
				</Row>
			))}
		</Flex>
	)
}
