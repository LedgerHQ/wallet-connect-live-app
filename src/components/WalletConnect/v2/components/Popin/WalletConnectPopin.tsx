import { Popin } from '@ledgerhq/react-ui'
import React from 'react'

type Props = {
	isOpen: boolean
	children: React.ReactNode
}

export function WalletConnectPopin({ isOpen, children }: Props) {
	return (
		<Popin height="450px" isOpen={isOpen}>
			{children}
		</Popin>
	)
}
