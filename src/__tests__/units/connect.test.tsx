import { describe, expect, it } from "vitest";
import { Connect } from "@/components/screens/Connect";
import { renderWithRouter, screen } from "@/tests/test.utils";
import userEvent from "@testing-library/user-event";

describe("Connect Screen", () => {
  it("Page should appears", async () => {
    await renderWithRouter(() => <Connect />);
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
    await renderWithRouter(() => <Connect />);
    const user = userEvent.setup();
    const connect = await screen.findByTestId("connect-button");
    const input = await screen.findByTestId("input-uri");
    await user.type(input, url);

    expect(connect).toBeInTheDocument();
    expect(input).toHaveValue(url);
  });

  it("disables connect button when input is empty", async () => {
    await renderWithRouter(() => <Connect />);
    const connectButton = await screen.findByRole("button", {
      name: /connect.cta/,
    });

    expect(connectButton).toBeDisabled();
  });
});
