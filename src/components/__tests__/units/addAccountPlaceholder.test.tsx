import { render, screen } from '@/tests-tools/test.utils'
import userEvent from '@testing-library/user-event'
import { AddAccountPlaceholder } from '@/components/screens/sessions/sessionProposal/AddAccountPlaceholder'

const onClickMock = jest.fn()

describe('Add Account Placeholder Screen', () => {
	it('Page should appears and on click triggers action', async () => {
		render(<AddAccountPlaceholder onClick={onClickMock} />)
		const button = screen.getByRole('button')

		expect(button).toBeInTheDocument()

		await userEvent.click(button)
		expect(onClickMock).toHaveBeenCalled()
	})
})
