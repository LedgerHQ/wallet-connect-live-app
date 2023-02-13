import { Flex, Text, Checkbox } from '@ledgerhq/react-ui'
import styled from 'styled-components'

type Props = {
	title: string
	subtitle: string
	LeftIcon: React.ReactNode
	isSelected: boolean
	onSelect?: () => void
}

const Row = styled(Flex)`
	border-radius: 12px;
	background-color: ${(props) => props.theme.colors.neutral.c20};
	height: 60px;
	padding-left: 12px;
	padding-right: 12px;
`

export function SelectableRow({
	LeftIcon,
	title,
	subtitle,
	isSelected,
	onSelect,
}: Props) {
	return (
		<Row
			justifyContent="space-between"
			onClick={onSelect}
			style={{
				cursor: onSelect ? 'pointer' : 'default',
			}}
		>
			<Flex
				flexDirection="row"
				justifyContent="space-between"
				alignItems="center"
			>
				{LeftIcon}
				<Flex flexDirection="column" ml={5}>
					<Text
						variant="body"
						fontWeight="semiBold"
						color="neutral.c100"
					>
						{title}
					</Text>

					<Text
						variant="small"
						fontWeight="medium"
						color="neutral.c70"
						mt={1}
					>
						{subtitle}
					</Text>
				</Flex>
			</Flex>
			{onSelect && (
				<Checkbox
					isChecked={isSelected}
					name={''}
					onChange={onSelect}
				/>
			)}
		</Row>
	)
}
