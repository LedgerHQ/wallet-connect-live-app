import styled from "styled-components";
import { device } from "./breakpoints";

export const Container = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
`;

export const DotContainer = styled.div`
  display: flex;
  justify-content: center;
  border: 1px solid red;
  align-items: center;
  user-select: none;
`;

export const Dot = styled.div`
  display: block;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 0 0 3px transparentize(#5b96d5, 0.8);
  background-color: #5b96d5;
  margin-right: 6px;
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
  }
  @media ${device.tablet} {
    width: 100%;
    max-width: 465px;
  }
  @media ${device.desktop} {
    width: 100%;
    max-width: 465px;
  }
`;
