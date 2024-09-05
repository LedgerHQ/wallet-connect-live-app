import { describe, expect, it } from "vitest";
import { InfoSessionProposal } from "@/components/screens/sessionProposal/InfoSessionProposal";
import { render, screen } from "@/tests/test.utils";

describe("InfoSessionProposal", () => {
  it("renders in session details", async () => {
    render(<InfoSessionProposal isInSessionDetails={true} />);

    expect(
      await screen.findByText("sessionProposal.info2"),
    ).toBeInTheDocument();
  });

  it("renders in normal session", async () => {
    render(<InfoSessionProposal />);

    expect(await screen.findByText("sessionProposal.info")).toBeInTheDocument();
  });

  it("renders two bullet points", async () => {
    render(<InfoSessionProposal />);
    const bulletPoints = await screen.findAllByText(
      /sessionProposal.infoBullet./i,
    );
    expect(bulletPoints).toHaveLength(2);
  });
});
