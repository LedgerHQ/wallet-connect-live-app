import { Flex } from '@ledgerhq/react-ui'
import styled from 'styled-components'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	padding-left: 160px;
	padding-right: 160px;
	justify-content: center;
	height: 100%;
	user-select: none;
	background: ${({ theme }) => theme.colors.background.main};
`

const ButtonsContainer = styled(Flex)`
	flex-direction: row;
	justify-content: space-between;
	align-items: center;
	height: 80px;
	width: 100%;
`

const Row = styled(Flex)``
const List = styled.ul``

export { ButtonsContainer, Row, List, WalletConnectContainer }
