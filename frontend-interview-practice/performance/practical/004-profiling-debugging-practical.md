# Practical: Performance Profiling Utility

## Problem Title: User Timing API Profiler & Long Task Monitor

## Difficulty: Senior

## Skills Tested
- Browser User Timing API usage (`performance.mark()`, `performance.measure()`)
- Telemetry & Performance Monitoring
- Long Task Alerting (50ms Threshold checking)
- Execution context wrapper decorators

## Problem Statement
In production systems, you cannot run Chrome DevTools to profile user actions. Instead, developers must use the browser's native **User Timing API** to record metrics programmatically and log telemetry when operations exceed the 50ms Long Task limit.

Implement a utility function `profileTask(taskName, taskCallback)` that:
1.  Creates start and end performance marks.
2.  Executes the callback synchronously (or asynchronously if it returns a Promise).
3.  Measures the duration between marks.
4.  If the duration exceeds 50ms, prints a console warning highlighting a Long Task violation.
5.  Returns the task's execution results and the performance measurement entry.

## Starter Code
```javascript
/**
 * Utility to profile synchronous and asynchronous operations using the User Timing API.
 */
export async function profileTask(taskName, taskCallback) {
  // Implement
}
```

## Requirements
- The function must support both synchronous callbacks and asynchronous (Promise-returning) callbacks.
- Unique performance mark names must be generated dynamically to support concurrent or nested profiling calls.
- If the execution duration exceeds 50ms, trigger a warning log containing the task name and duration.
- Retrieve the compiled entry using `performance.getEntriesByName()` and return it alongside the callback's return value.

## Edge Cases
- The callback throwing errors (the profiler must still capture the execution duration, clean up its marks, and re-throw the error).
- Running in environments where the `performance` object is undefined (e.g. Node.js environments without standard global wrappers; provide graceful fallback).

## Expected Approach
We check if `performance` exists. If not, we run the callback, measure duration using `Date.now()`, and return a mock measurement.
If `performance` exists:
1. Generate unique identifiers:
   ```javascript
   const id = Math.random().toString(36).substring(7);
   const startMark = `${taskName}-start-${id}`;
   const endMark = `${taskName}-end-${id}`;
   const measureName = `${taskName}-measure-${id}`;
   ```
2. Call `performance.mark(startMark)`.
3. Execute `taskCallback()`.
4. To support async, check if the return value is a Promise (is a thenable). If it is, `await` it.
5. Wrap the resolution inside a `try/finally` block. In the `finally` block, call `performance.mark(endMark)` and `performance.measure(measureName, startMark, endMark)`.
6. Retrieve the entry: `const entries = performance.getEntriesByName(measureName)`.
7. Check if `entry.duration > 50`. If yes, trigger a warning log.
8. Clean up: `performance.clearMarks(startMark)`, `performance.clearMarks(endMark)`, `performance.clearMeasures(measureName)`.
9. Return `{ result, duration: entry.duration }`.

## Solution
```javascript
/**
 * Asynchronously profiles an operation, tracking execution time using the User Timing API.
 * @param {string} taskName - Label for the task
 * @param {Function} taskCallback - Task execution callback
 * @returns {Promise<{ result: any, duration: number }>} Result and duration in ms
 */
export async function profileTask(taskName, taskCallback) {
  const isPerformanceSupported = 
    typeof performance !== "undefined" && 
    typeof performance.mark === "function" && 
    typeof performance.measure === "function";

  // Fallback if User Timing API is not supported (e.g. Node.js test environment)
  if (!isPerformanceSupported) {
    const start = Date.now();
    try {
      const result = await taskCallback();
      const duration = Date.now() - start;
      if (duration > 50) {
        console.warn(`[LONG_TASK_WARN] ${taskName} took ${duration}ms (Threshold: 50ms)`);
      }
      return { result, duration };
    } catch (err) {
      throw err;
    }
  }

  // Generate unique markers to prevent collisions during concurrent runs
  const id = Math.random().toString(36).substring(2, 9);
  const startMark = `${taskName}-start-${id}`;
  const endMark = `${taskName}-end-${id}`;
  const measureName = `${taskName}-measure-${id}`;

  performance.mark(startMark);

  try {
    const result = await taskCallback();
    return { result, duration: _completeMeasurement(startMark, endMark, measureName, taskName) };
  } catch (err) {
    _completeMeasurement(startMark, endMark, measureName, taskName);
    throw err; // Re-throw original callback error
  }
}

/**
 * Marks termination and measures task duration.
 */
function _completeMeasurement(startMark, endMark, measureName, taskName) {
  performance.mark(endMark);
  performance.measure(measureName, startMark, endMark);

  const entries = performance.getEntriesByName(measureName);
  const entry = entries[entries.length - 1];
  const duration = entry ? entry.duration : 0;

  if (duration > 50) {
    console.warn(`[LONG_TASK_WARN] ${taskName} took ${duration.toFixed(2)}ms (Threshold: 50ms)`);
  }

  // Clean up markers from the browser memory buffer
  performance.clearMarks(startMark);
  performance.clearMarks(endMark);
  performance.clearMeasures(measureName);

  return duration;
}
```

## Explanation
- **User Timing Marks**: Using `performance.mark()` and `performance.measure()` stores precise timestamps in the browser's performance timeline. These entries will appear inside the Chrome DevTools **Performance panel** timeline, helping trace executions.
- **Concurrent Safety**: Appending a random string token prevents collisions if the same callback is executed concurrently (e.g. parallel clicks or fetches).
- **Graceful Cleanups**: Running marker clear commands (`clearMarks`, `clearMeasures`) prevents memory leaks by removing accumulated entry objects from the browser's internal profiling store.

## Time Complexity
- **Profiling Wrapper**: $O(1)$ constant time overhead.

## Space Complexity
- **Memory Footprint**: $O(1)$ constant space.

---

## Interviewer Follow-ups
1. "How would you automatically send these long task alerts to a remote reporting endpoint?"
   (Send a telemetry payload inside the `if (duration > 50)` check, containing the task name, duration, browser metadata, and stack trace).
2. "How does this compare to using `PerformanceObserver`?"
   (The `PerformanceObserver` API monitors browser-native events (like layout shifts, long tasks, resource loads) globally, whereas `profileTask` is designed to measure specific application code flows).

---

## Senior-Level Discussion
Developing custom timing instrumentation is standard practice when tuning large-scale frontends.
By wrapping key operations (such as sorting algorithms, API calls, or render commits) in User Timing trackers, you build a telemetry foundation that helps trace regressions in production.
This demonstrates a deep understanding of browser measurement engines, event loop profiles, and performance engineering.

---

### Extra Practice: API Caching Decorator
**Task:** Write an API fetching wrapper that caches request payloads in memory to prevent network waterfalls:
```javascript
export function createCachedFetcher(fetcherFn) {
  const cache = new Map();
  return async function(url) {
    if (cache.has(url)) return cache.get(url);
    const result = await fetcherFn(url);
    cache.set(url, result);
    return result;
  };
}
```
