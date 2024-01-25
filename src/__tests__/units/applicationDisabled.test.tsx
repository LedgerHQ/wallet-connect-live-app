import { describe, expect, it, vi } from "vitest";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { render, screen } from "@/tests-tools/test.utils";

describe("Application Disable Screen", () => {
  it("Page should appears", () => {
    render(<ApplicationDisabled />);

    const page = screen.getByTestId("application-disabled-container");
    expect(page).toBeInTheDocument();
    expect(page.childNodes.length).toEqual(3);
  });

  it("Page should have correct DOM", () => {
    render(<ApplicationDisabled />);

    const logo = screen.getByTestId("application-disabled-logo");
    const title = screen.getByText(/applicationDisabled.title/);
    const subtitle = screen.getByText(/applicationDisabled.desc/);
    expect(logo).toBeVisible();
    expect(title).toBeVisible();
    expect(subtitle).toBeVisible();
  });
});
