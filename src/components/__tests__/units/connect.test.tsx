import { Connect } from '@/components/screens/Connect'
import useAnalytics from '@/hooks/common/useAnalytics'
import { render, screen, renderHook } from '@/tests-tools/test.utils'
import userEvent from '@testing-library/user-event'
const onConnectMock = jest.fn()

describe('Connect Screen', () => {
	it('Page should appears', () => {
		renderHook(() => useAnalytics())
		render(<Connect onConnect={onConnectMock} />)
		const scan = screen.getByTestId('scan-button')
		const input = screen.getByTestId('input-uri')
		const connectButton = screen.getByTestId('connect-button')
		expect(scan).toBeInTheDocument()
		expect(input).toBeInTheDocument()
		expect(connectButton).toBeInTheDocument()
	})
	it('Page should appears with Connect button and on click triggers action', async () => {
		renderHook(() => useAnalytics())
		const url = 'https://jestjs.io/docs/jest-object'
		render(<Connect onConnect={onConnectMock} mode="text" />)
		const connect = screen.getByTestId('connect-button')
		const input = screen.getByTestId('input-uri')
		await userEvent.type(input, url)

		expect(connect).toBeInTheDocument()
		expect(input).toHaveValue(url)
		await userEvent.click(connect)
		expect(onConnectMock).toHaveBeenCalled()
	})
})
