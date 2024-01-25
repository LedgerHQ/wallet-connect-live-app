import { describe, expect, it } from "vitest";
import { render, screen, renderHook } from "@/tests-tools/test.utils";
import useAnalytics from "@/hooks/common/useAnalytics";
import ProtocolNotSupported from "@/pages/protocol-not-supported";

describe("ProtocolNotSupported Screen", () => {
  it("Page should appears", async () => {
    renderHook(() => useAnalytics());
    render(<ProtocolNotSupported />);
    const button = screen.getByRole("button", { name: /close/i });
    expect(button).toBeInTheDocument();
  });
});
