import { WalletConnectMedium } from '@ledgerhq/react-ui/assets/icons'
import Image from 'next/image'
import { useState } from 'react'
import { useTheme } from 'styled-components'

type Props = {
  icon?: string
}
export const ImageWithPlaceholder = ({ icon }: Props) => {
  const [loadingError, setLoadingError] = useState(false)
  const { colors } = useTheme()
  return icon && !loadingError ? (
    <Image
      src={icon}
      alt="Picture of the proposer"
      width={32}
      style={{
        borderRadius: '8px',
      }}
      height={32}
      onError={() => setLoadingError(true)}
    />
  ) : (
    <WalletConnectMedium
      size={30}
      style={{
        borderRadius: '8px',
        backgroundColor: colors.background.drawer,
        color: colors.neutral.c100,
      }}
    />
  )
}
