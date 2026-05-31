# Practical: DOM Read/Write Scheduler (Fastdom-like)

## Problem Title: Layout-Thrashing Prevention Scheduler (DOM Task Batcher)

## Difficulty: Senior

## Skills Tested
- Layout Thrashing (Forced Synchronous Layout) detection
- Task Scheduling using `requestAnimationFrame`
- Queue management and batch execution
- Custom scheduling patterns

## Problem Statement
In large, dynamic web applications, multiple independent components may read and write to the DOM simultaneously. If these reads and writes are interleaved, the browser is forced to run layout calculations repeatedly, causing layout thrashing and dropping frame rates.

Implement a task scheduler `DOMScheduler` (similar to the Fastdom library) that coordinates DOM read and write operations. The scheduler must queue operations and batch them into a single `requestAnimationFrame` cycle, executing all reads first followed by all writes.

The scheduler must expose two methods:
1. `read(callback)`: Schedules a DOM read task (e.g. measuring offsetWidth).
2. `write(callback)`: Schedules a DOM write task (e.g. changing style.width).

## Starter Code
```javascript
export class DOMScheduler {
  constructor() {
    // Implement queues
  }

  read(callback) {
    // Implement
  }

  write(callback) {
    // Implement
  }
}
```

## Requirements
- All scheduled reads must execute *before* any scheduled writes in the same animation frame.
- If a task is scheduled while the queue is currently flushing, defer it to the next animation frame.
- Maintain error safety: if a callback throws an error, it must not prevent subsequent scheduled callbacks from executing.

## Edge Cases
- **Nested schedules**: If a read task schedules another read task (or a write task) inside its callback, ensure the nested task is queued and executed correctly (either in the current cycle or deferred to the next frame depending on queue state).

## Expected Approach
Maintain two separate queues: `readQueue` and `writeQueue`. When `read` or `write` is called, push the callback to the respective queue and schedule a frame flush using `requestAnimationFrame` (if not already scheduled).
During the frame flush:
1. Set a flag indicating flushing is in progress.
2. Flush the `readQueue` completely, executing all read callbacks.
3. Flush the `writeQueue` completely, executing all write callbacks.
4. Reset flags and schedule any deferred tasks for the next frame.

## Solution
```javascript
export class DOMScheduler {
  constructor() {
    this._reads = [];
    this._writes = [];
    this._scheduled = false;
  }

  read(callback) {
    this._reads.push(callback);
    this._scheduleFlush();
  }

  write(callback) {
    this._writes.push(callback);
    this._scheduleFlush();
  }

  _scheduleFlush() {
    if (this._scheduled) return;

    this._scheduled = true;

    requestAnimationFrame(() => {
      this._flush();
    });
  }

  _flush() {
    // 1. Snapshot queues to isolate current frame tasks
    const readsToExecute = this._reads;
    const writesToExecute = this._writes;

    // Reset queues for next frame schedules
    this._reads = [];
    this._writes = [];
    this._scheduled = false;

    // 2. Execute all DOM Reads first
    for (const callback of readsToExecute) {
      try {
        callback();
      } catch (err) {
        console.error("Error in scheduled DOM read task:", err);
      }
    }

    // 3. Execute all DOM Writes second
    for (const callback of writesToExecute) {
      try {
        callback();
      } catch (err) {
        console.error("Error in scheduled DOM write task:", err);
      }
    }
  }
}
```

## Explanation
- **Queued Separation**: By placing read and write operations into separate queues, `DOMScheduler` ensures that all reads run back-to-back, allowing the browser to return cached layout calculations. Writes are executed afterwards, invalidating the layout only once at the end of the frame.
- **Microtask Frame Batching**: Using `requestAnimationFrame` defer operations to the browser's native repaint cycles, ensuring that DOM modifications are synchronized with screen updates.
- **Error Isolation**: Each callback is executed inside a `try/catch` block, protecting the queue execution loop from uncaught errors.

## Time Complexity
- Scheduling (`read` / `write`): $O(1)$ queue push operations.
- Execution: $O(N)$ where $N$ is the number of scheduled tasks in the queues.

## Space Complexity
- $O(N)$ space required to hold task callback references in the queue arrays.

## Interviewer Follow-ups
1. "What happens if a scheduled write task schedules a read task inside its callback?" (In our simple implementation, the new read task is pushed to the queue and scheduled for the *next* animation frame. This is correct: since a write has occurred, we must wait for the next frame to read geometries safely).
2. "How would you implement a `.clear(taskRef)` method to cancel a pending task?" (Instead of pushing raw callbacks, wrap them in objects with unique IDs: `{ id, callback }`. Return the ID from `read()` / `write()`, and filter out the task from the queue when `clear()` is invoked).

## Senior-Level Discussion
Forced synchronous layout is a common cause of poor rendering performance in large applications. When multiple independent React components or third-party libraries manipulate the DOM simultaneously, coordination is essential.
A shared `DOMScheduler` utility prevents layout thrashing by batching operations. In modern React (v18+), concurrent rendering features and state transitions reduce the need for manual DOM schedulers, but understanding these concepts is vital when writing raw DOM scripts or custom animation libraries.

---

### Extra Practice: Form Input Styling
**Task:** Style a custom form text-input field that aligns with BEM naming patterns and transitions outlines performantly on focus:
```css
.form-input {
  appearance: none;
  border: 1px solid #ccc;
  transition: border-color 0.2s ease-in-out;
}
.form-input:focus-visible {
  outline: 2px solid blue;
  outline-offset: 2px;
}
```
