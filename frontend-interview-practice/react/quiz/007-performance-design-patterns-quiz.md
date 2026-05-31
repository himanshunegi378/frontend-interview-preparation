# Quiz: React Performance, Memoization, & Design Patterns

## Questions

### Question 1 (Medium - Inline Objects & Memoization)
A developer tries to optimize a component using `React.memo`:
```javascript
import React, { useState } from "react";

const ChildCard = React.memo(({ config, title }) => {
  console.log("ChildCard rendered:", title);
  return <div style={config}>Card: {title}</div>;
});

export function ParentDashboard() {
  const [count, setCount] = useState(0);

  return (
    <div>
      <button onClick={() => setCount((c) => c + 1)}>Increment: {count}</button>
      <ChildCard 
        title="Settings" 
        config={{ background: "#f0f0f0", color: "#333" }} 
      />
    </div>
  );
}
```
Does `ChildCard` re-render when the button in `ParentDashboard` is clicked? Explain why or why not.

---

### Question 2 (Medium/Hard - Custom Hook Function Reference Stability)
A team designs a custom hook to manage a toggle state:
```javascript
import { useState } from "react";

export function useToggle(initialVal = false) {
  const [value, setValue] = useState(initialVal);
  
  const toggle = () => setValue((v) => !v);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);

  return { value, toggle, setTrue, setFalse };
}
```
If a parent component uses this hook and passes `setTrue` to a memoized child component, does the child component re-render when the parent state updates? What is the solution?

---

### Question 3 (Senior - Accessibility and Focus Management)
When building an accessible Modal component using React Portals, explain why managing the keyboard focus is critical. Detail the exact mechanism required to prevent keyboard users from "tabbing out" of the modal into background page elements (Focus Trapping).

---

## Answer Key & Explanations

### Question 1: Inline Object Literal Reference Breakage
- **Difficulty:** Medium
- **Answer:** Yes, `ChildCard` will re-render on every click of the increment button.
- **Explanation:**
  - `React.memo` performs a shallow comparison of props: `prevProps.config === nextProps.config` and `prevProps.title === nextProps.title`.
  - In `ParentDashboard`, the `config` prop is passed as an inline object literal: `config={{ background: "#f0f0f0", color: "#333" }}`.
  - Every time `ParentDashboard` renders, a new object is allocated in memory. The reference identity of `config` changes.
  - Since `prevProps.config !== nextProps.config` (strict inequality of two different objects in memory), `React.memo` determines that the props have changed and triggers a re-render of `ChildCard`.
- **Common Mistakes:** Believing `React.memo` does deep equality checks of object properties. It only checks reference equality (`===`).
- **Fix:** Move the static config object outside the component scope, or wrap it in `useMemo` if it depends on component variables:
  ```javascript
  // Fix 1: Move outside parent component
  const CARD_CONFIG = { background: "#f0f0f0", color: "#333" };
  ```
- **Senior-Level Insight:** Be careful with inline styles and object configurations. Passing inline arrays, objects, or inline arrow functions directly as props to children breaks memoization.

---

### Question 2: Custom Hook Reference Stability
- **Difficulty:** Medium/Hard
- **Answer:** Yes, the child re-renders because `setTrue` is re-created as a new function reference on every single execution of `useToggle`.
- **Explanation:**
  - When the parent component re-renders, `useToggle` is executed again.
  - During execution, the helper functions (`toggle`, `setTrue`, `setFalse`) are re-allocated.
  - The returned object from the hook has brand new function references, causing children receiving these functions as props to see them as changed, rendering anyway.
- **Fix:** Wrap the hook helper methods in `useCallback` inside the hook:
  ```javascript
  import { useState, useCallback } from "react";

  export function useToggle(initialVal = false) {
    const [value, setValue] = useState(initialVal);
    
    const toggle = useCallback(() => setValue((v) => !v), []);
    const setTrue = useCallback(() => setValue(true), []);
    const setFalse = useCallback(() => setValue(false), []);

    return { value, toggle, setTrue, setFalse };
  }
  ```
- **Common Mistakes:** Forgetting that custom hooks are just functions. Every variable and function inside a custom hook is re-instantiated on every host component render unless explicitly memoized.
- **Senior-Level Insight:** When designing public-facing utility hooks or internal component libraries, always wrap returned callbacks in `useCallback` to prevent downstream optimization breakage for consumers.

---

### Question 3: Accessible Keyboard Focus Trapping
- **Difficulty:** Senior
- **Answer:** Managing keyboard focus prevents users who navigate via keyboards or screen readers from accessing background elements when a modal is open. Focus trapping is the mechanism that intercepts the `Tab` key and loops focus exclusively within the modal's DOM tree.
- **Explanation:**
  - When a modal opens, focus should immediately move inside the modal (e.g., to the close button or first input).
  - To trap focus, attach a keydown event listener inside the modal:
    1. Query all focusable DOM elements (buttons, inputs, links, elements with `tabIndex >= 0`) inside the modal.
    2. Identify the first and last focusable element.
    3. Listen for the `Tab` key.
    4. If the user presses `Tab` while on the last element, prevent default browser behavior and focus the first element.
    5. If the user presses `Shift + Tab` (reverse tab) on the first element, prevent default and focus the last element.
  - On closing, restore focus back to the triggering element (stored using a ref when the modal was opened).
- **Common Mistakes:** Only hiding background elements visually using opacity or CSS positioning. Screen readers and keyboard tab navigation can still access hidden background buttons unless focus is trapped or background elements are marked with `aria-hidden="true"`.
- **Senior-Level Insight:** Writing manual focus trap code is prone to bugs (such as handling nested overlays or shadow DOM nodes). In enterprise applications, favor verified primitives like Radix UI or React Focus Lock to enforce web standard accessibility (WAI-ARIA Dialog).

---

### Question 4 (Component Design Anti-patterns)
Why is declaring a component inside the render body of another component an anti-pattern?
**Answer:** On every render cycle of the parent, React compiles a completely new component reference. This causes the child component to unmount and remount completely, losing its internal DOM states, focus, and triggering slow renders.
