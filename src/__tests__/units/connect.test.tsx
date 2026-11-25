import { beforeEach, describe, expect, it, vi } from "vitest";
import { Connect } from "@/components/screens/Connect";
import { act, renderWithRouter, screen } from "@/tests/test.utils";
import userEvent from "@testing-library/user-event";

const { mockTrack, mockOnConnect, scanner } = vi.hoisted(() => ({
  mockTrack: vi.fn(),
  mockOnConnect: vi.fn(),
  scanner: { onQRScan: undefined as ((data: string) => void) | undefined },
}));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: vi.fn(), track: mockTrack }),
}));

vi.mock("@/hooks/useConnect", () => ({
  useConnect: () => ({ onConnect: mockOnConnect }),
}));

vi.mock("@/components/QRScanner", () => ({
  QRScanner: ({ onQRScan }: { onQRScan: (data: string) => void }) => {
    scanner.onQRScan = onQRScan;
    return (
      <input
        data-testid="qr-scanner"
        onChange={(e) => onQRScan(e.target.value)}
      />
    );
  },
}));

const wcUri =
  "wc:7f6e504bfad60b485450578e05678ed3e8e8c4751d3c6160be17160d63ec90f9@2?relay-protocol=irn&symKey=587d5484ce2a2a6ee3ba1962fdd7e8588e06200c46823bd18fbd67def96ad303";

const scanSuccessEvent = {
  button: "WC-Scan QR Code Success",
  page: "Connect",
};

describe("Connect Screen", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockOnConnect.mockResolvedValue(undefined);
  });

  it("Page should appears", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const scan = await screen.findByTestId("scan-button");
    const input = await screen.findByTestId("input-uri");
    const connectButton = await screen.findByTestId("connect-button");
    expect(scan).toBeInTheDocument();
    expect(input).toBeInTheDocument();
    expect(connectButton).toBeInTheDocument();
  });

  // TODO update to use router and params to check this
  it("Page should appears with Connect button and on click triggers action", async () => {
    const url = "https://jestjs.io/docs/jest-object";
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    const connect = await screen.findByTestId("connect-button");
    const input = await screen.findByTestId("input-uri");
    await user.type(input, url);

    expect(connect).toBeInTheDocument();
    expect(input).toHaveValue(url);
    await user.click(connect);
  });

  it("disables connect button when input is empty", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const connectButton = await screen.findByRole("button", {
      name: /connect.cta/,
    });

    expect(connectButton).toBeDisabled();
  });

  it("tracks the WC-Connect URI button on the Connect page when connecting a valid URI", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    const input = await screen.findByTestId("input-uri");
    await user.type(input, "https://jestjs.io/docs/jest-object");
    await user.click(await screen.findByTestId("connect-button"));

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect URI",
      page: "Connect",
    });
  });

  it("does not track the connect button when the URI is invalid", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    const input = await screen.findByTestId("input-uri");
    await user.type(input, "not a uri");
    await user.click(await screen.findByTestId("connect-button"));

    expect(await screen.findByText("error.invalidUri")).toBeInTheDocument();
    expect(mockTrack).not.toHaveBeenCalled();
    expect(mockOnConnect).not.toHaveBeenCalled();
  });

  it("tracks the WC-Back button on the Connect page when going back", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    const title = await screen.findByText("connect.title");
    const backButton = title.previousElementSibling as HTMLElement;
    await user.click(backButton);

    expect(mockTrack).toHaveBeenCalledTimes(1);
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Back",
      page: "Connect",
    });
  });

  it("connects with the paste entry when the uri is submitted", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    await user.type(await screen.findByTestId("input-uri"), wcUri);

    await user.click(await screen.findByTestId("connect-button"));

    expect(mockOnConnect).toHaveBeenCalledWith(new URL(wcUri), "paste");
    expect(mockTrack).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Connect URI",
      page: "Connect",
    });
    expect(mockTrack).not.toHaveBeenCalledWith(
      "button_clicked",
      scanSuccessEvent,
    );
  });

  describe("QR code scan", () => {
    const scan = async (data: string) => {
      await renderWithRouter(() => <Connect mode="scan" />, "/connect");
      const user = userEvent.setup();
      const scanner = await screen.findByTestId("qr-scanner");
      await user.click(scanner);
      await user.paste(data);
    };

    it.each([
      ["a WalletConnect uri", wcUri],
      [
        "a Ledger Wallet wrapped uri",
        `ledgerlive:////wc?uri=${encodeURIComponent(wcUri)}`,
      ],
    ])(
      "tracks the scan success and connects with the scan entry for %s",
      async (_, data) => {
        await scan(data);

        expect(mockTrack).toHaveBeenCalledWith(
          "button_clicked",
          scanSuccessEvent,
        );
        expect(mockOnConnect).toHaveBeenCalledWith(new URL(wcUri), "scan");
      },
    );

    it("handles a QR code only once while it stays in front of the camera", async () => {
      await renderWithRouter(() => <Connect mode="scan" />, "/connect");
      await screen.findByTestId("qr-scanner");

      act(() => {
        scanner.onQRScan?.(wcUri);
        scanner.onQRScan?.(wcUri);
        scanner.onQRScan?.(wcUri);
      });

      expect(mockOnConnect).toHaveBeenCalledTimes(1);
      expect(
        mockTrack.mock.calls.filter(
          ([, properties]) =>
            JSON.stringify(properties) === JSON.stringify(scanSuccessEvent),
        ),
      ).toHaveLength(1);
    });

    it("handles another QR code scanned after the first one", async () => {
      const otherWcUri = wcUri.replace("7f6e504b", "0a1b2c3d");
      await renderWithRouter(() => <Connect mode="scan" />, "/connect");
      await screen.findByTestId("qr-scanner");

      act(() => {
        scanner.onQRScan?.(wcUri);
        scanner.onQRScan?.(otherWcUri);
      });

      expect(mockOnConnect).toHaveBeenNthCalledWith(1, new URL(wcUri), "scan");
      expect(mockOnConnect).toHaveBeenNthCalledWith(
        2,
        new URL(otherWcUri),
        "scan",
      );
    });

    it.each([
      ["an invalid url", "not a url"],
      ["an unsupported protocol", "https://example.com"],
      ["a Ledger Wallet uri without uri param", "ledgerlive:////wc"],
    ])("ignores %s", async (_, data) => {
      await scan(data);

      expect(mockTrack).not.toHaveBeenCalledWith(
        "button_clicked",
        scanSuccessEvent,
      );
      expect(mockOnConnect).not.toHaveBeenCalled();
    });
  });
});
