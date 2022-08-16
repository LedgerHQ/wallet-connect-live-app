import styled from 'styled-components'
import { device } from './breakpoints'

export const Container = styled.div`
	height: 100%;
	width: 100%;
	display: flex;
	flex-direction: column;
	justify-content: space-between;
`

export const Main = styled.main`
	flex: 1 1 auto;
	padding: 16px;
	overflow: auto;

	&::-webkit-scrollbar {
		width: ${({ theme }) => theme.overflow.trackSize}px;
		height: ${({ theme }) => theme.overflow.trackSize}px;
		background-color: rgba(0, 0, 0, 0);
	}
	&::-webkit-scrollbar-button {
		opacity: 0;
		height: 0;
		width: 0;
	}
	&::-webkit-scrollbar-track {
		background-color: rgba(0, 0, 0, 0);
	}
	&::-webkit-scrollbar-thumb {
		box-shadow: inset 0 0 0 ${({ theme }) => theme.overflow.trackSize}px
			var(--track-color);
		border: 2px solid ${({ theme }) => theme.colors.neutral.c40};
		border-radius: ${({ theme }) => theme.overflow.trackSize}px;
	}
	&::-webkit-scrollbar-corner {
		opacity: 0;
	}
`

export const MainContainer = styled.div`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	width: 100%;
	min-height: 100%;
	margin: 0 auto;

	@media ${device.tablet} {
		max-width: 380px;
	}
	@media ${device.desktop} {
		max-width: 425px;
	}
`

export const ProvidersList = styled.ul`
	display: flex;
	flex-direction: column;
	justify-content: center;
	align-items: center;
	gap: 16px;
	width: 100%;
`
