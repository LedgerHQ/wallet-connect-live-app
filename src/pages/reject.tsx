import useNavigation from '@/components/WalletConnect/v2/hooks/useNavigation'
import { Text } from '@ledgerhq/react-ui'
import styled from 'styled-components'

export { getServerSideProps } from '../lib/serverProps'

const WalletConnectContainer = styled.div`
	display: flex;
	flex-direction: column;
	position: relative;
	width: 100%;
	height: 100%;
	user-select: none;
	align-items: center;
	justify-content: center;
	background: ${({ theme }) => theme.colors.background.main};
`
export default function Reject() {
	const { router } = useNavigation()
	const error: string = JSON.parse(String(router.query.data))
	const hasError = error.length > 0
	console.log(router.query.data)
	return (
		<WalletConnectContainer>
			<Text variant="h1" color="error.c80">
				Rejected
			</Text>

			{hasError && (
				<Text variant="h4" color="error.c80">
					{error}
				</Text>
			)}
		</WalletConnectContainer>
	)
}
