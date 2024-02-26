# Testing Tools

## Style Provider & userEvent

using the `render` function exported from `test.utils.tsx` , you'll have the application theme and userEvents already configured

### How to use it ?

```ts
import { render, screen, renderHook } from "@/tests-tools/test.utils";

describe("Your test suits", () => {
 it("What you want to test", async () => {
  renderHook(() => useYourHook()); // if you want to render a hook
  render(<Component />); // render component with custom render function
  const text = screen.getByRole("generic");
  expect(text).toBeInTheDocument();
 });
});
```

### With userEvent

```ts
import { render, screen } from "@/tests-tools/test.utils";

const onClickMock = jest.fn();

describe("Your test suits", () => {
 it("What you want to test", async () => {
  const { user } = render(<Component />); // render component with custom render function and use userEvent
  const button = screen.getByRole("button");
  expect(button).toBeInTheDocument();

  await user.click(button);
  expect(onClickMock).toHaveBeenCalled();
 });
});
```
