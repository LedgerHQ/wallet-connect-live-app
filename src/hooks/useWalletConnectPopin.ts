import { useState } from "react";

export default function useWalletConnectPopin() {
  const [isModalOpen, setOpenModal] = useState(false);

  const openModal = () => setOpenModal(true);

  const closeModal = () => setOpenModal(false);

  return {
    isModalOpen,
    setOpenModal,
    openModal,
    closeModal,
  };
}
