# Quiz: Component Testing with RTL & MSW

## Questions

### Question 1 (Easy/Medium - fireEvent vs. userEvent)
Given a checkbox component that toggles a label and focuses an input when clicked:
```javascript
export function ToggleInput() {
  const [checked, setChecked] = useState(false);
  const inputRef = useRef(null);

  const handleToggle = () => {
    setChecked(prev => !prev);
    if (!checked) inputRef.current?.focus();
  };

  return (
    <div>
      <input type="checkbox" onChange={handleToggle} data-testid="checkbox" />
      <input type="text" ref={inputRef} data-testid="text-input" />
    </div>
  );
}
```
If we test this component using `fireEvent.click(checkbox)`, does the text-input receive focus? Compare this with the behavior of `await userEvent.click(checkbox)`.

---

### Question 2 (Medium - Overriding MSW Endpoints for Error States)
An integration test suite has a default MSW handler for `GET /api/user` returning user profile data.
Write a test block that overrides this default handler to return a `500 Internal Server Error` only for this specific test, to verify that the component displays a "Server error" warning banner correctly.

---

### Question 3 (Senior - Solving the "act(...)" Warning)
While running Vitest on a component that fetches data on mount, you see the test pass, but the console prints the following warning:
`Warning: An update to UserProfile inside a test was not wrapped in act(...).`
What is the root cause of this warning, and how do you resolve it when testing asynchronous state changes?

---

## Answer Key & Explanations

### Question 1: Synthetic Events vs. Full Browser Simulations
- **Difficulty:** Easy/Medium
- **Answer:** 
  Using `fireEvent.click` does **not** trigger focus on the text-input in JSDOM, whereas `await userEvent.click` correctly sets focus and updates the states.
- **Explanation:**
  - **`fireEvent`**: A direct wrapper around the browser's `dispatchEvent` API. It dispatches a single synthetic `click` event object directly to the element. It does **not** simulate hover states, check if the element is disabled, trigger focus changes, or fire keydown/keyup sequences.
  - **`userEvent`**: Simulates the exact sequence of events a real user triggers. For a click, it runs:
    `hover` ──> `mousedown` ──> `focus` ──> `mouseup` ──> `click` ──> `change`
  - Because `userEvent` triggers the focus changes, the component's focus ref logic is executed correctly in the test environment.
- **Senior-Level Insight:** Always default to `userEvent` for interaction testing to ensure that all side-effects (like element focus, active styles, and nested keypress bubbles) are evaluated exactly as they are in real browsers.

---

### Question 2: MSW Runtime Request Overrides
- **Difficulty:** Medium
- **Answer:** 
  Use `server.use()` inside the test block to temporarily prepend an error handler to the MSW server interceptors:
- **Explanation:**
  ```javascript
  import { http, HttpResponse } from "msw";
  import { server } from "./mocks/server";
  import { render, screen } from "@testing-library/react";
  import { UserProfile } from "./UserProfile";

  test("displays error warning on server failure", async () => {
    // 1. Temporarily override handler
    server.use(
      http.get("/api/user", () => {
        return new HttpResponse(null, { status: 500 });
      })
    );

    // 2. Render and assert error state
    render(<UserProfile />);
    
    expect(await screen.findByText(/server error/i)).toBeInTheDocument();
  });
  ```
  - `server.use()` prepends the new handler to the execution array, matching it first before default handlers.
  - In `afterEach`, calling `server.resetHandlers()` deletes this override, leaving other tests unaffected.
- **Senior-Level Insight:** Overriding endpoints at runtime is the clean way to test edge cases (timeouts, network drops, malformed JSON structures) without modifying global mock setups.

---

### Question 3: The React Testing "act(...)" Lifecycle Warning
- **Difficulty:** Senior
- **Answer:** 
  The warning occurs when a component executes an asynchronous state update (like updating state inside a `fetch.then()` callback or a setTimeout) *after* JSDOM has finished running the test's synchronous execution block.
- **Explanation:**
  - React requires all state modifications that affect the DOM to execute inside a wrapper called `act(...)` to ensure they are fully committed before assertions run.
  - **The Bug Timeline**:
    1.  Test renders `<UserProfile />`.
    2.  Renders finishes. The test code sees no further instructions and finishes execution.
    3.  A microsecond later, the fetch promise resolves. The `useEffect` callback runs and triggers `setUser(data)`.
    4.  React processes this state update, mutating JSDOM elements *outside* of the test execution context. React detects this and logs the `act(...)` warning.
- **Fix**:
  Instead of wrapping calls in `act(...)` manually (which is verbose and error-prone), use RTL's **async queries** (like `findByText` or `waitFor`) to pause the test thread and wait for the DOM to update:
  ```javascript
  test("loads user profile asynchronously", async () => {
    render(<UserProfile />);
    
    // findByText automatically wraps the await condition in act() 
    // and checks the DOM repeatedly until the element is painted
    expect(await screen.findByText("Bob")).toBeInTheDocument();
  });
  ```
- **Senior-Level Insight:** Never solve `act()` warnings by wrapping rendering or action calls in empty `await act(async () => {})` wrappers unless absolutely necessary. Using async queries (like `findBy...`) is the standard, cleaner approach that aligns test actions with real visual updates.
