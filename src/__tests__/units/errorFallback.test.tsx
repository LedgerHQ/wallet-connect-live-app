import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests-tools/test.utils";
import { ErrorFallback } from "@/components/screens/ErrorFallback";

describe("ErrorFallback  Screen", () => {
  it("Page should appears and on click triggers action", async () => {
    render(<ErrorFallback />);
    const title = await screen.findByText(/errorBoundary.title/i);
    const desc = await screen.findByText(/errorBoundary.desc/i);

    expect(title).toBeInTheDocument();
    expect(desc).toBeInTheDocument();
  });
});
