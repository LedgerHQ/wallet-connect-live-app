import { beforeEach, describe, expect, it, vi } from "vitest";
import { Connect } from "@/components/screens/Connect";
import { renderWithRouter, screen } from "@/tests/test.utils";
import userEvent from "@testing-library/user-event";

const { trackMock } = vi.hoisted(() => ({ trackMock: vi.fn() }));

vi.mock("@/hooks/useAnalytics", () => ({
  default: () => ({ page: vi.fn(), track: trackMock }),
}));

describe("Connect Screen", () => {
  beforeEach(() => {
    trackMock.mockClear();
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

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("button_clicked", {
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
    expect(trackMock).not.toHaveBeenCalled();
  });

  it("tracks the WC-Back button on the Connect page when going back", async () => {
    await renderWithRouter(() => <Connect />, "/connect");
    const user = userEvent.setup();
    const title = await screen.findByText("connect.title");
    const backButton = title.previousElementSibling as HTMLElement;
    await user.click(backButton);

    expect(trackMock).toHaveBeenCalledTimes(1);
    expect(trackMock).toHaveBeenCalledWith("button_clicked", {
      button: "WC-Back",
      page: "Connect",
    });
  });
});
