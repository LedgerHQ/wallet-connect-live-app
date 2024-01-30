import { describe, expect, it } from "vitest";
import { renderWithRouter, screen } from "@/tests-tools/test.utils";
import ProtocolNotSupported from "@/components/screens/ProtocolNotSupported";

describe("ProtocolNotSupported Screen", () => {
  it("Page should appears", async () => {
    await renderWithRouter(ProtocolNotSupported);
    const button = screen.getByRole("button", { name: /close/i });
    expect(button).toBeInTheDocument();
  });
});
