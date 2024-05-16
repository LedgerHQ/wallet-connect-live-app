import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@/tests/test.utils";
import { AddAccountPlaceholder } from "@/components/screens/sessionProposal/AddAccountPlaceholder";

const onClickMock = vi.fn();

describe("Add Account Placeholder Screen", () => {
  it("Page should appears and on click triggers action", async () => {
    const { user } = render(<AddAccountPlaceholder chains={[]} addNewAccounts={onClickMock} />);
    const button = await screen.findByRole("button");

    expect(button).toBeInTheDocument();

    await user.click(button);
    expect(onClickMock).toHaveBeenCalled();
  });
});
