import { AddAccountPlaceholder } from '@/components/screens/sessions/sessionProposal/AddAccountPlaceholder'
import { render, screen } from '@/tests-tools/test.utils'

const onClickMock = jest.fn()

describe('Add Account Placeholder Screen', () => {
  it('Page should appears and on click triggers action', async () => {
    const { user } = render(<AddAccountPlaceholder onClick={onClickMock} />)
    const button = screen.getByRole('button')

    expect(button).toBeInTheDocument()

    await user.click(button)
    expect(onClickMock).toHaveBeenCalled()
  })
})
