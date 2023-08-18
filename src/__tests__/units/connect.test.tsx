import { Connect } from '@/components/screens/Connect'
import useAnalytics from '@/hooks/common/useAnalytics'
import { render, renderHook, screen } from '@/tests-tools/test.utils'

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
    const { user } = render(<Connect onConnect={onConnectMock} mode="text" />)
    const connect = screen.getByTestId('connect-button')
    const input = screen.getByTestId('input-uri')
    await user.type(input, url)

    expect(connect).toBeInTheDocument()
    expect(input).toHaveValue(url)
    await user.click(connect)
    expect(onConnectMock).toHaveBeenCalled()
  })
})
