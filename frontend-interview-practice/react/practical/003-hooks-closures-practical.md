# Practical: Custom React useFetch Hook with Caching & Cancellation

## Problem Title: High-Performance useFetch Hook

## Difficulty: Senior

## Skills Tested
- React Hook lifecycle management
- Asynchronous task cancellation (AbortController)
- Preventing race conditions and memory leaks
- Cache storage inside closure states
- Exponential backoff retry algorithms

## Problem Statement
Implement a custom React hook `useFetch(url, options)` that fetches data from an API. The hook must meet these production requirements:
1. **State Management**: Return `{ data, loading, error, refetch }` states.
2. **Race Condition Prevention**: Cancel pending requests if the `url` changes.
3. **Memory Safety**: Prevent state updates if the component unmounts while a request is pending.
4. **Data Caching**: Cache fetched payloads in a global memory store. If the same `url` is requested again, return the cached data immediately.
5. **Auto-Retry**: If a request fails, automatically retry up to a specified number of times (`options.retries`) using an **exponential backoff** delay.

## Starter Code
```javascript
import { useState, useEffect, useRef } from "react";

// Global cache store encapsulated by closure
const cache = new Map();

/**
 * Custom hook for data fetching.
 * @param {string} url - The target API endpoint
 * @param {Object} [options]
 * @param {number} [options.retries] - Number of retry attempts on failure
 * @param {number} [options.delay] - Initial retry delay in milliseconds
 */
export function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Implement Hook logic here

  return { data, loading, error, refetch: () => {} };
}
```

## Requirements
- Use `AbortController` to cancel active fetch requests on URL change or unmount.
- The global cache must resolve cache hits in $O(1)$ lookup time.
- The retry delay must scale exponentially: $\text{delay} = \text{initialDelay} \times 2^{\text{retryCount}}$.
- Do not trigger state updates on unmounted components.

## Edge Cases
- **Overriding Cache**: The `refetch()` trigger must bypass the cache and force a new network request, updating the cache with the new result on success.
- **Unstable Options Reference**: Ensure that passing inline options objects (like `useFetch(url, { retries: 3 })`) does not cause infinite rendering loops.

## Expected Approach
Maintain a `isMounted` ref to track component mount status.
Inside the fetch execution function, check the global cache. If present and not a manual refetch, load it immediately. Otherwise, create an `AbortController`.
Implement a recursive `fetchWithRetry(attempt)` function. If a fetch fails, check if `attempt < retries`. If yes, schedule a `setTimeout` for the backoff duration and call `fetchWithRetry(attempt + 1)`. If the request is aborted or the component is unmounted, cancel timers and reject.
Return a cleanup function that aborts the controller and clears any active retry timers.

## Solution
```javascript
import { useState, useEffect, useRef, useCallback } from "react";

const cache = new Map();

export function useFetch(url, options = {}) {
  // Extract and memoize configuration options to prevent loop dependency shifts
  const retries = options.retries ?? 0;
  const initialDelay = options.delay ?? 1000;

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const activeControllerRef = useRef(null);
  const retryTimerRef = useRef(null);

  // Execute request
  const executeFetch = useCallback((forceBypassCache = false) => {
    // 1. Check cache hits
    if (!forceBypassCache && cache.has(url)) {
      setData(cache.get(url));
      setLoading(false);
      setError(null);
      return;
    }

    // 2. Clear any active timers and controllers
    if (activeControllerRef.current) {
      activeControllerRef.current.abort();
    }
    if (retryTimerRef.current) {
      clearTimeout(retryTimerRef.current);
    }

    const controller = new AbortController();
    activeControllerRef.current = controller;

    setLoading(true);
    setError(null);

    const makeRequest = (attempt) => {
      fetch(url, { signal: controller.signal })
        .then((res) => {
          if (!res.ok) {
            throw new Error(`HTTP error! status: ${res.status}`);
          }
          return res.json();
        })
        .then((resData) => {
          // Cache results
          cache.set(url, resData);
          setData(resData);
          setLoading(false);
        })
        .catch((err) => {
          if (err.name === "AbortError") {
            // Safe abort, do not log or set error state
            return;
          }

          if (attempt < retries) {
            // Exponential backoff calculation: initialDelay * 2^attempt
            const backoffDelay = initialDelay * Math.pow(2, attempt);
            
            retryTimerRef.current = setTimeout(() => {
              makeRequest(attempt + 1);
            }, backoffDelay);
          } else {
            setError(err);
            setLoading(false);
          }
        });
    };

    makeRequest(0);
  }, [url, retries, initialDelay]);

  // Handle Mount/Unmount hooks
  useEffect(() => {
    executeFetch(false);

    return () => {
      if (activeControllerRef.current) {
        activeControllerRef.current.abort();
      }
      if (retryTimerRef.current) {
        clearTimeout(retryTimerRef.current);
      }
    };
  }, [url, executeFetch]);

  // Exposed refetch trigger
  const refetch = useCallback(() => {
    executeFetch(true);
  }, [executeFetch]);

  return { data, loading, error, refetch };
}
```

## Explanation
- **Race Condition Prevention**: When the `url` changes, the `useEffect` cleanup function runs first, aborting the active fetch. The new request is then executed with a fresh `AbortController`.
- **Immutability and Cache**: The cache store exists inside the outer module scope. This allows different components requesting the same URL to reuse the cached data immediately.
- **Backoff Scheduler**: If a request fails, `makeRequest` schedules a retry. The delay doubles on each attempt: `initialDelay * Math.pow(2, attempt)`. If the component unmounts, `retryTimerRef` clears the pending timeout immediately.

## Time Complexity
- Cache lookup: $O(1)$ operations.
- State updates: $O(1)$.

## Space Complexity
- $O(U)$ where $U$ is the number of cached unique URL responses.

## Interviewer Follow-ups
1. "What if the cached data should expire after a specific time (cache invalidation)?" (Change the cache map to hold object entries containing timestamps: `{ data, timestamp }`. Before resolving a cache hit, check if the current time exceeds the record timestamp plus the TTL limit).
2. "Why are ref values used to store the `AbortController` and `setTimeout` ID?" (Unlike state variables, updating ref values does not trigger re-renders. This allows the hook to store and clean up active handlers across renders without causing infinite loops).

## Senior-Level Discussion
Custom data-fetching hooks are useful for understanding React lifecycle integration, but production applications typically require more robust solutions.
Using libraries like TanStack Query or SWR provides advanced features like cache garbage collection, stale-while-revalidate states, request deduplication, and window focus refetching out of the box.

---

### Extra Practice: Reusable Hooks & useReducer
**Task:** Implement a custom reusable hook `useHistoryState` that mimics undo/redo capability using `useReducer`:
```javascript
import { useReducer } from "react";
const reducer = (state, action) => {
  switch (action.type) {
    case "SET":
      return { past: [...state.past, state.present], present: action.value, future: [] };
    case "UNDO":
      if (state.past.length === 0) return state;
      return { past: state.past.slice(0, -1), present: state.past[state.past.length - 1], future: [state.present, ...state.future] };
    default:
      return state;
  }
};
export function useHistoryState(initialVal) {
  const [state, dispatch] = useReducer(reducer, { past: [], present: initialVal, future: [] });
  return [state.present, (val) => dispatch({ type: "SET", value: val }), () => dispatch({ type: "UNDO" })];
}
```
