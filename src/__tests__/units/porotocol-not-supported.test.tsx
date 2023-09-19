import { render, screen, renderHook } from "@/tests-tools/test.utils";
import useAnalytics from "@/hooks/common/useAnalytics";
import ProtocolNotSupported from "@/pages/protocol-not-supported";

describe("Error BlockChian Support Screen", () => {
  it("Page should appears and on click triggers action", async () => {
    renderHook(() => useAnalytics());
    render(<ProtocolNotSupported />);
    const button = screen.getByRole("button", { name: /close/i });
    expect(button).toBeInTheDocument();
  });
});
