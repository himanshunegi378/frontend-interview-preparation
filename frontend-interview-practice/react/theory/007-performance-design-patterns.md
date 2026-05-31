# React Performance, Memoization, & Design Patterns

## Why It Matters
In enterprise-scale React applications, performance issues are rarely caused by slow JS execution, but rather by rendering overhead—excessive tree diffing, layout thrashing, and bloated DOM sizes. Senior engineers must know how to trace re-renders using the React Profiler, optimize component structures using memoization patterns, design keyboard-accessible components (a11y), and virtualize long lists to prevent memory bloat and input stutters.

---

## Core Concepts & Mental Models

### 1. The Cost of Rendering & Re-rendering
Whenever a component's state or props change, React runs the component function again.
*   **Virtual DOM Diffing**: React compares the returned element tree with the previous one. While Javascript is fast, traversing a large tree of elements and comparing props has CPU overhead.
*   **DOM Updates**: If changes are found, React commits them to the DOM, triggering browser layout/paint cycles, which are very expensive.
*   **The Propagation Default**: By default, if a parent component renders, all of its children render recursively, even if their props did not change.

### 2. Memoization: Tools & Tradeoffs
React provides three main primitives for memoization:
1.  **`React.memo`**: A Higher-Order Component that wraps a functional component. It performs a shallow comparison of props. If props haven't changed, React skips rendering the component.
2.  **`useMemo`**: Memoizes the *result* of a calculation across renders. Only re-runs when dependency references change.
3.  **`useCallback`**: Memoizes the *function reference* itself. Essential for passing callback props to child components wrapped in `React.memo`, preventing new function allocations from breaking child memoization.

```
Prop Reference Check in Child (React.memo):
[ Parent Renders ] ──> Creates new callback reference: onClick = () => {}
                         │
                         ▼
[ Child Check ] ───────> Compare old onClick !== new onClick (Identity changed!)
                         │
                         ▼
[ Child Re-renders ] <── (Memoization Broken)
```
*   **Use `useCallback` on the callback to preserve reference stability across renders.*

### 3. List Virtualization (Windowing)
When displaying thousands of list items (e.g., chat histories, database logs), rendering all DOM nodes results in high memory utilization and layout performance degradation.
*   **Virtualization**: Only renders the elements currently visible in the user's viewport (plus a small buffer). As the user scrolls, the elements outside the window are unmounted, and new elements are mounted in place, maintaining a constant DOM count.

```
Virtualized List Viewport:
┌─────────────────────────┐  ◄── Window Top
│   [ Visible Item 1 ]    │
│   [ Visible Item 2 ]    │
│   [ Visible Item 3 ]    │
└─────────────────────────┘  ◄── Window Bottom
(Items above and below are NOT rendered in the DOM)
```

### 4. Accessibility (a11y) in React
Senior-level React components must be fully accessible:
*   **Semantic Elements**: Avoid replacing standard buttons and links with `<div onClick={...}>`. If a div must act as a button, add `role="button"`, `tabIndex={0}`, and handle the `Enter`/`Space` key presses.
*   **Focus Management**: Use `useRef` to focus error elements or modal containers on open to ensure keyboard users can navigate.
*   **Portals**: Render modals or overlays using `createPortal` to keep them clean of parent layout constraints while maintaining React event propagation.

---

## Real-World Case Study / Examples

### Virtualizing a Massive Logs Viewer
A dashboard rendering 10,000 real-time service logs crashed client browsers. 

**The Solution**: Instead of mapping the logs directly, wrap the container in a virtualized list container. By checking the container's `scrollTop` and calculating the start and end indexes, only 20 logs are rendered at any given time:

```javascript
// Conceptual Virtualizer Math
const startIdx = Math.floor(scrollTop / itemHeight);
const endIdx = Math.min(items.length - 1, Math.floor((scrollTop + containerHeight) / itemHeight));
const visibleItems = items.slice(startIdx, endIdx + 1);
```

---

## Common Interview Traps

### The "Over-Memoization" Trap
*   **The Trap**: Recommending that every component be wrapped in `React.memo` and every function in `useCallback`.
*   **The Reality**: Memoization is not free.
    1.  `React.memo` performs shallow comparisons of props on every render. If props change on every render, you are paying the cost of the comparison *plus* the cost of the render.
    2.  `useMemo` and `useCallback` require allocating dependency arrays and checking them on every render, adding minor overhead.
*   **Rule of Thumb**: Only memoize components that render frequently with identical props, or when child components depend on reference stability to prevent heavy renders.

---

## Junior vs. Senior View

*   **Junior View**: "Optimization means wrapping everything in `useMemo` and `useCallback` to prevent renders. If a list is slow, add a loading spinner or pagination."
*   **Senior View**: "Optimize first by structuring state correctly—moving state down to localized boundaries or using component composition. Apply memoization strategically by ensuring prop reference stability. Leverage windowing libraries for massive datasets, and design components using strict access standards (WAI-ARIA) and semantic markup to build accessible, high-performance UIs."

---

## Related Interview Questions
1. "Explain how `React.memo`'s second argument (`arePropsEqual`) can be used to customize comparison logic."
2. "Why does `useCallback` not prevent a component's instantiation, and what overhead does it introduce?"
3. "How would you construct a keyboard-accessible modal dialog using React Refs and Portals?"
4. "What are the common causes of memory leaks in React custom hooks, and how do you prevent them?"

---

## Accessibility, Component Testing, & Anti-patterns in React
- **React Accessibility (a11y)**: Focus management (using refs), screen reader text (using aria-live or visual hide elements), and ensuring HTML element semantics.
- **Testing React Components**: Unit/integration tests verify component render bounds, prop changes, user interactions (via user-event), and API requests (via MSW mocks).
- **Anti-patterns**: Synchronizing props to state directly (causes state mismatch issues), missing keys in arrays, and creating nested helper components inline (forces cleanups and loses DOM state).
