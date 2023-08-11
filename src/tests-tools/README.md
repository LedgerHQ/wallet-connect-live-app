# Testing Tools

## Style Provider & userEvent

using the `render` function exported from `test.utils.tsx` , you'll have the application theme and userEvents already configured

### How to use it ?

```ts
import { render, screen, renderHook } from '@/tests-tools/test.utils'

describe('Your test suits', () => {
	it('What you want to test', async () => {
		renderHook(() => useYourHook()) // if you want to render a hook
		render(<Component />) // render comonent with custom render function
		const text = screen.getByRole('generic')
		expect(text).toBeInTheDocument()
	})
})
```
