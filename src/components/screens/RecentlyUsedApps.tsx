import AppCard from "../AppCard";
import { Text } from "@ledgerhq/react-ui";
import { t } from "i18next";
import styled from "styled-components";

import { useAtom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { SessionTypes, SignClientTypes } from "@walletconnect/types";

const recentConnectionApps = atomWithStorage<SignClientTypes.Metadata[]>(
  "connectionApps",
  [],
  undefined,
  { getOnInit: true },
);

const GridContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  gap: 10px;
  justify-items: center;
  overflow-y: scroll;
`;

export default function RecentlyUsedApps() {
  const [lastConnectionApps, setLastConnectionApps] =
    useAtom(recentConnectionApps);

  return (
    <>
      <Text variant="extraSmall" color="neutral.c70" marginBottom={8}>
        {t("sessions.apps.lastConnection")}
      </Text>

      <GridContainer>
        {lastConnectionApps.map((app) => (
          // eslint-disable-next-line react/jsx-key
          <AppCard
            name={app.name}
            category={app.url}
            icon={app.icons[0]}
            url={app.url}
          />
        ))}
      </GridContainer>
    </>
  );
}
