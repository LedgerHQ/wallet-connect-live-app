import { Flex, Text } from "@ledgerhq/react-ui";
import { createRef, forwardRef, useEffect, useState } from "react";
import styled from "styled-components";

export type TabContent = {
  index: number;
  title: string;
  disabled?: boolean;
  badge?: number;
  Component: React.ReactNode;
};

export type TabsProps = {
  tabs: TabContent[];
  activeTabIndex: number;
  setActiveTabIndex: (newActiveIndex: number) => void;
  children: React.ReactNode;
};

type HeaderBottomBarProps = {
  left: number;
  width: number;
};

type HeaderElementProps = {
  title: string;
  selected: boolean;
  disabled: boolean;
  badge?: number;
  onClick: () => void;
};

const TabHeaderBox = styled.div<{ disabled: boolean }>`
  display: flex;
  flex-grow: inherit;
  justify-content: center;
  align-items: center;
  text-align: center;
  cursor: ${(p) => (p.disabled ? "default" : "pointer")};
  padding: 8px 12px;
`;

const HeaderElement = forwardRef<HTMLDivElement, HeaderElementProps>((props, ref) => {
  const { onClick, badge, disabled, selected, title } = props;

  return (
    <TabHeaderBox ref={ref} disabled={disabled} onClick={onClick}>
      <Text variant="body" fontWeight="semiBold" color={selected ? "neutral.c100" : "neutral.c70"}>
        {title}
      </Text>
      {badge && badge > 0 ? (
        <Flex
          width={24}
          height={24}
          alignItems="center"
          justifyContent="center"
          bg="primary.c80"
          borderRadius={100}
          ml={3}
        >
          <Text variant="small" fontWeight="semiBold" color="neutral.c00">
            {badge >= 99 ? "99+" : badge}
          </Text>
        </Flex>
      ) : null}
    </TabHeaderBox>
  );
});
HeaderElement.displayName = "HeaderElement";

const HeaderBottomBar = styled.div<HeaderBottomBarProps>`
  position: relative;
  left: ${(p) => p.left}px;
  width: ${(p) => p.width}px;
  transition: all 400ms cubic-bezier(0.4, 0, 0.2, 1) 0ms;
  border-bottom: solid 4px;
  border-bottom-color: ${(p) => p.theme.colors.primary.c80};
  bottom: 3px;
`;

export default function Tabs({ tabs, activeTabIndex, setActiveTabIndex, children }: TabsProps) {
  const [bottomBar, updateBottomBar] = useState<HeaderBottomBarProps>({
    left: 0,
    width: 0,
  });
  const refs = tabs.map(() => createRef<HTMLDivElement>());

  useEffect(() => {
    if (refs[0].current) {
      const refIndex = tabs.findIndex((t) => t.index === activeTabIndex);
      const refsToHandle = refs.slice(0, refIndex);
      const width = refs[refIndex].current?.offsetWidth ?? 0;
      const left = refsToHandle.reduce((total, ref) => total + (ref.current?.offsetWidth ?? 0), 0);
      updateBottomBar({
        width,
        left,
      });
    }
  }, [activeTabIndex]);

  const onTabClick = (index: number) => {
    const tab = tabs.find((t) => t.index === index);
    if (tab && !tab.disabled) {
      setActiveTabIndex(index);
    }
  };

  return (
    <>
      <Flex flexDirection="column" justifyContent="center" width="100%" height={56}>
        <Flex flex={1} width="100%" alignItems="center">
          {tabs.map((tab, i) => (
            <HeaderElement
              key={`tab_${tab.title}`}
              ref={refs[i]}
              title={tab.title}
              selected={activeTabIndex === tab.index}
              badge={tab.badge}
              disabled={!!tab.disabled}
              onClick={() => onTabClick(tab.index)}
            />
          ))}
        </Flex>
        <Flex width="100%" height={1} bg="neutral.c30" position="relative" mt={3}>
          <HeaderBottomBar width={bottomBar.width} left={bottomBar.left} />
        </Flex>
      </Flex>
      {children}
    </>
  );
}
