import { render, screen } from '@testing-library/react'
import { MockTheme } from '@/tests-tools/theme.mock'
import userEvent from '@testing-library/user-event'
import { AddAccountPlaceholder } from '@/components/screens/sessions/sessionProposal/AddAccountPlaceholder'
const onClickMock = jest.fn()

describe('Add Account Placeholder Screen', () => {
	it('Page should appears and on click triggers action', async () => {
		render(
			<MockTheme>
				<AddAccountPlaceholder onClick={onClickMock} />
			</MockTheme>,
		)
		const button = screen.getByTestId('add-account-button')

		expect(button).toBeInTheDocument()

		await userEvent.click(button)
		expect(onClickMock).toHaveBeenCalled()
	})
})
