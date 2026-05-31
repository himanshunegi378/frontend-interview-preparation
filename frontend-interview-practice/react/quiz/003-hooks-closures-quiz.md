# Quiz: React Hooks & Stale Closures

## Questions

### Question 1 (Medium - Hook Order Alteration)
What happens if the following code is executed in React? Under what circumstances does it fail, and what error is thrown?
```javascript
import React, { useState } from "react";

export function ConditionalHookComponent({ isInitial }) {
  if (isInitial) {
    useState("First");
  }

  const [second, setSecond] = useState("Second");

  return <div>{second}</div>;
}
```

---

### Question 2 (Hard - Callback Stale Closure)
What is printed in the console when the user clicks the button three times?
```javascript
import React, { useState, useCallback } from "react";

export function CounterButton() {
  const [count, setCount] = useState(0);

  const logCount = useCallback(() => {
    console.log("Logged Count:", count);
  }, []);

  const handleClick = () => {
    setCount(count + 1);
    logCount();
  };

  return <button onClick={handleClick}>Increment</button>;
}
```

---

### Question 3 (Senior - LayoutEffect vs Effect Painting)
Given this side-effect setup, does the page flicker when the component mounts, and how do `useEffect` and `useLayoutEffect` differ in their relationship to browser paint loops?
```javascript
import React, { useState, useEffect } from "react";

export function BoxResizer() {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    if (width === 0) {
      setWidth(400); // Reset width dynamically after mount
    }
  }, [width]);

  return <div style={{ width: `${width}px`, background: "red" }}>Box</div>;
}
```

---

## Answer Key & Explanations

### Question 1: Conditional Hook Index Shift
- **Difficulty:** Medium
- **Answer:** React throws a runtime error: `Rendered fewer hooks than expected during the previous render` (or similar depending on version).
- **Explanation:**
  - React uses a pointer to traverse the linked list of hook objects stored on the Fiber node.
  - On the initial render (when `isInitial` is `true`), React creates two hooks:
    - Hook 1: `useState("First")`
    - Hook 2: `useState("Second")`
  - On the next render (when `isInitial` is `false`), the condition is skipped.
  - The compiler encounters `useState("Second")` first. It attempts to read Hook 1 from the linked list, assuming it matches the second hook.
  - The hook list traversal ends early because the number of hooks in this render (1) is less than the number of hooks stored in the previous render (2).
  - React detects this index mismatch and throws an error to prevent state corruption.
- **Common Mistakes:** Thinking React associates state variables with their names (e.g. `second`) dynamically.
- **Senior-Level Insight:** Always write hooks at the top level. Use ESLint rules (`rules-of-hooks`) to prevent conditional hook assignments.

---

### Question 2: Stale Closures in Memoized Callbacks
- **Difficulty:** Hard
- **Answer:** The console prints `Logged Count: 0` on every click.
- **Explanation:**
  - `logCount` is memoized using `useCallback` with an empty dependency array `[]`.
  - The closure captures the `count` variable from the initial render scope (where `count = 0`).
  - When the user clicks the button:
    1. Click 1: `handleClick` is executed. `setCount(0 + 1)` schedules an update. `logCount()` is called, printing `Logged Count: 0` (reading from the captured initial scope).
    2. React re-renders. `count` becomes `1`. However, because `logCount`'s dependencies did not change, React returns the original callback instance from the first render.
    3. Click 2: `handleClick` runs. `setCount(1 + 1)` schedules an update. `logCount()` is called, printing `Logged Count: 0`.
    4. This continues on every click.
- **Common Mistakes:** Expecting the console to log the updated count value.
- **Fix:** Add `count` to the dependency array of `useCallback` (`[count]`), or use a functional update and log inside `useEffect`.
- **Senior-Level Insight:** Understanding closure capturing is vital when passing callbacks to child components or event listeners.

---

### Question 3: Render-Blocking Layout Effects
- **Difficulty:** Senior
- **Answer:** Yes, the page may flicker when using `useEffect`. Changing to `useLayoutEffect` eliminates the flicker.
- **Explanation:**
  - **`useEffect` (Asynchronous)**: Runs *after* the browser has painted the frame.
    - Initial render: `width = 0`. The browser paints a 0px red box.
    - The effect runs, calling `setWidth(400)`. React schedules an update.
    - Second render: `width = 400`. The browser paints the 400px red box.
    - The transition from 0px to 400px is visible on screen, causing a visual flicker.
  - **`useLayoutEffect` (Synchronous)**: Runs *before* the browser paints the frame, blocking the paint loop.
    - Initial render: `width = 0`. The DOM is updated, but the browser does not paint yet.
    - The layout effect runs synchronously, calling `setWidth(400)`. React immediately runs the second render pass synchronously.
    - Second render: `width = 400`.
    - The paint loop executes, rendering the 400px box immediately. The 0px state is never painted to the screen, eliminating the flicker.
- **Common Mistakes:** Using `useLayoutEffect` for all side effects. It is synchronous and blocks rendering, so overusing it can slow down page load times.
- **Interviewer Follow-up:** "How does SSR handle `useLayoutEffect`?" (SSR does not paint, so `useLayoutEffect` cannot run on the server and outputs a warning warning. For SSR, use a client-mount check before rendering layout-sensitive elements).
- **Senior-Level Insight:** Use `useEffect` by default to keep the paint thread fast. Only switch to `useLayoutEffect` when you need to measure DOM geometries or prevent visual flickering during mutations.
