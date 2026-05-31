# Practical: Request Cancellation & Race Condition Prevention

## Problem Title: Race Condition Prevention with AbortController in React Hooks

## Difficulty: Senior

## Skills Tested
- React Hook lifecycle management
- Async task coordination and race-condition prevention
- AbortController cleanup mechanics
- Error boundary mapping (AbortError)

## Problem Statement
Implement a custom React hook `useSearchQuery(query, options)` that fetches search results from an API (`/api/search?q=QUERY`). The hook must resolve two key production issues:
1. **Race Conditions**: If a user types quickly, multiple network requests are made. The requests may resolve out of order, displaying stale data. The hook must cancel pending requests when the query input changes, ensuring only the result of the latest request is rendered.
2. **Memory Leaks**: If the component using the hook unmounts while a request is pending, the hook must cancel the request and avoid performing state updates on the unmounted component.

## Starter Code
```javascript
import { useState, useEffect } from "react";

/**
 * @param {string} query - The search query input
 * @param {Object} [options]
 * @param {number} [options.timeout] - Request timeout in milliseconds
 */
export function useSearchQuery(query, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Implement Hook logic here

  return { data, loading, error };
}
```

## Requirements
- Cancel any active network request immediately when the `query` parameter changes.
- Cancel the request if the component unmounts.
- Gracefully handle abort errors, ensuring that an `AbortError` does not set the `error` state (since aborting a request is expected behavior).
- If the `options.timeout` is provided, automatically abort the request if it takes longer than the specified limit, setting the `error` state to a timeout error.

## Edge Cases
- **Empty Query**: If the query is empty or contains only whitespace, do not make a network request, clear the data state, and set loading to false.
- **Immediate Unmount**: If the component mounts and unmounts immediately (common in React 18 strict mode double-effect mounts), ensure the request is canceled cleanly.

## Expected Approach
In `useEffect`, verify the query parameter. If it's valid, create an `AbortController`. Pass `controller.signal` to the `fetch` call. To handle timeouts, set a `setTimeout` timer that invokes `controller.abort()` when the limit is reached. In the fetch promise chain, catch errors and filter out `AbortError`. Return a cleanup function from the hook that calls `controller.abort()` and clears the timeout timer.

## Solution
```javascript
import { useState, useEffect } from "react";

export function useSearchQuery(query, { timeout } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Handle empty query inputs
    const trimmedQuery = query ? query.trim() : "";
    if (!trimmedQuery) {
      setData(null);
      setLoading(false);
      setError(null);
      return;
    }

    // 2. Initialize AbortController
    const controller = new AbortController();
    const { signal } = controller;

    setLoading(true);
    setError(null);

    // 3. Setup optional timeout timer
    let timeoutId = null;
    if (timeout && timeout > 0) {
      timeoutId = setTimeout(() => {
        controller.abort("timeout");
      }, timeout);
    }

    // 4. Execute fetch
    fetch(`/api/search?q=${encodeURIComponent(trimmedQuery)}`, { signal })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((resData) => {
        setData(resData);
        setLoading(false);
      })
      .catch((err) => {
        // Only update error state if it was not aborted
        if (err.name === "AbortError" || signal.aborted) {
          // If aborted due to timeout, set timeout error
          if (controller.signal.reason === "timeout" || err.message === "timeout") {
            setError(new Error("Request timed out"));
          } else {
            console.log("Fetch aborted successfully to prevent race condition.");
          }
        } else {
          setError(err);
        }
        setLoading(false);
      })
      .finally(() => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });

    // 5. Cleanup function
    return () => {
      controller.abort();
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [query, timeout]);

  return { data, loading, error };
}
```

## Explanation
- **Race Condition Prevention**: When the user types and updates the `query` input, React triggers a re-render and re-runs the `useEffect`. The cleanup function of the previous hook execution runs first, invoking `controller.abort()`. This cancels the previous fetch request immediately, preventing it from updating the state when it eventually resolves.
- **Memory Leak Protection**: If the component unmounts, the cleanup function runs and aborts the request. Since the fetch is canceled and the promise rejects, the state setters are not called on the unmounted component, preventing memory leaks and console warnings.
- **Abort Reason**: We utilize `controller.abort("timeout")` to pass the reason for aborting, allowing the catch block to distinguish between a user typing query shift vs. a network timeout.

## Time Complexity
- State updates and cleanup: $O(1)$ operations.
- API fetch time: depends on network roundtrip.

## Space Complexity
- $O(1)$ auxiliary space, managing a single active controller and timeout timer in memory.

## Interviewer Follow-ups
1. "What happens if we pass the options object `{ timeout: 5000 }` directly in the component body without memoization?" (The options object is created with a new reference on every render, triggering the `useEffect` to re-run and re-fetch on every single render. To fix this, options should be memoized using `useMemo` or destructured in the dependency array).
2. "How does using `AbortController` compare to using a local `let active = true` flag inside `useEffect`?" (A local boolean flag prevents rendering stale data by ignoring the result, but it does *not* cancel the HTTP request, which continues to consume network bandwidth and server resources. `AbortController` cancels the request at the browser network layer, saving bandwidth).

## Senior-Level Discussion
In large enterprise frontends, managing concurrent network requests is critical. While writing custom fetch hooks is useful for understanding under-the-hood behaviors, production applications typically use data-fetching libraries like TanStack Query (React Query) or SWR. These libraries handle request cancellation, caching, and automatic retries out of the box using similar `AbortController` integrations.

---

### Extra Practice: Event Delegation & AbortController
**Task:** Create a dynamic event delegation listener that supports cleanup via an `AbortController` signal:
```javascript
export function delegateEvent(parent, selector, eventType, handler, signal) {
  const listener = (e) => {
    const target = e.target.closest(selector);
    if (target && parent.contains(target)) {
      handler.call(target, e);
    }
  };
  parent.addEventListener(eventType, listener);
  signal?.addEventListener("abort", () => {
    parent.removeEventListener(eventType, listener);
  });
}
```
