import { WalletConnectMedium } from '@ledgerhq/react-ui/assets/icons'
import Image from 'next/image'
import { useTheme } from 'styled-components'

type Props = {
	icon?: string
}
export const ImageWithPlaceholder = ({ icon }: Props) => {
	const { colors } = useTheme()
	return icon ? (
		<Image
			src={icon}
			alt="Picture of the proposer"
			width={32}
			style={{
				borderRadius: '8px',
			}}
			height={32}
		/>
	) : (
		<WalletConnectMedium
			size={30}
			style={{
				borderRadius: '8px',
				backgroundColor: colors.background.drawer,
				color: colors.constant.white,
			}}
		/>
	)
}
