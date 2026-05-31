# Quiz: UI, Async Forms, & Custom Hooks Testing

## Questions

### Question 1 (Easy/Medium - queryBy vs. getBy vs. findBy Queries)
State the differences in execution behavior between the following three React Testing Library query prefix methods:
1.  `getByText`
2.  `queryByText`
3.  `findByText`
Under what scenario should you choose each method?

---

### Question 2 (Medium/Hard - Testing Asynchronous Hooks)
A developer tests a custom hook `useFetchData` that loads data from an API inside a `useEffect` hook:
```javascript
export function useFetchData(url) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(url)
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}
```
The developer writes this test, which fails:
```javascript
test("fetches data", () => {
  const { result } = renderHook(() => useFetchData("/api/profile"));
  expect(result.current.loading).toBe(false); // Fails!
  expect(result.current.data).toEqual({ name: "Alice" }); // Fails!
});
```
Explain why this test fails, and how to fix it to support async resolution in hook tests.

---

### Question 3 (Senior - Mocking Unimplemented browser APIs in JSDOM)
When running Jest/Vitest tests for a responsive sidebar that uses `window.matchMedia` to check viewport widths, the test runner crashes with:
`TypeError: window.matchMedia is not a function`
Why does JSDOM lack this API, and how do you mock it inside your test setup to allow tests to run successfully?

---

## Answer Key & Explanations

### Question 1: Query Prefix Selection Matrix
- **Difficulty:** Easy/Medium
- **Answer:** 
  1.  `getByText`: Throws an error immediately if the element is missing. (Use when asserting that an element must exist *synchronously* on the page).
  2.  `queryByText`: Returns `null` if the element is missing (does not throw). (Use when asserting that an element **must not** be on the page, e.g. `expect(queryByText('Spinner')).toBeNull()`).
  3.  `findByText`: Returns a Promise that resolves when the element is found, retrying for up to 1000ms. (Use when asserting that an element will appear *asynchronously* after a delay).
- **Explanation:**
  - If you use `getByText` to assert that an element is *missing*: `expect(screen.getByText('Error')).not.toBeInTheDocument()`. If the element is missing, `getByText` throws an exception, and the test fails before checking the assertion.
  - To assert that an element is missing, always use `queryByText` instead: `expect(screen.queryByText('Error')).toBeNull()`.
- **Senior-Level Insight:** Choosing the correct query prefix prevents tests from crashing early and ensures async layouts are timed correctly.

---

### Question 2: Awaiting Asynchronous Hook State Updates
- **Difficulty:** Medium/Hard
- **Answer:** 
  The test fails because the promise inside `useEffect` resolves asynchronously *after* the initial render. The test checks assertions synchronously on mount when `loading` is still `true` and `data` is `null`.
  
  To fix this, use the `waitFor` utility to block execution until the assertion succeeds:
- **Explanation:**
  ```javascript
  import { renderHook, waitFor } from "@testing-library/react";
  import { useFetchData } from "./useFetchData";

  test("fetches data", async () => {
    const { result } = renderHook(() => useFetchData("/api/profile"));

    // Verify initial mount state
    expect(result.current.loading).toBe(true);

    // Wait for the async state changes to resolve
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.data).toEqual({ name: "Alice" });
  });
  ```
  - `waitFor` runs the callback repeatedly at short intervals until it passes without throwing errors, or times out. This gives the fetch promise time to resolve and update the hook state.
- **Senior-Level Insight:** When testing hooks, always verify the initial loading state *first*, then await the success state using `waitFor`. This tests both halves of the async lifecycle.

---

### Question 3: Mocking JSDOM Layout Environments
- **Difficulty:** Senior
- **Answer:** 
  JSDOM is a pure JavaScript simulation of the DOM designed to run headlessly in Node.js. It does not perform actual screen layout rendering, so CSS media queries (`window.matchMedia`) are not implemented. 
  
  To solve this, define a mock function on the `window` object using `Object.defineProperty` inside your test setup file.
- **Explanation:**
  - Mock implementation:
    ```javascript
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: jest.fn().mockImplementation((query) => ({
        matches: false, // Default fallback match state
        media: query,
        onchange: null,
        addListener: jest.fn(), // Support legacy listeners
        removeListener: jest.fn(),
        addEventListener: jest.fn(), // Support modern listeners
        removeEventListener: jest.fn(),
        dispatchEvent: jest.fn(),
      })),
    });
    ```
  - Inside individual tests, you can mock the `matches` return value to simulate resizing the screen to tablet or desktop widths:
    ```javascript
    window.matchMedia.mockImplementation((query) => ({
      matches: query.includes("max-width: 768px"), // Simulate mobile viewport
      media: query,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    }));
    ```
- **Senior-Level Insight:** Developing robust mock profiles for missing browser APIs (like `ResizeObserver`, `IntersectionObserver`, and `matchMedia`) is essential for keeping JSDOM test suites stable.
