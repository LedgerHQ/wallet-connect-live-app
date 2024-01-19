"use client";

import { Container } from "@/styles/styles";
import WalletConnect from "@/components/screens";
import { useSearchParams } from "next/navigation";
import { InputMode } from "@/shared/types/types";

export default function Page() {
  const searchParams = useSearchParams();

  const uri = searchParams?.get("uri") ?? undefined;

  const initialMode = (searchParams?.get("mode") as InputMode) ?? undefined;

  return (
    <Container>
      <WalletConnect initialMode={initialMode} initialURI={uri} />
    </Container>
  );
}
