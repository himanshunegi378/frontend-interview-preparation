# Quiz: React Code Splitting, Suspense, & Data Fetching

## Questions

### Question 1 (Easy/Medium - Data Fetching Race Conditions)
A developer implements a live search bar that queries an API on every keystroke:
```javascript
import React, { useState, useEffect } from "react";

export function LiveSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query) return;

    fetch(`/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, [query]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>{results.map((r, i) => <li key={i}>{r}</li>)}</ul>
    </div>
  );
}
```
Explain the bug that occurs when the user types quickly, and provide the standard fix using a cleanup function.

---

### Question 2 (Medium - Under the Hood of Suspense)
When a Suspense-wrapped component is awaiting asynchronous data and throws a Promise, what steps does the React Fiber reconciler execute to register the promise, display the fallback, and finally render the resolved component?

---

### Question 3 (Senior - Async Error Boundaries Limitation)
Consider the following React Error Boundary. Why will it **fail** to catch the error thrown inside the button's `onClick` click handler, and how can we programmatically force the Error Boundary to catch asynchronous errors in React?
```javascript
import React from "react";

export class ErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch(error) {
    console.error("Caught error:", error);
  }
  render() {
    if (this.state.hasError) return <h1>Something went wrong.</h1>;
    return this.props.children;
  }
}

// Fragment causing problems:
export function BuggyButton() {
  const handleClick = async () => {
    // This error will NOT be caught by the Error Boundary!
    throw new Error("Asynchronous operations failed.");
  };

  return <button onClick={handleClick}>Trigger Async Error</button>;
}
```

---

## Answer Key & Explanations

### Question 1: Async Race Condition & Cleanups
- **Difficulty:** Easy/Medium
- **Answer:** A race condition occurs when network responses return out of order, displaying stale search results.
- **Explanation:**
  - Suppose a user types `"react"`. 
  - On the first letter `"r"`, a network fetch is sent (Request A).
  - On typing the full word `"react"`, a second fetch is sent (Request B).
  - Because of network latency, Request B may complete in 100ms, while Request A takes 800ms.
  - Request B completes first, setting `results` to matching items for `"react"`.
  - Later, Request A completes, setting `results` to matching items for `"r"`. 
  - The UI now shows outdated search results for `"r"`, even though the search box contains `"react"`.
- **Common Mistakes:** Trying to solve this by adding client-side debouncing only. Debouncing reduces request volume but does not eliminate race conditions if the server response times fluctuate.
- **Fix:** Add an active flag inside `useEffect` and set it to false during cleanup:
  ```javascript
  useEffect(() => {
    let active = true;
    if (!query) return;

    fetch(`/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setResults(data);
      });

    return () => {
      active = false; // Ignore result if dependency changes before promise resolves
    };
  }, [query]);
  ```
  *(Alternative: use an `AbortController` to abort the fetch request directly)*.
- **Senior-Level Insight:** In high-speed transactional environments, raw `useEffect` is risky. Default to fetching libraries (like React Query) that manage query keys and automatically cancel or ignore stale responses.

---

### Question 2: Suspense Lifecycle and Promise Catching
- **Difficulty:** Medium
- **Answer:** React catches the promise, aborts the current rendering branch, mounts the nearest Suspense fallback, attaches a `.then()` listener to the promise, and triggers a re-render when the promise resolves.
- **Explanation:**
  - During the Render Phase, React evaluates the component tree.
  - If a child component throws a Promise, React halts traversal of that sub-branch.
  - It searches up the Fiber parent chain for the nearest `Suspense` node boundary.
  - React marks the sub-tree as "suspended" and renders the `fallback` prop JSX.
  - React attaches a `.then(retry)` callback to the caught Promise, where `retry` schedules an update task on the Fiber root.
  - Once the promise resolves, the `retry` callback triggers, telling React to re-evaluate the suspended component subtree. 
- **Common Mistakes:** Thinking that Suspense works by running a background check loop or using Web Workers. It relies entirely on JavaScript's standard try/catch mechanism.
- **Senior-Level Insight:** Because Suspense throws exceptions, code execution inside the suspended component stops immediately when a promise is thrown. Keep components clean of side-effects before the `read()` call, as they may execute multiple times when React retries rendering.

---

### Question 3: Synchronous Rendering vs. Event Callstack Error Boundaries
- **Difficulty:** Senior
- **Answer:** Error Boundaries only catch errors that occur during the **synchronous rendering phase** and lifecycle methods. They cannot catch errors thrown inside asynchronous code, event handlers (`onClick`), or set timeouts, because those run in a different browser call stack execution frame.
- **Explanation:**
  - When a user clicks a button, the click callback runs inside the browser's main thread loop, completely outside of React's synchronous fiber traversal tree.
  - Therefore, React's render loop cannot wrap event handlers in a try/catch.
  - To force the Error Boundary to handle this error, you must throw the error back into the synchronous React render cycle.
- **Common Mistakes:** Placing an Error Boundary wrapper around buttons and expecting it to catch click errors out of the box.
- **Fix:** Use a state updating hook trick to re-throw the error during the next render:
  ```javascript
  export function BuggyButton() {
    const [, setError] = useState();

    const handleClick = async () => {
      try {
        throw new Error("Asynchronous operations failed.");
      } catch (err) {
        // Passing a function to state setter triggers execution during render, 
        // throwing the error inside React's callstack
        setError(() => { throw err; });
      }
    };

    return <button onClick={handleClick}>Trigger Async Error</button>;
  }
  ```
- **Senior-Level Insight:** Understanding call stack contexts is vital for comprehensive error tracking. For production monitoring, combine React Error Boundaries with global window listeners (`window.onerror` and `unhandledrejection`) to log event-handler and promise-rejection failures to telemetry providers (like Sentry).
