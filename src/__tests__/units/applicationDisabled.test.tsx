import { describe, expect, it } from "vitest";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { render, screen } from "@/tests/test.utils";

describe("Application Disable Screen", () => {
  it("Page should appears", async () => {
    render(<ApplicationDisabled />);

    const page = await screen.findByTestId("application-disabled-container");
    expect(page).toBeInTheDocument();
    expect(page.childNodes.length).toEqual(3);
  });

  it("Page should have correct DOM", async () => {
    render(<ApplicationDisabled />);

    const logo = await screen.findByTestId("application-disabled-logo");
    const title = await screen.findByText(/applicationDisabled.title/);
    const subtitle = await screen.findByText(/applicationDisabled.desc/);
    expect(logo).toBeVisible();
    expect(title).toBeVisible();
    expect(subtitle).toBeVisible();
  });
});
