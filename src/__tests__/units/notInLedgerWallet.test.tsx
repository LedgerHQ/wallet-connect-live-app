import { afterEach, describe, expect, it, vi } from "vitest";
import { NotInLedgerWallet } from "@/components/NotInLedgerWallet";
import { DOWNLOAD_URL, getOpenInLedgerWalletUrl } from "@/utils/ledgerWallet";
import { render, screen } from "@/tests/test.utils";
import { fireEvent } from "@testing-library/react";

describe("Not In Ledger Wallet Screen", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("Page should have correct DOM", async () => {
    render(<NotInLedgerWallet />);

    expect(
      await screen.findByTestId("not-in-ledger-wallet-logo"),
    ).toBeVisible();
    expect(await screen.findByText(/notInLedgerWallet.title/)).toBeVisible();
    expect(await screen.findByText(/notInLedgerWallet.desc/)).toBeVisible();
    expect(await screen.findByText(/notInLedgerWallet.open/)).toBeVisible();
    expect(await screen.findByText(/notInLedgerWallet.download/)).toBeVisible();
  });

  it("Download button should open the download page", async () => {
    const open = vi.spyOn(window, "open").mockImplementation(() => null);
    render(<NotInLedgerWallet />);

    fireEvent.click(await screen.findByTestId("not-in-ledger-wallet-download"));

    expect(open).toHaveBeenCalledWith(
      DOWNLOAD_URL,
      "_blank",
      "noopener,noreferrer",
    );
  });
});

describe("getOpenInLedgerWalletUrl", () => {
  it("should deeplink to the live app in discover", () => {
    expect(getOpenInLedgerWalletUrl("")).toEqual(
      "ledgerwallet://discover/ledger-wallet-connect",
    );
    expect(getOpenInLedgerWalletUrl("?theme=light&lang=fr")).toEqual(
      "ledgerwallet://discover/ledger-wallet-connect",
    );
  });

  it("should forward the WalletConnect uri", () => {
    const uri = "wc:abc@2?relay-protocol=irn&symKey=123";
    const url = new URL(
      getOpenInLedgerWalletUrl(`?uri=${encodeURIComponent(uri)}`),
    );

    expect(url.searchParams.get("uri")).toEqual(uri);
  });

  it("should forward the existing session request params", () => {
    const url = new URL(
      getOpenInLedgerWalletUrl(
        "?theme=dark&requestId=42&sessionTopic=topic123",
      ),
    );

    expect(url.searchParams.get("requestId")).toEqual("42");
    expect(url.searchParams.get("sessionTopic")).toEqual("topic123");
    expect(url.searchParams.has("theme")).toBe(false);
  });
});
