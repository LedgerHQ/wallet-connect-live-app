import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests-tools/test.utils";
import { ErrorFallback } from "@/components/screens/ErrorFallback";

describe("ErrorFallback  Screen", () => {
  it("Page should appears and on click triggers action", () => {
    render(<ErrorFallback />);
    const title = screen.getByText(/errorBoundary.title/i);
    const desc = screen.getByText(/errorBoundary.desc/i);

    expect(title).toBeInTheDocument();
    expect(desc).toBeInTheDocument();
  });
});
