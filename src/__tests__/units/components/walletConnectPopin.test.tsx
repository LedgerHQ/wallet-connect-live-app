import { WalletConnectPopin } from "@/components/atoms/popin/WalletConnectPopin";
import { render, screen } from "@/tests/test.utils";
import { vi, describe, it, expect } from "vitest";

// Mock the onClose function
const mockOnClose = vi.fn();

describe("WalletConnectPopin", () => {
  it("should render the component when isOpen is true", () => {
    const { container } = render(
      <WalletConnectPopin isOpen={true} onClose={mockOnClose}>
        <div>Content goes here</div>
      </WalletConnectPopin>,
    );

    // Assert that the component is in the document when isOpen is true
    expect(container).toBeInTheDocument();
  });

  it("should not render the component when isOpen is false", () => {
    render(
      <WalletConnectPopin isOpen={false} onClose={mockOnClose}>
        <div data-testid="content">Content goes here</div>
      </WalletConnectPopin>,
    );

    // Assert that the component is not in the document when isOpen is false
    expect(screen.queryByTestId("content")).not.toBeInTheDocument();
  });

  it("should call the onClose function when the close button is clicked", async () => {
    const { user } = render(
      <WalletConnectPopin isOpen={true} onClose={mockOnClose}>
        <div>Content goes here</div>
      </WalletConnectPopin>,
    );

    const closeButton = screen.getByTestId("close-button");
    await user.click(closeButton);

    // Assert that the onClose function is called when the close button is clicked
    expect(mockOnClose).toHaveBeenCalled();
  });
});
