import { Flex, Text, Checkbox, Box } from "@ledgerhq/react-ui";
import { ChevronRightMedium } from "@ledgerhq/react-ui/assets/icons";
import styled from "styled-components";
import { RowType } from "./types";

type Props = {
  title: string;
  subtitle: string;
  LeftIcon?: React.ReactNode;
  RightIcon?: React.ReactNode;
  rightElement?: React.ReactNode;
  isSelected?: boolean;
  onClick?: () => void;
  rowType: RowType;
};

const TextInfo = styled(Text)<{ isSelected: boolean }>`
  margin-right: 12px;
  color: ${(props) => props.theme.colors.success.c50};
  &:hover {
    visibility: ${(props) => (props.isSelected ? "visible" : "hidden")};
  }
`;

const Row = styled(Flex)<{ rowType: RowType; isSelected: boolean }>`
  border-radius: 12px;
  background-color: ${(props) =>
    props.rowType === RowType.Switch && props.isSelected
      ? props.theme.colors.success.c10
      : props.theme.colors.neutral.c20};
  padding: 12px;
  cursor: ${(props) =>
    props.rowType === RowType.Default ? "default" : "pointer"};
  &:hover {
    background-color: ${(props) =>
      props.rowType === RowType.Switch &&
      !props.isSelected &&
      props.theme.colors.neutral.c30};
  }
`;

export function GenericRow({
  LeftIcon,
  RightIcon,
  rightElement,
  title,
  subtitle,
  isSelected = false,
  onClick,
  rowType,
}: Readonly<Props>) {
  return (
    <Row
      justifyContent="space-between"
      onClick={rowType === RowType.Default ? undefined : onClick}
      rowType={rowType}
      alignItems="center"
      isSelected={isSelected}
    >
      <Flex flexDirection="row" columnGap={3} flex={1}>
        {LeftIcon && <Box mr={2}>{LeftIcon}</Box>}

        <Flex
          flexDirection="column"
          alignItems={"start"}
          justifyContent={"center"}
          columnGap={2}
        >
          <Text variant="body" fontWeight="semiBold" color="neutral.c100">
            {title}
          </Text>
          <Flex mt={2} flexDirection="row" alignItems={"center"} columnGap={2}>
            <Text variant="small" fontWeight="medium" color="neutral.c70">
              {subtitle}
            </Text>
            {RightIcon}
          </Flex>
        </Flex>
      </Flex>

      {rowType === RowType.Switch && isSelected && (
        <TextInfo mr={5} isSelected={isSelected}>
          Main account
        </TextInfo>
      )}

      <Flex
        alignItems="center"
        data-testid="rightComp"
        justifyContent="flex-end"
      >
        {rightElement ?? null}
        {rowType === RowType.Select && onClick && (
          <Box
            onClick={(e) => {
              e.stopPropagation();
            }}
          >
            <Checkbox
              isChecked={isSelected}
              name={""}
              onChange={onClick}
              data-testid="checkbox"
            />
          </Box>
        )}
        {rowType === RowType.Detail && (
          <ChevronRightMedium size={24} color="neutral.c70" />
        )}
      </Flex>
    </Row>
  );
}
