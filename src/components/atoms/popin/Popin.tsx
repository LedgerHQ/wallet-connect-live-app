import React from 'react'
import styled from 'styled-components'

import { Flex } from '@ledgerhq/react-ui'
import TransitionInOut from './TransitionInOut'
import TransitionScale from './TransitionScale'

export interface PopinProps {
	isOpen: boolean
	children: React.ReactNode
}

const Wrapper = styled(Flex).attrs((p) => ({
	flexDirection: 'column',
	zIndex: p.theme.zIndexes[8],
	backgroundColor: 'background.main',
}))``

const Overlay = styled(Flex).attrs((p) => ({
	justifyContent: 'center',
	alignItems: 'center',
	width: '100vw',
	height: '100vh',
	zIndex: p.theme.zIndexes[8],
	position: 'fixed',
	top: 0,
	left: 0,
	backgroundColor: 'constant.overlay',
}))``

const Popin = ({ isOpen, children, ...props }: PopinProps) => (
	<TransitionInOut in={isOpen} appear mountOnEnter unmountOnExit>
		<Overlay>
			<TransitionScale in={isOpen} appear>
				<Wrapper {...props}>{children}</Wrapper>
			</TransitionScale>
		</Overlay>
	</TransitionInOut>
)

const PopinWrapper = ({
	children,
	...popinProps
}: PopinProps): React.ReactElement => {
	return <Popin {...popinProps}>{children}</Popin>
}

export default PopinWrapper
