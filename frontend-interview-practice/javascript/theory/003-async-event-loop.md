# JavaScript Event Loop, Promises, & Asynchronous Engine Architecture

## Why It Matters
Senior engineers must master the asynchronous execution loop to build low-latency interfaces and avoid UI freezing. Misunderstanding how promises, async/await, and browser paints schedule tasks can lead to laggy scrolling, high Interaction to Next Paint (INP), and race conditions in data-fetching.

---

## Core Concepts & Mental Models

```
         ┌────────────────────────────────────────┐
         │              Call Stack                │
         └──────────────────┬─────────────────────┘
                            │ (stack empty?)
                            ▼
         ┌────────────────────────────────────────┐
         │             Microtask Queue            │
         │  - Promise callbacks, queueMicrotask   │
         └──────────────────┬─────────────────────┘
                            │ (queue empty?)
                            ▼
         ┌────────────────────────────────────────┐
         │            Macrotask Queue             │
         │  - setTimeout, setInterval, postMessage│
         └──────────────────┬─────────────────────┘
                            │
                            ▼
         ┌────────────────────────────────────────┐
         │          Rendering Pipeline            │
         │  - Style, Layout, Paint, Composite     │
         └────────────────────────────────────────┘
```

### 1. The Single-Threaded Event Loop
JavaScript runs in a single-threaded runtime environment. To perform non-blocking actions, the engine relies on host environment APIs (like browser Web APIs or Node.js libuv bindings).

### 2. Macrotasks vs. Microtasks
The runtime divides tasks into two separate queues:
- **Macrotasks**: Executed one per loop iteration. Examples include `setTimeout`, `setInterval`, `setImmediate` (Node), network I/O, user interaction callbacks, and postMessage communication.
- **Microtasks**: Executed immediately after the current stack empties, *before* moving to the next macrotask and *before* browser rendering. The microtask queue must be completely flushed. If a microtask schedules more microtasks, they are executed in the same loop cycle, potentially blocking the main thread. Examples include `Promise.then` callbacks, `MutationObserver`, and `queueMicrotask`.

### 3. The Promise Pipeline
A Promise is a state machine with three states: `pending`, `fulfilled`, or `rejected`. When a Promise resolves, its `.then()` or `.catch()` callback is scheduled to run on the microtask queue.

### 4. Async / Await Under the Hood
The `async/await` syntax is sugar built on top of generators and Promises. When V8 encounters `await somePromise()`, it suspends execution of the async function, pushes the remainder of the function to the microtask queue, and yields control back to the calling thread.

### 5. Generators & Iterators
Generators (`function*`) yield control back to the caller using the `yield` keyword. Unlike standard execution contexts that discard state on exit, generator contexts are moved to the heap, maintaining local variables and execution offsets for when `.next()` is invoked.

---

## Real-World Case Study / Examples

### 1. Splitting Long Tasks to Protect INP
When running heavy CPU processing (e.g., parsing a 50,000-line JSON payload), the call stack remains busy, preventing user inputs and styling updates. We can split this task by yielding control to the event loop using macrotasks:

```javascript
async function processLargeArray(items) {
  const CHUNK_SIZE = 1000;
  for (let i = 0; i < items.length; i += CHUNK_SIZE) {
    processChunk(items.slice(i, i + CHUNK_SIZE));
    // Yield to the event loop to allow render frames and inputs
    await new Promise(resolve => setTimeout(resolve, 0));
  }
}
```

---

## Common Interview Traps

### 1. Microtask Ingestion (Blocking the Main Thread)
```javascript
function blockForever() {
  Promise.resolve().then(blockForever);
}
// This freezes the browser tab! The microtask queue keeps feeding itself,
// preventing the loop from progressing to paint or next macrotasks.
```

---

## Junior vs. Senior View

- **Junior View**: "Async/await makes code run synchronously, and setTimeout puts code on a timer to run later."
- **Senior View**: "Asynchronous execution is scheduled via two queues. Microtasks run before rendering frames and are processed until empty. Macrotasks yield execution to let the browser execute paints. `async/await` compiles to generator-like state suspension in V8, moving execution frames to the heap. Senior engineers use this knowledge to split long tasks, prevent layout thrashing, and resolve race conditions."

---

## Related Interview Questions
1. "Explain the execution order of `setTimeout(fn, 0)`, `Promise.resolve().then(fn)`, and `requestAnimationFrame(fn)`."
2. "How does the V8 engine suspend execution of an `async` function during an `await` statement without blocking the OS thread?"
3. "What is the difference between `Promise.all`, `Promise.allSettled`, `Promise.any`, and `Promise.race` in terms of short-circuiting behavior?"
4. "How do you implement a custom async queue worker with concurrency limits?"
