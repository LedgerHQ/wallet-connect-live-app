import { describe, expect, it } from "vitest";
import { ApplicationDisabled } from "@/components/ApplicationDisabled";
import { render, screen } from "@/tests-tools/test.utils";

jest.mock("next/router", () => ({
  useRouter() {
    return {
      route: "/",
      pathname: "",
      query: "",
      asPath: "",
      push: jest.fn(),
      events: {
        on: jest.fn(),
        off: jest.fn(),
      },
      beforePopState: jest.fn(() => null),
      prefetch: jest.fn(() => null),
    };
  },
}));

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
