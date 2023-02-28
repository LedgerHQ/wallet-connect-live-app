import { useCallback, useState } from 'react'

export default function useWalletConnectPopin() {
	const [isModalOpen, setOpenModal] = useState(false)

	const openModal = useCallback(() => {
		setOpenModal(true)
	}, [])

	const closeModal = useCallback(() => {
		setOpenModal(false)
	}, [])

	return {
		isModalOpen,
		setOpenModal,
		openModal,
		closeModal,
	}
}
