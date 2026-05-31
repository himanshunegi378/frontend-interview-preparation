# Practical: Real-Time Dashboard Stream Buffer

## Problem Title: Throttled Metrics Stream Buffer Coordinator

## Difficulty: Senior

## Skills Tested
- Real-Time Data Flow Optimization
- Update Buffering & Deduplication
- Asynchronous Thread-Safe Flush Loops
- High-Performance State Batching

## Problem Statement
In a real-time metrics dashboard, a WebSocket connection streams server metrics (e.g. CPU utilization, memory usage) at a high frequency (100+ updates per second). If the frontend updates its state on every incoming message, the browser thread locks up, causing input lag and frame drops.

Implement a `StreamBufferCoordinator` class that buffers incoming metrics updates, deduplicates updates by metric key (keeping only the latest update for each metric key), and flushes the aggregated batch to a callback function at a configurable interval (e.g., 250ms) using `requestAnimationFrame` to align with the screen refresh cycle.

## Starter Code
```javascript
/**
 * Throttled stream buffer to consolidate high-frequency data updates.
 */
export class StreamBufferCoordinator {
  constructor(flushCallback, flushIntervalMs = 250) {
    this.callback = flushCallback;
    this.interval = flushIntervalMs;
    this.buffer = new Map(); // Key: metricId, Value: dataPoint
    this.timer = null;
  }

  /**
   * Add a new metric update to the buffer.
   */
  add(metricId, timestamp, value) {
    // Implement
  }

  /**
   * Start the periodic flushing process.
   */
  start() {
    // Implement
  }

  /**
   * Stop the flushing process and clean up resources.
   */
  stop() {
    // Implement
  }
}
```

## Requirements
- Maintain an internal buffer using a `Map` to deduplicate updates. If `add()` is called multiple times for the same `metricId` within a single batch, only retain the latest update (with the largest timestamp).
- Use `start()` to begin the flush loop. When the flush timer fires, execute the user's `flushCallback` on the browser's animation frame (`requestAnimationFrame`) to ensure updates are processed immediately before the next layout/paint cycle.
- The callback must receive an array of consolidated updates: `[{ metricId, timestamp, value }]`.
- Clean up all active timers and animation frame hooks inside `stop()` to prevent memory leaks.

## Edge Cases
- Calling `add()` while the coordinator is stopped (must still buffer the item, but not trigger automatic flushes).
- Out-of-order timestamps: if an incoming update has a timestamp *older* than an already buffered item for the same key, ignore the older update.

## Expected Approach
We use a Map `this.buffer` where the key is `metricId`. The value is `{ timestamp, value }`.
When `add(metricId, timestamp, value)` is called:
1. Check if the key exists.
2. If it exists and the incoming `timestamp` is older than the buffered item's `timestamp`, discard the update.
3. Otherwise, set the key to `{ timestamp, value }`.

When the interval fires:
1. Convert Map entries to an array of updates: `[{ metricId, timestamp, value }]`.
2. Clear the Map buffer.
3. Schedule execution of `this.callback(updates)` inside `requestAnimationFrame`.

## Solution
```javascript
export class StreamBufferCoordinator {
  constructor(flushCallback, flushIntervalMs = 250) {
    if (typeof flushCallback !== "function") {
      throw new Error("StreamBufferCoordinator: callback must be a function");
    }
    this.callback = flushCallback;
    this.interval = flushIntervalMs;
    this.buffer = new Map(); // Key: metricId, Value: { timestamp, value }
    
    this.intervalId = null;
    this.animationFrameId = null;
    this.isRunning = false;
  }

  /**
   * Adds an update to the buffer.
   * Discards older updates if a newer one exists in the buffer.
   */
  add(metricId, timestamp, value) {
    const existing = this.buffer.get(metricId);
    
    if (existing && timestamp <= existing.timestamp) {
      // Discard stale, out-of-order update
      return;
    }

    this.buffer.set(metricId, { timestamp, value });
  }

  /**
   * Starts the flush loop.
   */
  start() {
    if (this.isRunning) return;
    this.isRunning = true;

    this.intervalId = setInterval(() => {
      this._flush();
    }, this.interval);
  }

  /**
   * Flushes the buffer.
   */
  _flush() {
    if (this.buffer.size === 0) return;

    // Convert map to array
    const updates = [];
    for (const [metricId, data] of this.buffer.entries()) {
      updates.push({
        metricId,
        timestamp: data.timestamp,
        value: data.value
      });
    }

    // Clear buffer immediately to prevent data races
    this.buffer.clear();

    // Cancel any pending animation frame to prevent collisions
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Schedule callback execution in requestAnimationFrame
    this.animationFrameId = requestAnimationFrame(() => {
      this.animationFrameId = null;
      try {
        this.callback(updates);
      } catch (err) {
        console.error("StreamBufferCoordinator: Error in flush callback", err);
      }
    });
  }

  /**
   * Stops the loop and cleans up active timers.
   */
  stop() {
    this.isRunning = false;
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }
}
```

## Explanation
- **Deduplication Map**: Using a `Map` allows $O(1)$ key lookup. By keeping only the latest values, we avoid processing intermediate values that would otherwise trigger duplicate layout paint cycles.
- **`requestAnimationFrame` Alignment**: Passing the update array to the render callback inside `requestAnimationFrame` ensures that state changes are committed at the start of the browser's paint cycle, keeping scripting operations within the 16.7ms frame budget.
- **Race Condition Prevention**: Clearing the buffer *before* executing the callback prevents race conditions if new updates arrive while the callback is running.

## Time Complexity
- **Add Operation**: $O(1)$ constant time.
- **Flush Operation**: $O(U)$ where $U$ is the number of unique metric IDs updated during the interval.

## Space Complexity
- **Buffer Storage**: $O(U)$ space to store the latest values of active metrics in the map.

---

## Interviewer Follow-ups
1. "How would you handle priority metrics (e.g. system alarms) that must bypass the buffer and flush immediately?"
   (Expose a separate `emitImmediate(metricId, data)` method that bypasses the buffer map and runs the callback synchronously, or maintains a high-priority queue flushed using a microtask).
2. "What if the callback is slow and takes longer than the flush interval? How would you handle backpressure?"
   (Implement an execution lock: if a previous callback is still running, queue new updates and delay the next flush until the thread becomes idle).

---

## Senior-Level Discussion
Batch buffering is a critical design pattern for high-frequency client architectures.
By decoupling network packet arrivals from React rendering cycles, we reduce main thread overhead and prevent UI freezing.
This pattern shows an understanding of event loop scheduling, memory allocation, and performance tuning under heavy workloads.

---

### Extra Practice: Designing a Data Table & Real-Time Sync
**Task:** Build a data table syncing callback that matches filter, search, and page variables:
```javascript
export function filterData(data, { query, page, limit }) {
  const filtered = data.filter(item => item.name.toLowerCase().includes(query.toLowerCase()));
  const offset = (page - 1) * limit;
  return filtered.slice(offset, offset + limit);
}
```
