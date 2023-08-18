import { render, screen, renderHook } from "@/tests-tools/test.utils"
import { ErrorBlockchainSupport } from "@/components/screens/sessions/sessionProposal/ErrorBlockchainSupport"
import useAnalytics from "@/hooks/common/useAnalytics"

const APP_NAME = "WALLET_CONNECT"

const CHAINS = [
  {
    chain: "ethereum",
    isSupported: true,
    isRequired: true,
    accounts: [],
  },
  {
    chain: "polygon",
    isSupported: true,
    isRequired: true,
    accounts: [],
  },
]

describe("Error BlockChian Support Screen", () => {
  it("Page should appears and on click triggers action", async () => {
    renderHook(() => useAnalytics())
    render(<ErrorBlockchainSupport appName={APP_NAME} chains={CHAINS} />)
    const text = screen.getByTestId("error-title-blockchain-support")

    expect(text).toBeInTheDocument()
  })
})
