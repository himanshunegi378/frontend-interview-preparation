# Quiz: Browser APIs, Garbage Collection, & Memory Management

## Questions

### Question 1 (Medium - Event Delegation Target)
Given this HTML structure, which DOM property should you check inside the parent click listener to identify the specific item text, and how do you handle clicks on nested elements?
```html
<ul id="parent-list">
  <li class="item">
    <span>Item 1</span>
  </li>
  <li class="item">
    <span>Item 2</span>
  </li>
</ul>
```

---

### Question 2 (Hard - Detached DOM GC)
In this code block, when `cleanup()` is called, is the button element successfully garbage collected? Explain why or why not.
```javascript
let cache = {
  element: document.getElementById("my-btn")
};

function cleanup() {
  const container = document.getElementById("container");
  container.innerHTML = ""; // Removes the button from the DOM
}
```

---

### Question 3 (Senior - AbortController Reuse)
Can you reuse the same `AbortSignal` instance for multiple fetch requests? If so, what happens if you call `abort()` on the controller while multiple fetches are pending?

---

## Answer Key & Explanations

### Question 1: Target vs. CurrentTarget with Closest
- **Difficulty:** Medium
- **Answer:** Use `e.target.closest(".item")` to locate the target item, and read `.textContent`.
- **Explanation:**
  - `e.target` refers to the exact element clicked (which could be the nested `<span>`).
  - `e.currentTarget` refers to the element holding the listener (`#parent-list`).
  - To implement event delegation safely, use `e.target.closest(".item")`. This traverses up the DOM tree from the clicked element to find the nearest element matching `.item`.
  - If a match is found, you can read its `textContent` or perform actions.
- **Common Mistakes:** Using `e.target.className === "item"`, which fails if the user clicks on the nested `<span>` instead of the outer `<li>`.
- **Interviewer Follow-up:** "What is the difference between `e.preventDefault()` and `e.stopPropagation()`?" (`e.preventDefault()` cancels the browser's default behavior for the event, while `e.stopPropagation()` stops the event from bubbling up the DOM tree).
- **Senior-Level Insight:** Event delegation reduces the number of event listeners in memory, making it highly useful when rendering large data lists.

---

### Question 2: Detached DOM References
- **Difficulty:** Hard
- **Answer:** No, the button is not garbage collected. It becomes a **detached DOM node**.
- **Explanation:**
  - Removing the button from the DOM using `container.innerHTML = ""` deletes the node from the document tree.
  - However, the global object `cache` still holds a reference to the DOM element via `cache.element`.
  - Because `cache` is reachable from the GC Root, the button element cannot be garbage collected. It remains on the heap as a detached DOM node, keeping its properties and memory footprint alive.
  - To allow GC, you must explicitly break the reference: `cache.element = null;`.
- **Common Mistakes:** Assuming that removing an element from the DOM automatically cleans it up from JavaScript memory.
- **Interviewer Follow-up:** "How does a detached DOM node differ from an active DOM node?" (An active node is attached to the document render tree and participates in layout/paint, while a detached node exists only in JavaScript heap memory).
- **Senior-Level Insight:** Detached DOM nodes are a common source of memory leaks in SPA routers. Always clean up local element caches and DOM references when components unmount.

---

### Question 3: AbortSignal Multiplexing
- **Difficulty:** Senior
- **Answer:** Yes, you can pass the same `AbortSignal` to multiple fetches. Calling `abort()` cancels **all** pending requests associated with that signal.
- **Explanation:**
  - An `AbortSignal` is a read-only token. Multiple async operations (like fetches) can subscribe to the same signal.
  - When `controller.abort()` is called, the signal transition to aborted state. Every active fetch listening to the signal is canceled immediately, and their promises reject with an `AbortError`.
  - If you call fetch passing a signal that has *already* been aborted, the fetch rejects immediately without making a network request.
- **Common Mistakes:** Creating a separate `AbortController` instance for every request when you want to cancel them as a single group.
- **Interviewer Follow-up:** "How do you listen to abort events in custom async operations?" (Attach a listener to the signal: `signal.addEventListener("abort", () => { ... })`).
- **Senior-Level Insight:** Sharing an abort signal is useful for page navigation: when a user leaves a dashboard page, you can abort all pending queries for that page using a single call.

---

### Question 4 (Browser Storage & Security)
Compare `localStorage` vs. `sessionStorage` vs. cookies in terms of capacity, lifecycle, and security.
**Answer:** `localStorage` persists across sessions (5MB capacity). `sessionStorage` lasts until tab close (5MB). Cookies are sent with requests (4KB capacity, vulnerable to CSRF, secured using HttpOnly flag).
