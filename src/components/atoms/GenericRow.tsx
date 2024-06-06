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

const Row = styled(Flex)<{ rowType: RowType }>`
  border-radius: 12px;
  background-color: ${(props) => props.theme.colors.neutral.c20};
  padding: 12px;
  cursor: ${(props) =>
    props.rowType === RowType.Default ? "default" : "pointer"};
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
    >
      <Flex
        flexDirection="row"
        justifyContent="space-between"
        alignItems="center"
      >
        <Flex flexDirection="column" rowGap={3}>
          <Text variant="body" fontWeight="semiBold" color="neutral.c100">
            {title}
          </Text>
          <Flex flexDirection="row" alignItems={"center"} columnGap={2}>
            {LeftIcon && <Box mr={2}>{LeftIcon}</Box>}
            <Text
              variant="small"
              fontWeight="medium"
              color="neutral.c70"
              mt={2}
            >
              {subtitle}
            </Text>
            {RightIcon}
          </Flex>
        </Flex>
      </Flex>
      <Flex alignItems="center" data-testid="rightComp">
        {rightElement ?? null}
        {rowType === RowType.Select && onClick && (
          <Checkbox
            isChecked={isSelected}
            name={""}
            onChange={onClick}
            data-testid="checkbox"
          />
        )}
        {rowType === RowType.Detail && (
          <ChevronRightMedium size={24} color="neutral.c70" />
        )}
      </Flex>
    </Row>
  );
}
