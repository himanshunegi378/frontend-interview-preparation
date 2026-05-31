# Practical: Performance Batching DOM Scheduler

## Problem Title: FastDOM-Style Read/Write Batching Scheduler

## Difficulty: Senior

## Skills Tested
- Layout Thrashing Prevention
- Asynchronous Task Scheduling
- `requestAnimationFrame` for Paint Alignment
- Queue Data Structures & State Flush Loops

## Problem Statement
In large client applications containing many independent widgets (such as dashboards or chart grids), widgets often read positions or sizes and write updates independently. Because these execution stacks are interleaved, they trigger forced synchronous layouts (layout thrashing) and degrade scrolling performance.

Implement a lightweight, FastDOM-style scheduler with two methods:
1. `read(callback)`: Schedules a DOM read (measurement) operation.
2. `write(callback)`: Schedules a DOM write (mutation) operation.

The scheduler must ensure all scheduled reads execute first as a single batch, followed by all scheduled writes as a single batch, inside a single `requestAnimationFrame` paint cycle.

## Starter Code
```javascript
/**
 * FastDOM-style scheduler to batch DOM reads and writes separately.
 */
export class DOMScheduler {
  constructor() {
    this.reads = [];
    this.writes = [];
    this.scheduled = false;
  }

  /**
   * Schedule a DOM read operation.
   */
  read(callback) {
    // Implement
  }

  /**
   * Schedule a DOM write operation.
   */
  write(callback) {
    // Implement
  }

  /**
   * Flush the queued reads and writes.
   */
  _flush() {
    // Implement
  }
}
```

## Requirements
- All reads must execute before any writes inside a single frame.
- Multiple calls to `read` or `write` must only schedule a single `requestAnimationFrame` task.
- The scheduler must catch errors thrown in user callbacks and prevent them from blocking the execution of subsequent tasks in the queues.
- Support recursion: if a `read` callback schedules another `read` or `write`, they must be queued for execution (reads in the current or next frame, writes in the current or next frame).

## Edge Cases
- Callbacks throwing runtime exceptions.
- Repeatedly scheduling tasks in an infinite loop (which could hang the UI).
- Clearing or canceling scheduled tasks (optional but good for cleanup).

## Expected Approach
We use two queues: `this.reads` and `this.writes`.
When `read` or `write` is called, we push the callback into the respective queue.
If `this.scheduled` is false, we set it to true and schedule a flush task using `requestAnimationFrame(() => this._flush())`.
Inside `_flush`:
1. Save the current queues to temporary arrays and clear `this.reads` and `this.writes` (to allow new tasks scheduled during execution to queue for the next frame).
2. Loop and execute all read callbacks inside a try/catch.
3. Loop and execute all write callbacks inside a try/catch.
4. Reset `this.scheduled = false`. If new tasks were queued during execution, reschedule `_flush`.

## Solution
```javascript
export class DOMScheduler {
  constructor() {
    this.reads = [];
    this.writes = [];
    this.scheduled = false;
  }

  /**
   * Schedules a DOM read (measurement) task.
   * @param {Function} callback 
   */
  read(callback) {
    this.reads.push(callback);
    this._scheduleFlush();
  }

  /**
   * Schedules a DOM write (mutation) task.
   * @param {Function} callback 
   */
  write(callback) {
    this.writes.push(callback);
    this._scheduleFlush();
  }

  /**
   * Schedules execution of queues using requestAnimationFrame.
   */
  _scheduleFlush() {
    if (this.scheduled) return;
    this.scheduled = true;

    requestAnimationFrame(() => {
      this._flush();
    });
  }

  /**
   * Executes all reads, then all writes.
   */
  _flush() {
    const readsToRun = this.reads;
    const writesToRun = this.writes;

    // Reset queues immediately to capture new tasks scheduled recursively
    this.reads = [];
    this.writes = [];
    this.scheduled = false;

    // 1. Run all measurements (reads)
    readsToRun.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("DOMScheduler: Error in read callback", err);
      }
    });

    // 2. Run all mutations (writes)
    writesToRun.forEach((callback) => {
      try {
        callback();
      } catch (err) {
        console.error("DOMScheduler: Error in write callback", err);
      }
    });

    // 3. Reschedule if recursive calls added new tasks to the queues
    if (this.reads.length > 0 || this.writes.length > 0) {
      this._scheduleFlush();
    }
  }
}

// Singleton helper export
export const scheduler = new DOMScheduler();
```

## Explanation
- **Separation of Queues**: By flushing `reads` before `writes`, the browser is guaranteed to use its cached layout measurements. By the time `writes` occur, the layout is mutated, but no further reads are executed in this frame, eliminating layout recalculations.
- **Asynchronous Execution**: Using `requestAnimationFrame` aligns DOM manipulations with browser screen refresh steps, reducing paint stutter.
- **Robust Exception Handling**: Wrapping each callback in a try/catch blocks prevents a single buggy callback from crash-halting the queue processing.

## Time Complexity
- **Scheduling**: $O(1)$ constant time queue insertion.
- **Flushing**: $O(N)$ linear time to execute the $N$ callbacks in the queues.

## Space Complexity
- **Memory Overhead**: $O(N)$ space required to hold task callback references in the array queues.

---

## Interviewer Follow-ups
1. "What if a callback schedules a write inside a read callback? Is that valid?"
   (Yes, it is highly valid and encouraged. For example, a card measures its width in a `read` callback, and then schedules a `write` callback to set its height. Since we empty queues during the current frame, the new write is immediately appended to `this.writes` and will execute during the mutation phase of the *same* frame).
2. "How would you handle priority scheduling where some writes are critical and cannot wait for animation frames?"
   (Implement priority queue layers or expose a `flushSync()` method that clears the queue synchronously, although that risks layout thrashing).

---

## Senior-Level Discussion
Writing custom event/DOM coordinators is a standard optimization technique in massive systems.
Frameworks like React (Fiber Scheduler) and library utilities (FastDOM) use identical queue layouts to defer and batch layouts.
By implementing this in vanilla JS, you show a complete grasp of browser event loops and layout lifecycles, and present a viable strategy for scaling UI performance without refactoring the entire rendering engine.

---

### Extra Practice: DOM/BOM Web APIs
**Task:** Query element sizing metrics dynamically and explain how BOM window viewport coordinates differ from document coordinate offsets:
```javascript
export function getElementDocumentOffset(el) {
  const rect = el.getBoundingClientRect();
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX
  };
}
```
