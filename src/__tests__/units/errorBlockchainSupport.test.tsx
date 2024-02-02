import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests/test.utils";
import { ErrorBlockchainSupport } from "@/components/screens/sessionProposal/ErrorBlockchainSupport";

const APP_NAME = "WALLET_CONNECT";

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
];

describe("Error BlockChian Support Screen", () => {
  it("Page should appears and on click triggers action", async () => {
    render(<ErrorBlockchainSupport appName={APP_NAME} chains={CHAINS} />);
    const text = await screen.findByTestId("error-title-blockchain-support");

    expect(text).toBeInTheDocument();
  });
});
