# JavaScript Browser APIs, Garbage Collection, & Memory Leaks

## Why It Matters
Senior frontend engineers must master browser runtime APIs and memory management to prevent memory leaks, reduce CPU usage, and ensure application responsiveness. Poor memory management leads to page slow-downs, browser crashes, and high Interaction to Next Paint (INP).

---

## Core Concepts & Mental Models

### 1. Event Delegation
Instead of attaching event listeners to hundreds of individual child nodes, event delegation attaches a single listener to a parent node. This listener uses **event bubbling** to capture events from children:
```javascript
parentEl.addEventListener("click", (e) => {
  if (e.target.matches(".item")) {
    console.log("Item clicked:", e.target.textContent);
  }
});
```
**Benefits:** Reduces the number of active listeners in memory and simplifies handling dynamically added child elements.

### 2. V8 Garbage Collection (GC) Mechanics
V8 manages heap memory using two primary spaces:
- **Generational GC**:
  - **Scavenger (Minor GC)**: Quickly cleans up short-lived objects in the "New Space" using copy-forward algorithms.
  - **Mark-Sweep-Compact (Major GC)**: Traces object graphs in the "Old Space" starting from "GC Roots" (e.g., `window`, stack parameters). It marks reachable objects, sweeps away dead ones, and compacts the heap to prevent fragmentation.

### 3. Common Memory Leaks in SPAs
Memory leaks occur when references to discarded objects are retained on the heap, preventing the GC from reclaiming them:
- **Detached DOM Nodes**: A Javascript variable retains a reference to a DOM element that has been removed from the document tree. The entire DOM subtree is held in memory.
- **Forgotten Timers / Observers**: A `setInterval` or `ResizeObserver` listener remains active after its target component unmounts, holding the closure and any referenced state in memory.
- **Global Variables**: Unintended assignments to `window` or global scope.

### 4. Fetch & Request Cancellation via AbortController
The `AbortController` API allows you to cancel asynchronous operations like `fetch` requests:
- `const controller = new AbortController();`
- Pass `controller.signal` as a fetch parameter.
- Invoke `controller.abort()` to cancel the request. The fetch promise rejects with an `AbortError`.

### 5. Background Threads: Web Workers vs. Service Workers
- **Web Workers**: Dedicated threads run in the background, allowing you to offload long-running CPU tasks (like data sorting or cryptography) from the main UI thread. They communicate via asynchronous message passing (`postMessage`).
- **Service Workers**: Act as network proxies. They sit between the browser, web app, and network, intercepts requests, and manage cache strategies (enabling offline PWAs). They run independently of browser tabs.

---

## Real-World Case Study / Examples

### 1. Detached DOM Tree Leak Trace
Consider a dynamically rendered sidebar. If a reference to a closed button is saved in a global registry:

```javascript
const activeElements = [];

function registerElement(el) {
  activeElements.push(el);
}

// Sidebar closes, elements are removed from DOM, but activeElements still holds the button reference!
```
**Fix:** Use `WeakSet` or `WeakMap` for tracking object references, or clean up registries when components unmount.

---

## Common Interview Traps

### 1. Double Triggering Event Delegation
```javascript
element.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (btn) handleAction();
});
```
**Trap:** If `.btn` contains nested spans, `e.target` refers to the span, not the button. Using `e.target.matches(".btn")` will fail to detect clicks on the children.
**Fix:** Use `e.target.closest(".btn")` to traverse up the DOM tree and locate the button wrapper correctly.

---

## Junior vs. Senior View

- **Junior View**: "Event listeners should be attached to each item, and JavaScript cleans up memory automatically. Web Workers are just for writing separate files."
- **Senior View**: "Memory management in SPAs requires explicit resource cleanup. Senior engineers profile heap allocations to identify detached DOM nodes, use `AbortController` to resolve fetch race conditions, implement event delegation to optimize memory usage, and offload CPU-heavy calculations to Web Workers to keep the main thread running at a stable 60 FPS."

---

## Related Interview Questions
1. "How do you detect and isolate a detached DOM node using Chrome DevTools Heap Snapshots?"
2. "Explain the differences between Web Workers, Service Workers, and Worklets."
3. "How does the V8 GC Scavenger algorithm differ from the Mark-Sweep algorithm in terms of performance and memory overhead?"
4. "How do you use `AbortController` to build a fetch utility that times out after 5 seconds?"

---

## Security Basics in JS
JavaScript environments pose security risks:
- **XSS (Cross-Site Scripting)**: Occurs when untrusted scripts are injected and executed. Prevent by sanitizing HTML inputs and avoiding `eval()` or `innerHTML`.
- **Prototype Pollution**: Occurs when helper utilities merge user payloads into system objects recursively without filtering parent keys like `__proto__` or `constructor`.
- **JWT Storage**: Storing JWTs in `localStorage` makes them vulnerable to XSS. Secure them in HTTP-only, secure, SameSite cookies.
