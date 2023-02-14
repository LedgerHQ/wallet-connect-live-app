import { web3wallet } from '@/components/WalletConnect/v2/utils/WalletConnectUtil'
import { Text } from '@ledgerhq/react-ui'
import styled from 'styled-components'
export { getServerSideProps } from '../../lib/serverProps'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	align-items: center;
	justify-content: center;
	width: 100%;
	height: 100%;
	user-select: none;
	background: ${({ theme }) => theme.colors.background.main};
`
export default function Connect() {
	return (
		<WalletConnectContainer>
			<>
				<Text variant="h1" mb={4}>
					Connected
				</Text>
				<Text>
					Active Sessions :{' '}
					{Object.keys(web3wallet.getActiveSessions()).length}
				</Text>
			</>
		</WalletConnectContainer>
	)
}
