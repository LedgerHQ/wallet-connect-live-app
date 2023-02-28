import { Flex, Popin } from '@ledgerhq/react-ui'
import { CloseMedium } from '@ledgerhq/react-ui/assets/icons'
import React from 'react'
import styled from 'styled-components'

type Props = {
	isOpen: boolean
	children: React.ReactNode
	onClose: () => void
}

const CustomPopin = styled(Popin)`
	height: 300px;
	border-radius: 16px;
	padding: 32px;
	position: relative;
	background-color: ${(props) => props.theme.colors.background.drawer};
	align-items: center;
	justify-content: center;
`

const CloseButton = styled(Flex)`
	height: 32px;
	width: 32px;
	align-items: center;
	justify-content: center;
	position: absolute;
	right: 16px;
	top: 8px;
	border-radius: 50px;
	cursor: pointer;
	background-color: ${(props) => props.theme.colors.neutral.c30};
	&:hover {
		opacity: 0.7;
	}
`
export function WalletConnectPopin({ isOpen, children, onClose }: Props) {
	return (
		<CustomPopin isOpen={isOpen}>
			<CloseButton onClick={onClose}>
				<CloseMedium size={16} color="neutral.c100" />
			</CloseButton>
			{children}
		</CustomPopin>
	)
}
