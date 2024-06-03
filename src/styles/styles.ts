import styled from "styled-components";
import { device } from "./breakpoints";

export const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const ResponsiveContainer = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 100%;

  @media ${device.mobile} {
    width: calc(100% - 32px);
    padding-left: 16px;
    padding-right: 16px;
    background-color: red;
  }
  @media ${device.tablet} {
    width: calc(100% - 32px);
    max-width: 665px;
  }
  @media ${device.desktop} {
    width: calc(100% - 32px);
    max-width: 865px;
  }
`;
