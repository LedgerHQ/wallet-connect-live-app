import styled from "styled-components";
import { Flex, Text } from "@ledgerhq/react-ui";
import { App } from "@/types/types";
import { ImageWithPlaceholder } from "./atoms/images/ImageWithPlaceholder";
import { Link } from "@tanstack/react-router";

type Props = {
  app: App;
};

const StyledLink = styled(Link)`
  background: ${({ theme }) => theme.colors.opacityDefault.c05};
  border-radius: 5px;
  width: 100%;
  min-width: 150px;
  cursor: pointer;
`;

const AppCard = ({ app }: Props) => {
  return (
    <StyledLink to={app.url} target="_blank" rel="noreferrer">
      <div style={{ display: "flex", margin: "10px" }}>
        <div
          style={{
            aspectRatio: "1/1",
            height: "30px",
            borderRadius: "2px",
            marginRight: "10px",
          }}
        >
          <ImageWithPlaceholder icon={app.icon} />
        </div>

        <Flex
          flexDirection={"column"}
          width={"fit-content"}
          justifyContent={"space-between"}
        >
          <Text variant="paragraph" fontWeight="medium" color="neutral.c100">
            {app.name}
          </Text>
          <Text variant="paragraph" color="neutral.c50">
            {app.category}
          </Text>
        </Flex>
      </div>
    </StyledLink>
  );
};

export default AppCard;
