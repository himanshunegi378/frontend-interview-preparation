# Quiz: React State, Forms, & Composition

## Questions

### Question 1 (Easy - Controlled Inputs without Setters)
A candidate writes the following code to handle a search query:
```javascript
import React, { useState } from "react";

export function SearchBox() {
  const [query, setQuery] = useState("Type here...");

  return (
    <input 
      type="text" 
      value={query} 
      onChange={(e) => console.log(e.target.value)} 
    />
  );
}
```
What happens when a user types inside this input box in the browser?

---

### Question 2 (Medium - Component Composition and Rerendering)
Consider the following structure. When the button inside `Parent` is clicked, which of the components (`Parent`, `ChildA`, `ChildB`) will be re-executed (re-rendered)?
```javascript
import React, { useState } from "react";

export function ChildA() {
  console.log("ChildA Rendered");
  return <div>Child A</div>;
}

export function ChildB() {
  console.log("ChildB Rendered");
  return <div>Child B</div>;
}

export function Parent({ children }) {
  const [count, setCount] = useState(0);
  console.log("Parent Rendered");

  return (
    <div>
      <button onClick={() => setCount(c => c + 1)}>Count: {count}</button>
      {children}
      <ChildB />
    </div>
  );
}

// Rendered in App:
// <Parent><ChildA /></Parent>
```

---

### Question 3 (Senior - Real-time Form Validation Performance)
An application contains a dynamic table grid of 50 input fields. The requirements demand validation checking on the entire dataset: if any input contains invalid characters, a global warning banner at the top of the page must render. 

If we use a single controlled state object at the parent level, how does this affect typing performance? Detail a solution that keeps the global validation banner updated in real time (on keystroke) *without* re-rendering all 50 input fields on every keypress.

---

## Answer Key & Explanations

### Question 1: Controlled Input Read-Only Trap
- **Difficulty:** Easy
- **Answer:** The input value will remain frozen as `"Type here..."`. The user will not see their typed characters appear in the input box, although the typed value will log to the console.
- **Explanation:**
  - In a controlled input, the visible text is determined by the `value` prop.
  - When the user presses a key, the browser triggers the `onChange` event handler, which prints the input's theoretical new value to the console.
  - However, because `setQuery` is never called, the `query` state remains `"Type here..."`.
  - When React re-evaluates the virtual node tree (if it re-renders at all, or if forced), the input's value property is set back to the immutable value of `query`. Thus, the input text remains frozen.
- **Common Mistakes:** Thinking that the browser updates the input value automatically and React just reads it.
- **Interviewer Follow-up:** "How do you make this input editable?" (Call `setQuery(e.target.value)` inside the `onChange` handler).
- **Senior-Level Insight:** Controlled components bind the user input field lifecycle directly to the React state loop, which requires updating state on every single stroke to reflect inputs correctly.

---

### Question 2: Composition and Element Reference Stability
- **Difficulty:** Medium
- **Answer:** `Parent` and `ChildB` will re-render. `ChildA` will **not** re-render.
- **Explanation:**
  - Clicking the button updates the `Parent` component's state (`count`), causing a re-render of `Parent`.
  - During this re-render, React executes the JSX inside `Parent`. `<ChildB />` is translated to `React.createElement(ChildB, null)`, which creates a new element reference. Because the element reference is new, React re-renders `ChildB`.
  - In contrast, `ChildA` is passed as `children`. The reference to `children` was created in the parent scope (e.g., `App`), which did *not* re-render.
  - Since `children`'s React element object reference is identical to the previous render (same reference identity), React recognizes that this node has not changed and skips rendering `ChildA`.
- **Common Mistakes:** Assuming all children of a component re-render when the parent state updates, regardless of how they are passed.
- **Interviewer Follow-up:** "How can you optimize `ChildB` to prevent it from re-rendering when `Parent` state updates?" (Wrap `ChildB` in `React.memo`, or pass it as another composition slot).
- **Senior-Level Insight:** Component composition is not just a design pattern for clean APIs; it is a vital performance optimization strategy. By passing static elements as slots, you create localized render boundaries that limit re-render propagation without littering the code with `React.memo` or `useMemo`.

---

### Question 3: Optimized Dynamic Validation Architecture
- **Difficulty:** Senior
- **Answer:** 
  Using a single controlled state object at the parent level causes a complete re-render of all 50 inputs on every keystroke, leading to high scripting latency and noticeable lag.
  
  To solve this, decouple keystroke state from the parent validation state:
  1. Make each input field a **self-contained controlled component** that manages its own local state (or use uncontrolled inputs with refs).
  2. Debounce or throttle the propagation of validity status updates back to the parent component.
  3. Alternatively, implement a subscription model (e.g., via a lightweight context or state manager like Zustand) where inputs publish their validity state, and the banner subscribes only to the overall validation status (boolean), avoiding individual text renders.
- **Explanation:**
  - Let each input field determine its own validity locally. If a field changes state from valid to invalid (or vice versa), it notifies a parent callback `onValidityChange(id, isValid)`.
  - The parent component keeps a map of invalid input IDs: `const [invalidInputs, setInvalidInputs] = useState(new Set())`.
  - When `onValidityChange` is called, the parent updates the set. The parent only re-renders when the set size changes from `0` to `1` (showing the banner) or from `1` to `0` (hiding it).
  - This ensures that typing inside a valid input does *not* trigger parent re-renders or brother re-renders.
- **Common Mistakes:** Recommending `React.memo` on all input elements. While `React.memo` helps, if the parent state object changes reference on every keystroke (e.g., `{ input1: 'val', input2: '...' }`), memoization fails unless custom comparison functions are written, which adds complexity and CPU overhead.
- **Interviewer Follow-ups:** "How would a state management store like Zustand solve this?" (Zustand uses selector-based subscriptions, letting the banner subscribe to `state => state.hasErrors` so it only re-renders when the aggregate boolean changes).
- **Senior-Level Insight:** In high-density UI designs, always isolate volatile states (like text input keystrokes) from global layouts. Letting keystrokes bubble up to a global tree root triggers costly layout calculations and is the number one cause of input stuttering on low-end devices.

---

### Question 4 (Controlled vs. Uncontrolled Forms)
Explain how to prevent performance bottlenecks in large forms with dynamic validation hooks.
**Answer:** Use uncontrolled inputs wrapped in ref closures, and trigger form validation during the `onSubmit` event or during debounced transition periods.
