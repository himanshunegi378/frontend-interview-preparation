# Testing: UI, Async Forms, & Custom Hooks Testing

## Why It Matters
Complex user interfaces often feature dynamic forms, async state transitions, and custom hooks containing critical business logic. Testing these elements improperly leads to fragile assertions, race conditions in tests, and missed accessibility (a11y) defects. Senior frontend engineers must know how to test asynchronous form validation flows, evaluate custom hook states directly using `renderHook`, and integrate automated accessibility checks to ensure compliance with standards.

---

## Core Concepts & Mental Models

### 1. Async Form Validation Testing
When a user interacts with a form, validation rules can fire at three different events:
*   **On Change**: Checking syntax (e.g. email character matching) during typing.
*   **On Blur**: Triggered when the user leaves the input field (focus out).
*   **On Submit**: Triggered when the user submits the form.
To test these behaviors, use `userEvent` to match the exact browser event sequences:

```javascript
// Test On Blur Validation
await userEvent.click(emailInput);
await userEvent.click(passwordInput); // Shifts focus, triggering blur on email
expect(screen.getByText("Invalid email format")).toBeInTheDocument();
```

### 2. Testing Async UI States
Dynamic components transition between multiple phases: `Idle` $\rightarrow$ `Loading` $\rightarrow$ `Success` or `Error`.
*   **Skeletons & Spinners**: Assert that the spinner appears during loading, and verify that it is unmounted once the content loads.
*   **Async Waiting**: Use `findByText` or `waitForElementToBeRemoved` to coordinate transitions cleanly without resorting to hardcoded timeouts (`sleep()`), which slow down test execution.

```javascript
// Good: Wait for loading spinner to disappear
await waitForElementToBeRemoved(() => screen.queryByRole("status"));
expect(screen.getByText("Product list")).toBeInTheDocument();
```

### 3. Testing Custom Hooks (`renderHook`)
React hooks cannot be executed outside of functional components. To test hooks without writing throwaway components, use the **`renderHook`** utility from `@testing-library/react`.
*   **`result.current`**: Exposes the current return values of the hook.
*   **`act()`**: Any action that mutates the hook's internal state (like calling a toggle function returned by the hook) must be wrapped inside `act()`.

```javascript
const { result } = renderHook(() => useCounter());
act(() => {
  result.current.increment();
});
expect(result.current.count).toBe(1);
```

### 4. Automated Accessibility (a11y) Testing
Incorporate **`jest-axe`** inside component tests to audit rendered HTML structures for common WCAG accessibility violations (e.g. missing `alt` attributes, low contrast, or missing form labels) automatically:
```javascript
import { axe, toHaveNoViolations } from "jest-axe";
expect.extend(toHaveNoViolations);

test("should have no accessibility violations", async () => {
  const { container } = render(<MyForm />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## Real-World Case Study / Examples

### Testing a Complex Multi-Input Async Form
A payment card checkout form validates credit card numbers, fetches bank verification, and displays success banners.

**Testing Blueprint**:
1.  Render form.
2.  Input invalid credit card numbers using `userEvent.type()`.
3.  Verify the input displays red error borders and assistive validation text.
4.  Clear input, type valid credentials, and click "Submit".
5.  Verify the button transitions to "Processing..." and is disabled.
6.  Wait for the success toast to appear (`await screen.findByText(/payment success/i)`).

---

## Common Interview Traps

### The "Stale Hook Reference" Trap
*   **The Trap**: Destructuring values from the hook result directly:
    ```javascript
    const { count, increment } = renderHook(() => useCounter()).result.current; // Wrong!
    act(() => increment());
    expect(count).toBe(1); // Fails! 'count' is a stale number primitive
    ```
*   **The Solution**: Always read values directly from the mutable `result.current` object reference inside assertions:
    ```javascript
    const { result } = renderHook(() => useCounter());
    act(() => { result.current.increment(); });
    expect(result.current.count).toBe(1); // Succeeds!
    ```

---

## Junior vs. Senior View

*   **Junior View**: "Test hooks by creating a mock component that displays values. Test forms using `fireEvent.change` and wrap assertions in long `setTimeout` calls to wait for updates."
*   **Senior View**: "Test custom hooks cleanly using `renderHook` while reading values from `result.current` references. Secure asynchronous UI states by awaiting elements with Testing Library's async queries (`findBy...`), and integrate `jest-axe` to catch accessibility regressions during integration steps."

---

## Related Interview Questions
1. "How do you test a custom hook that runs asynchronous operations (like data fetching) inside a `useEffect`?"
2. "Why are hardcoded timeouts (`setTimeout` or sleep functions) considered bad practice in UI tests, and what is the alternative?"
3. "Explain the differences between `queryByText`, `getByText`, and `findByText` queries."
4. "How do you mock browser window APIs (like `window.scrollTo`) that are not implemented in the JSDOM environment?"
