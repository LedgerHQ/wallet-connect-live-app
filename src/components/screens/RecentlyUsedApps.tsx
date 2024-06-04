import sortedRecentConnectionAppsAtom, {recentConnectionAppsAtom, initialValue as recentConnectionAppsInitialValue} from "@/store/recentConnectionAppsAtom";
import AppCard from "../AppCard";
import { Flex, Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import styled from "styled-components";
import { useAtomValue,useSetAtom } from "jotai";

const GridContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  justify-items: center;
  overflow-y: scroll;
`;

const StyledDiv = styled.div`
  background: ${({ theme }) => theme.colors.opacityDefault.c05};
  min-width: 250px;
  width: 250px;
  border-radius: 5px;
  cursor: pointer;
`;

export default function RecentlyUsedApps() {
  const lastConnectionApps = useAtomValue(sortedRecentConnectionAppsAtom);
  const setLastConnectionApps = useSetAtom(recentConnectionAppsAtom)
  
  return (
    <>

    <Flex justifyContent={"space-between"}>
      <Text variant="extraSmall" color="neutral.c70" marginBottom={6}>
        {t("sessions.apps.lastConnection")}
      </Text>

      <Text style={{cursor: "pointer"}} variant="extraSmall" color="neutral.c70" marginBottom={6} onClick={() => { setLastConnectionApps(recentConnectionAppsInitialValue)}}>
        {t("sessions.apps.clearHistory")}
      </Text>
    </Flex>

      <GridContainer>
        {lastConnectionApps.map((app) => (
          <StyledDiv key={app.name}>
            <AppCard
              name={app.name}
              category={app.url}
              icon={app.icons[0] || ""}
              url={app.url}
            />
          </StyledDiv>
        ))}
      </GridContainer>
    </>
  );
}
