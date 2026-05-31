# Browser Events & Event Delegation

## Why It Matters
Browser events are the foundation of interactivity on the web. Naive event management—such as attaching individual event listeners to thousands of list items—results in memory leaks, sluggish page transitions, and unnecessary garbage collection. Senior engineers must understand the mechanics of the event propagation loop (capturing, target, and bubbling), leverage event delegation to build high-performance UIs, and use passive listeners to maintain 60 FPS scrolling.

---

## Core Concepts & Mental Models

### 1. The Event Propagation Model (The Three Phases)
When an event occurs on a DOM element, the event does not just exist on that single node. The browser propagates it through the DOM tree in three distinct phases:

```
[ Window ] ──(Capturing Phase) ──> [ Target Node ] ──(Bubbling Phase) ──> [ Window ]
```

1.  **Capturing Phase**: The event travels down from the `window` object, through `document`, `<html>`, `<body>`, and parent nodes until it reaches the parent of the target node.
2.  **Target Phase**: The event reaches the target element that initiated the interaction (represented as `event.target`).
3.  **Bubbling Phase**: The event bubbles back up from the target element, through its ancestors, all the way to `window`. By default, event listeners registered using `addEventListener` listen during this phase.

### 2. Event Delegation
Instead of attaching separate event listeners to every list item or row in a table, event delegation attaches a **single listener** to a common parent element.
*   **The Bubbling Leverage**: When a child is clicked, the event bubbles up to the parent.
*   **Target Identification**: Inside the parent's event handler, the code reads `event.target` (the exact element clicked) and uses DOM selectors like `element.closest()` to identify which child was clicked.
*   *Benefits*: 
    1.  **Memory Savings**: Allocates one event listener instead of thousands.
    2.  **Dynamic Children**: Automatically handles new elements added to the list without needing to bind new listeners.

```javascript
// Naive Approach (Memory Heavy)
document.querySelectorAll(".item").forEach(button => {
  button.addEventListener("click", handleAction);
});

// Optimized Delegation Approach (Memory Light)
document.getElementById("list-container").addEventListener("click", (event) => {
  const itemButton = event.target.closest(".item");
  if (itemButton) {
    handleAction(event);
  }
});
```

### 3. Event Control APIs
*   **`event.stopPropagation()`**: Stops the event from propagating further up (or down) the DOM tree to parents. Other listeners attached to the *same* element will still execute.
*   **`event.stopImmediatePropagation()`**: Halts all propagation *and* prevents any other listeners registered on the *same* element from executing.
*   **`event.preventDefault()`**: Prevents the browser's default native action (e.g. following a link, submitting a form, checking a checkbox).

### 4. Passive Event Listeners
When a user scrolls the page, the browser starts scrolling before running scroll event handlers. If the scroll handler calls `event.preventDefault()`, the scroll stops.
*   **Scroll Delay**: The browser has to wait for the JavaScript thread to complete the scroll handler execution *just in case* it calls `preventDefault()`, causing scroll lag.
*   **`passive: true`**: Passing `{ passive: true }` in `addEventListener` options guarantees to the browser that the handler will never call `preventDefault()`. This allows the browser to scroll the page smoothly in parallel on a compositor thread, without waiting for JavaScript execution.

---

## Real-World Case Study / Examples

### Table Action Button Delegation
Consider a data table rendering 1,000 orders. Each row contains an "Archive" button.

**Bad (Allocating 1,000 listeners)**:
```javascript
const buttons = document.querySelectorAll(".archive-btn");
buttons.forEach(btn => btn.addEventListener("click", archiveItem));
```
If table rows are dynamically added, sorted, or deleted, you must bind/unbind listeners constantly to avoid memory leaks.

**Fix (Delegation)**:
```javascript
const table = document.querySelector("#orders-table");
table.addEventListener("click", (e) => {
  const btn = e.target.closest(".archive-btn");
  if (btn) {
    const orderId = btn.dataset.orderId;
    archiveItem(orderId);
  }
});
```

---

## Common Interview Traps

### `event.target` vs. `event.currentTarget`
*   **`event.target`**: The deepest, exact DOM element that triggered the event (e.g., the actual text `<span>` inside a button).
*   **`event.currentTarget`**: The DOM element that the event listener is currently attached to (e.g., the parent element listening to the bubbled event).

---

## Junior vs. Senior View

*   **Junior View**: "Attach `onClick` to elements. If an event propagates incorrectly, add `stopPropagation()` to fix it. If the page lags during scroll, try using lodash debounce."
*   **Senior View**: "Design UI interactions around event delegation to optimize memory usage and avoid element binding management. Distinguish between targeting elements (`target.closest()`) and listeners (`currentTarget`), and configure scroll and touch events with `{ passive: true }` to maintain 60 FPS scrolling on mobile devices."

---

## Related Interview Questions
1. "Explain the difference in behavior when setting the third parameter of `addEventListener` to `true` vs `false`."
2. "Why can't you delegate events like `focus` and `blur` using standard bubbling techniques, and what are the workarounds?"
3. "How does React's synthetic event delegation system differ from standard browser event delegation?"
4. "What happens if a child element has `pointer-events: none` applied in CSS during click event propagation?"
