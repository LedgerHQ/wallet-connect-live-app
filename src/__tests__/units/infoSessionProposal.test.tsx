import { InfoSessionProposal } from "@/components/screens/sessions/sessionProposal/InfoSessionProposal";
import { render, screen } from "@/tests-tools/test.utils";

describe("InfoSessionProposal", () => {
  it("renders in session details", () => {
    render(<InfoSessionProposal isInSessionDetails={true} />);

    expect(screen.getByText("sessionProposal.info2")).toBeInTheDocument();
  });

  it("renders in normal session", () => {
    render(<InfoSessionProposal />);

    expect(screen.getByText("sessionProposal.info")).toBeInTheDocument();
  });

  it("renders two bullet points", () => {
    render(<InfoSessionProposal />);
    const bulletPoints = screen.getAllByText(/sessionProposal.infoBullet./i);
    expect(bulletPoints).toHaveLength(2);
  });
});
