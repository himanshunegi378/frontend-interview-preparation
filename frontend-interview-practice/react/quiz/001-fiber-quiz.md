# Quiz: React Rendering & Fiber Reconciliation

## Questions

### Question 1 (Medium - List Key Reconciliation)
Given this parent component updating its list elements, does React reuse the DOM nodes or recreate them when the order of items is reversed, and what is the console output?
```javascript
import React, { useState } from "react";

export function ListComponent() {
  const [items, setItems] = useState(["A", "B"]);

  return (
    <div>
      <button onClick={() => setItems(["B", "A"])}>Reverse</button>
      {items.map((item, idx) => (
        <input key={idx} defaultValue={item} />
      ))}
    </div>
  );
}
```
*Note:* Assume the user types into the inputs first, then clicks "Reverse".

---

### Question 2 (Hard - Fiber Work Loop Interruptions)
If a high-priority user interaction (like typing in a text field) occurs while React is in the middle of a large, time-sliced Render Phase cycle, what does the Fiber scheduler do to the active rendering work, and how does it prevent UI freezing?

---

### Question 3 (Senior - Component Rendering and Refs)
Does updating the `.current` property of a `useRef` hook trigger a component re-render? If not, why? Compare the lifecycle of `useRef` values with `useState` values in the Fiber tree.

---

## Answer Key & Explanations

### Question 1: Index Key Reconciliation Bug
- **Difficulty:** Medium
- **Answer:** React reuses the DOM nodes, but the input values **do not swap**, resulting in an out-of-sync UI state.
- **Explanation:**
  - When the list is reversed, the items map becomes:
    - Index `0`: Value `"B"`.
    - Index `1`: Value `"A"`.
  - Since we used the array index `idx` as the key, React's reconciliation engine compares keys between the old and new tree:
    - Old key `0` matches new key `0`.
    - Old key `1` matches new key `1`.
  - Because keys match, React assumes the element identities are unchanged. It reuses the same input DOM elements in place and only updates properties that are bound to React state.
  - Since we used `defaultValue` (which only sets the initial value on mount) instead of `value` (controlled input), React does not update the DOM input values. The text typed by the user stays in the same physical input boxes, creating a bug where the values do not swap.
- **Common Mistakes:** Expecting the inputs to swap places correctly because the data array reversed.
- **Fix:** Use unique, stable IDs as keys: `key={item.id}` or `key={item}` (since strings are unique here).
- **Senior-Level Insight:** Never use array indexes as keys for dynamic or re-orderable lists. Stable keys ensure that DOM elements and local component states stay synchronized with the data model.

---

### Question 2: Fiber Cooperative Work Scheduling
- **Difficulty:** Hard
- **Answer:** React suspends the active Render Phase, yields the main thread to the browser to handle the user interaction immediately, and then either resumes or discards the suspended work.
- **Explanation:**
  - The Fiber scheduler uses a cooperative work loop:
    ```javascript
    while (nextUnitOfWork !== null && !shouldYield()) {
      nextUnitOfWork = performUnitOfWork(nextUnitOfWork);
    }
    ```
  - The `shouldYield()` function checks if the current frame budget has expired (usually 5ms) or if there are pending high-priority events (like typing or clicks) in the host event queue.
  - If a user input occurs, `shouldYield()` returns `true`, and React pauses the Render Phase.
  - The browser handles the typing input and paints the update immediately, maintaining 60 FPS responsiveness.
  - Once the input is handled, React either resumes the paused rendering work or discards the work-in-progress tree if the input triggered a state change that makes the pending update obsolete.
- **Common Mistakes:** Assuming React always renders synchronously and cannot pause work mid-cycle.
- **Interviewer Follow-up:** "How does React v18's `useTransition` Hook leverage this time-slicing behavior?" (It marks state updates as low-priority, allowing the Fiber scheduler to yield and prioritize typing inputs over rendering heavy lists).
- **Senior-Level Insight:** Understanding this cooperative scheduling is key to designing responsive enterprise dashboards that handle real-time data feeds.

---

### Question 3: State Hook vs. Ref Hook Lifecycles
- **Difficulty:** Senior
- **Answer:** Modifying `useRef.current` does **not** trigger a re-render because it is a plain JavaScript object reference that resides outside the render trigger cycle.
- **Explanation:**
  - Under the hood, during the component mount phase, React allocates a hook object on the Fiber node's `memoizedState` linked list:
    - **`useState`**: Stores the state value and a queue of updates. When the state setter is called, it schedules an update task on the Fiber root, triggering a render cycle.
    - **`useRef`**: Allocates a simple container object: `{ current: initialValue }`. On subsequent renders, React returns the same container object reference.
  - Because updating `.current` is a direct mutation of a JavaScript object property, it does not enqueue an update on the Fiber node, bypassing the render schedule.
- **Common Mistakes:** Expecting modifications to a ref to trigger updates on child components that consume the ref.
- **Interviewer Follow-up:** "When should you use `useRef` instead of `useState`?" (Use `useRef` for tracking mutable values that do not affect the visual layout of the component, like timer IDs, scroll positions, or direct DOM node references).
- **Senior-Level Insight:** Refs provide a way to escape React's declarative model. Use them to cache values across renders without triggering costly component re-renders.