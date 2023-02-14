import { Text } from '@ledgerhq/react-ui'
import { PlusMedium } from '@ledgerhq/react-ui/assets/icons'
import { useTranslation } from 'next-i18next'
import React from 'react'
import styled from 'styled-components'

const AddAccountButton = styled.div`
	border: 1px dashed rgba(153, 153, 153, 0.3);
	cursor: pointer;
	border-radius: 4px;
	padding: 20px;
	color: #abadb6;
	font-weight: 600;
	align-items: center;
	justify-content: center;
	display: flex;
	flex-direction: row;
	height: auto;

	&:hover {
		cursor: pointer;
		border-color: ${(p) => p.theme.colors.constant.white};
		color: ${(p) => p.theme.colors.constant.white};
	}
`
type Props = {
	onClick: () => void
}
export const AddAccountPlaceholder = ({ onClick }: Props) => {
	const { t } = useTranslation()

	return (
		<AddAccountButton onClick={onClick}>
			<PlusMedium />
			<Text ml={2} variant="bodyLineHeight" color="neutral.c100">
				{t('sessionProposal.addAccount')}
			</Text>
		</AddAccountButton>
	)
}