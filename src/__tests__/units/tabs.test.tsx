import React from "react";
import Tabs, { TabContent, TabsProps } from "@/components/screens/Tabs";
import { render, screen } from "@/tests-tools/test.utils";

const tabs: TabContent[] = [
  {
    index: 0,
    title: "Tab 1",
    badge: 5,
    Component: <div>Tests 1</div>,
  },
  {
    index: 1,
    title: "Tab 2",
    Component: <div>Tests 2</div>,
  },
  {
    index: 2,
    title: "Tab 3",
    disabled: true,
    Component: <div>Tests disable</div>,
  },
];

describe("Tabs", () => {
  const setActiveTabIndex = jest.fn();

  const renderTabs = (props: Partial<TabsProps> = {}) => {
    return render(
      <Tabs tabs={tabs} activeTabIndex={0} setActiveTabIndex={setActiveTabIndex} {...props}>
        {props.children}
      </Tabs>,
    );
  };

  it("renders tabs correctly", () => {
    renderTabs();

    // Check if the tabs are rendered with their titles
    tabs.forEach((tab) => {
      expect(screen.getByText(tab.title)).toBeInTheDocument();
    });

    // Check if the badges are rendered correctly
    expect(screen.getByText("5")).toBeInTheDocument();

    // Check if the disabled tab has the "disabled" class
    expect(screen.getByText("Tab 3").closest("div")).toHaveStyle("cursor: not-allowed");
  });

  it("calls setActiveTabIndex when a tab is clicked", async () => {
    const { user } = renderTabs();

    // Click on the second tab (Tab 2)
    await user.click(screen.getByText("Tab 2"));

    expect(setActiveTabIndex).toHaveBeenCalledWith(1);
  });
});
