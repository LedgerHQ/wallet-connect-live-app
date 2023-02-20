import { Flex, Text, Checkbox } from '@ledgerhq/react-ui'
import { ChevronRightMedium } from '@ledgerhq/react-ui/assets/icons'
import styled from 'styled-components'
import { truncate } from '../utils/HelperUtil'

type Props = {
	title: string
	subtitle: string
	LeftIcon: React.ReactNode
	isSelected?: boolean
	onClick?: () => void
	rowType: RowType
}

export enum RowType {
	Select = 'select',
	Detail = 'detail',
	Default = 'default',
}

const Row = styled(Flex)`
	border-radius: 12px;
	background-color: ${(props) => props.theme.colors.neutral.c20};
	height: 60px;
	padding-left: 12px;
	padding-right: 12px;
`

export function GenericRow({
	LeftIcon,
	title,
	subtitle,
	isSelected = false,
	onClick,
	rowType,
}: Props) {
	return (
		<Row
			justifyContent="space-between"
			onClick={rowType === RowType.Default ? undefined : onClick}
			style={{
				cursor: rowType === RowType.Default ? 'default' : 'pointer',
			}}
			alignItems="center"
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
			{rowType === RowType.Select && onClick && (
				<Checkbox isChecked={isSelected} name={''} onChange={onClick} />
			)}
			{rowType === RowType.Detail && (
				<ChevronRightMedium size={24} color="neutral.c80" />
			)}
		</Row>
	)
}
