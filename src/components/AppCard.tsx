import styled from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";
import { ImageWithPlaceholder } from "./atoms/images/ImageWithPlaceholder";
import { Link } from "@tanstack/react-router";

export type App = {
  name: string;
  category: string;
  icon: string;
  url: string;
};

const StyledLink = styled(Link)`
  background: ${({ theme }) => theme.colors.opacityDefault.c05};
  border-radius: 5px;
  width: 100%;
  min-width: 150px;
  max-width: 300px;
  height: 50px;
  cursor: pointer;
`;

const AppCard = ({ name, category, icon, url }: App) => {
  return (
    <StyledLink to={url} target="_blank" rel="noreferrer">
      <Flex margin={"10px"}>
        <div
          style={{
            aspectRatio: "1/1",
            height: "30px",
            borderRadius: "2px",
            marginRight: "10px",
          }}
        >
          <ImageWithPlaceholder icon={icon} />
        </div>

        <Flex
          flexDirection={"column"}
          justifyContent={"center"}
          width={"calc(100% - 40px)"}
          rowGap={"5px"}
        >
          <Text
            variant="paragraph"
            fontWeight="medium"
            color="neutral.c100"
            whiteSpace={"nowrap"}
            textOverflow="ellipsis"
            overflow="hidden"
            width="100%"
          >
            {name}
          </Text>
          {category && (
            <Text
              variant="paragraph"
              color="neutral.c50"
              textOverflow="ellipsis"
              overflow="hidden"
              whiteSpace={"nowrap"}
            >
              {category}
            </Text>
          )}
        </Flex>
      </Flex>
    </StyledLink>
  );
};

export default AppCard;
