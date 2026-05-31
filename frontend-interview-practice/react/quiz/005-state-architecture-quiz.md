# Quiz: React State Management Architecture

## Questions

### Question 1 (Medium - Context Consumer Re-renders)
Given the Context setup below, when `setCount` is called to increment the counter, does the `ThemeDisplay` component re-render?
```javascript
import React, { createContext, useState, useContext } from "react";

const AppContext = createContext();

export function App() {
  const [count, setCount] = useState(0);
  const [theme, setTheme] = useState("dark");

  return (
    <AppContext.Provider value={{ count, setCount, theme, setTheme }}>
      <CounterTrigger />
      <ThemeDisplay />
    </AppContext.Provider>
  );
}

function CounterTrigger() {
  const { setCount } = useContext(AppContext);
  return <button onClick={() => setCount(c => c + 1)}>Increment</button>;
}

function ThemeDisplay() {
  const { theme } = useContext(AppContext);
  return <div>Theme: {theme}</div>;
}
```

---

### Question 2 (Hard - Zustand Selector Optimization)
Consider this Zustand store. Which component(s) re-render when `updateUserEmail("new@email.com")` is executed, and why?
```javascript
import { create } from "zustand";

const useStore = create((set) => ({
  user: { name: "Alice", email: "alice@email.com" },
  theme: "dark",
  updateUserEmail: (email) => set((state) => ({ user: { ...state.user, email } }))
}));

// Component A
function ComponentA() {
  const { theme } = useStore();
  return <div>{theme}</div>;
}

// Component B
function ComponentB() {
  const theme = useStore((state) => state.theme);
  return <div>{theme}</div>;
}
```

---

### Question 3 (Senior - StaleTime vs. CacheTime)
In TanStack Query (React Query), what happens to a cached API query response when `staleTime` is set to `5000` (5s) and `cacheTime` (or `gcTime`) is set to `10000` (10s)?
Trace the cache state when the component unmounts and remounts after 7 seconds.

---

## Answer Key & Explanations

### Question 1: Context Value Object Reference Updates
- **Difficulty:** Medium
- **Answer:** Yes, `ThemeDisplay` re-renders.
- **Explanation:**
  - When `setCount` updates the state, the `App` component re-renders.
  - A new object reference is passed to the Provider's `value` attribute: `{{ count, setCount, theme, setTheme }}`.
  - Because the context value object has a new reference, React's Context API marks **all** active consumers of `AppContext` as needing updates.
  - Even though `ThemeDisplay` only reads `theme` (which did not change), it consumes `AppContext`, so it is forced to re-render.
- **Common Mistakes:** Assuming Context behaves like custom selector stores that automatically filter out unused property changes.
- **Fix:** Split into `CounterContext` and `ThemeContext` providers, or wrap `ThemeDisplay` in a memoized component wrapper.
- **Senior-Level Insight:** Context API is not optimized for high-frequency state updates. For global states that update frequently, use a pub/sub-based store (like Zustand) to prevent render bottlenecks.

---

### Question 2: Object Destructuring vs. Selective Store Bindings
- **Difficulty:** Hard
- **Answer:** `ComponentA` re-renders; `ComponentB` does **not** re-render.
- **Explanation:**
  - **`ComponentA`**: Calls `useStore()` without a selector function. This returns the entire store object state.
    - When `updateUserEmail` is executed, Zustand updates the state. The store object reference changes.
    - Since no selector was provided, Zustand assumes the component depends on the entire store and triggers a re-render.
  - **`ComponentB`**: Calls `useStore((state) => state.theme)`. This uses a **selector** to bind only to the `theme` property.
    - Zustand compares the returned value of the selector before and after the state change using strict equality (`===`).
    - Since `theme` remains `"dark"`, the value is identical, and Zustand skips the re-render.
- **Common Mistakes:** Destructuring the store hook directly without selectors (e.g. `const { theme } = useStore()`), which disables re-render optimizations.
- **Senior-Level Insight:** Always use selector functions (or Zustand's `useShallow` hook for returning objects) to prevent components from re-rendering on unrelated store updates.

---

### Question 3: TanStack Query Cache State Lifecycle
- **Difficulty:** Senior
- **Answer:** The query resolves a cache hit immediately on mount, but triggers a background refetch in the background.
- **Explanation:**
  - Let's trace the state steps chronologically:
    1. **Mount**: Component fetches data. `staleTime` starts. Data remains "fresh" for 5 seconds.
    2. **Unmount (at T = 0)**: The component unmounts. The query has zero active observers.
    3. **gcTime (CacheTime) Start**: Since there are no observers, the garbage collection timer starts (set to 10s).
    4. **Remount (at T = 7s)**:
       - Since 7 seconds is less than the `gcTime` (10s), the cached data is still in memory and is resolved to the component immediately (fast load).
       - However, since 7 seconds is greater than the `staleTime` (5s), the data is marked as "stale".
       - This stale status triggers a **background refetch** to fetch fresh data from the API and update the UI once resolved.
  - If the remount happened after 12 seconds, the cache would have been cleared from memory, and the component would display a loading indicator while fetching data from scratch.
- **Common Mistakes:** Thinking `staleTime` and `cacheTime` are the same, or assuming stale data is not returned to the component on mount.
- **Senior-Level Insight:** `staleTime` manages when to refetch, and `cacheTime` (or `gcTime` in v5) manages when to delete data from the cache. Adjusting these values helps balance network traffic and loading speeds.
