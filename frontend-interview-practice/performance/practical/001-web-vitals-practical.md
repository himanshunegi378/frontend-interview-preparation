# Practical: Core Web Vitals Optimization

## Problem Title: Task-Yielding Loop Scheduler for INP Optimization

## Difficulty: Senior

## Skills Tested
- Browser Event Loop & Main Thread Management
- Task Yielding Strategies (`setTimeout`, `scheduler.yield()`)
- Frame Budget Monitoring (50ms Long Task Boundary)
- Asynchronous Array Iteration

## Problem Statement
In heavy client applications, processing large datasets (such as parsing 10,000 logs or rendering bulk data points) inside a standard `for` loop blocks the main thread. If this execution exceeds 50ms, it is classified as a "Long Task." If the user attempts to type or click during this execution, the browser cannot handle the inputs, degrading the Interaction to Next Paint (INP) score.

Implement a utility function `runChunkedTask(items, processFn, options)` that processes an array of items. It must monitor execution time, and if it exceeds a specified budget (e.g. 16.7ms for a single frame, or 50ms for the Long Task limit), yield execution back to the browser's event loop to allow pending user inputs to be handled immediately, before resuming the calculation.

## Starter Code
```javascript
/**
 * Processes an array of items in batches, yielding to the browser event loop
 * to prevent blocking the main thread.
 */
export async function runChunkedTask(items, processFn, options = {}) {
  const { timeBudgetMs = 50, onProgress = null } = options;
  // Implement chunked task executor
}
```

## Requirements
- The function must be asynchronous and return a Promise resolving when all items have been processed.
- Monitor execution time dynamically using `performance.now()`.
- If the accumulated execution time of the current batch exceeds `timeBudgetMs`, halt execution and yield the thread using a macrotask (`setTimeout` with 0ms or similar).
- Execute `onProgress(processedCount, totalCount)` if provided, helping update progress indicators in the UI.

## Edge Cases
- Empty `items` array.
- Processing a single item takes longer than `timeBudgetMs` (the scheduler must process at least one item per batch to prevent deadlocks, but yield immediately after).
- Callback errors (errors thrown inside `processFn` must reject the parent promise and stop processing).

## Expected Approach
We use an asynchronous processing loop.
We track the index `i` of the current item.
We record the start time of the batch: `let batchStart = performance.now()`.
We loop through the items:
1. Call `processFn(items[i])`.
2. Check if the current time minus `batchStart` exceeds `timeBudgetMs`.
3. If yes, yield the thread:
   - Call `await yieldToMainThread()`.
   - Reset the batch start time: `batchStart = performance.now()`.
4. Once the loop finishes, resolve the promise.

To yield to the main thread, we use:
```javascript
const yieldToMainThread = () => new Promise(resolve => setTimeout(resolve, 0));
```
*(Optionally, if `scheduler.yield` is supported by the browser, use it as a high-performance alternative).*

## Solution
```javascript
/**
 * Yields execution back to the browser's event loop.
 */
function yieldToMainThread() {
  // Use modern scheduler.yield() if available, otherwise fall back to setTimeout
  if (typeof scheduler !== "undefined" && typeof scheduler.yield === "function") {
    return scheduler.yield();
  }
  return new Promise((resolve) => setTimeout(resolve, 0));
}

/**
 * Processes items in chunks, yielding when the execution budget is exceeded.
 * @param {Array} items - Elements to process
 * @param {Function} processFn - Processor callback
 * @param {Object} options
 * @param {number} [options.timeBudgetMs] - Millisecond budget before yielding (default 50ms)
 * @param {Function} [options.onProgress] - Progress updater callback
 * @returns {Promise<void>} Resolves when completed
 */
export async function runChunkedTask(items, processFn, options = {}) {
  if (!Array.isArray(items)) {
    throw new Error("runChunkedTask: items must be an array");
  }

  const { timeBudgetMs = 50, onProgress = null } = options;
  const total = items.length;
  if (total === 0) return;

  let batchStart = performance.now();

  for (let i = 0; i < total; i++) {
    // Process current item
    try {
      processFn(items[i], i);
    } catch (error) {
      // Re-throw and abort process
      throw error;
    }

    // Trigger progress updates
    if (onProgress) {
      onProgress(i + 1, total);
    }

    // Check if we exceeded our time budget
    const elapsed = performance.now() - batchStart;
    if (elapsed >= timeBudgetMs) {
      // Yield control back to the browser to handle inputs and paints
      await yieldToMainThread();
      // Reset batch start time for the next slice
      batchStart = performance.now();
    }
  }
}
```

## Explanation
- **Execution Thread Yielding**: By wrapping `setTimeout(resolve, 0)` in a Promise, we place a new task in the browser's macrotask queue. The browser uses the gap to process pending user input tasks (clicks, keystrokes) and paint layout updates, keeping INP values low.
- **`scheduler.yield()` Support**: The modern Chrome `scheduler.yield()` API is preferred. Unlike `setTimeout` which has a minimum delay overhead (often 4ms), `scheduler.yield()` yields control but resumes execution immediately after high-priority tasks are processed, improving speed.
- **Dynamic Measurement**: Rather than processing a hardcoded number of items (e.g. 50 at a time), measuring time with `performance.now()` ensures performance adapts dynamically depending on CPU speed and device capacity.

## Time Complexity
- **Iterative Processing**: $O(N)$ where $N$ is the number of items. The yielding check adds negligible constant overhead.

## Space Complexity
- **Recursive Stack**: $O(1)$ constant space, as the iterative loop runs sequentially.

---

## Interviewer Follow-ups
1. "Why not use Web Workers instead of yielding in the main thread?"
   (Web Workers are best for heavy computations. However, if the task requires modifying DOM elements or executing UI renders, Web Workers cannot access them. Yielding is the primary way to optimize DOM-bound long tasks).
2. "How would you handle user cancel actions while a chunked task is still running?"
   (Pass an `AbortSignal` inside the options: `options.signal`. Inside the loop, check if `signal.aborted === true`; if so, break the loop and reject/abort immediately).

---

## Senior-Level Discussion
Developing task-yielding utility runners is a core practice when designing high-performance enterprise frontends.
By breaking heavy operations into smaller, yield-friendly chunks, you maintain user input responsiveness on low-end devices and prevent browser freezes.
This pattern shows a solid understanding of browser event loops, rendering queues, and CPU budget management.

---

### Extra Practice: Web Vitals metrics logging
**Task:** Implement a layout-shift tracker using browser-native `PerformanceObserver` APIs:
```javascript
export function observeCLS(callback) {
  let clsValue = 0;
  const observer = new PerformanceObserver((entryList) => {
    for (const entry of entryList.getEntries()) {
      if (!entry.hadRecentInput) {
        clsValue += entry.value;
        callback(clsValue);
      }
    }
  });
  observer.observe({ type: "layout-shift", buffered: true });
  return () => observer.disconnect();
}
```
