import React from "react";
import { GenericRow, RowType } from "@/components/atoms/GenericRow";
import { fireEvent, render, screen } from "@/tests-tools/test.utils";

describe("GenericRow", () => {
  const defaultProps = {
    title: "Title",
    subtitle: "Subtitle",
    LeftIcon: <div>Icon</div>,
    rowType: RowType.Default,
  };

  it("should render GenericRow with default type correctly", () => {
    render(<GenericRow {...defaultProps} />);

    const titleElement = screen.getByText("Title");
    const subtitleElement = screen.getByText("Subtitle");
    const iconElement = screen.getByText("Icon");

    expect(titleElement).toBeInTheDocument();
    expect(subtitleElement).toBeInTheDocument();
    expect(iconElement).toBeInTheDocument();
  });

  it("should render GenericRow with Select type correctly", () => {
    const onClick = jest.fn();
    render(
      <GenericRow {...defaultProps} rowType={RowType.Select} onClick={onClick} isSelected={true} />,
    );

    const titleElement = screen.getByText("Title");
    const subtitleElement = screen.getByText("Subtitle");
    const iconElement = screen.getByText("Icon");
    const checkboxElement = screen.getByRole("checkbox");

    expect(titleElement).toBeInTheDocument();
    expect(subtitleElement).toBeInTheDocument();
    expect(iconElement).toBeInTheDocument();
    expect(checkboxElement).toBeInTheDocument();
  });

  it("should call onClick when GenericRow with Select type is clicked", () => {
    const onClick = jest.fn();
    const { container } = render(
      <GenericRow {...defaultProps} rowType={RowType.Select} onClick={onClick} isSelected={true} />,
    );
    if (container.firstChild) fireEvent.click(container.firstChild);

    expect(onClick).toHaveBeenCalled();
  });

  it("should render GenericRow with Detail type correctly", () => {
    render(<GenericRow {...defaultProps} rowType={RowType.Detail} />);

    const titleElement = screen.getByText("Title");
    const subtitleElement = screen.getByText("Subtitle");
    const iconElement = screen.getByText("Icon");
    const chevronElement = screen.getByTestId("rightComp");

    expect(titleElement).toBeInTheDocument();
    expect(subtitleElement).toBeInTheDocument();
    expect(iconElement).toBeInTheDocument();
    expect(chevronElement.children.length).toEqual(1);
  });
});
