import { describe, expect, it } from "vitest";
import { render, screen } from "@/tests-tools/test.utils";
import ProtocolNotSupported from "@/pages/protocol-not-supported";

describe("ProtocolNotSupported Screen", () => {
  it("Page should appears", async () => {
    await render(ProtocolNotSupported);
    const button = screen.getByRole("button", { name: /close/i });
    expect(button).toBeInTheDocument();
  });
});
