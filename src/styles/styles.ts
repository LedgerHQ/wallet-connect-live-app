import styled from 'styled-components'
import { device } from './breakpoints'

export const Container = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`

export const ResponsiveContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 100%;

	@media ${device.mobile} {
		margin-left: 16px;
		margin-right: 16px;
	}
	@media ${device.tablet} {
		max-width: 465px;
	}
	@media ${device.desktop} {
		max-width: 465px;
	}
`
