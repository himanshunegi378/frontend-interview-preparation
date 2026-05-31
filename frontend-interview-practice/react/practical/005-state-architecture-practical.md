# Practical: Custom State Store Builder (Zustand-like)

## Problem Title: Custom Pub/Sub Store Creator (`createStore`)

## Difficulty: Senior

## Skills Tested
- Publish-Subscribe (Observer) design pattern
- React custom hook bindings (using `useEffect` and `useState` / `useSyncExternalStore`)
- State selectors with reference equality comparisons
- Subscription lifecycle cleanups

## Problem Statement
Implement a custom state store builder `createStore(initializer)` that matches the core features of the Zustand library.

The builder must return a custom hook function `useStore(selector)` that components can invoke to consume state.

The returned store must support:
1. `getState()`: Returns the current state object.
2. `setState(nextStateOrFn)`: Updates the state (accepts a partial object or a updater function) and triggers subscriber updates.
3. `subscribe(listener)`: Subscribes a callback to state changes. Returns an unsubscribe function.
4. **Selector Bindings**: The custom hook `useStore(selector)` must accept an optional selector function. The component must only re-render if the selected value changes (using strict equality `===`).

## Starter Code
```javascript
import { useState, useEffect } from "react";

/**
 * Creates a reactive pub/sub store.
 * @param {Function} initializer - Initial state factory function: (set, get) => state
 */
export function createStore(initializer) {
  // Implement store core and React hook bindings
  
  function useStore(selector = (state) => state) {
    // Implement React Hook binding
  }

  return useStore;
}
```

## Requirements
- Maintain a list of active subscribers.
- If a component consumes the store using a selector, it must only re-render if the selected property changes.
- Ensure that `setState` merges updates shallowly (matching Zustand's default behavior).
- Returning the unsubscribe function from `subscribe` must clean up subscribers to prevent memory leaks.

## Edge Cases
- **Dynamic Updates**: If a selector returns an object reference (e.g. `(state) => ({ x: state.x })`), it will trigger re-renders on every update due to reference changes. This is expected, but ensure primitive return selectors do not trigger re-renders.
- **Immediate Reads**: The hook must return the initial state value immediately on mount.

## Expected Approach
In `createStore`, define the core store interface (`state`, `listeners` array, `getState`, `setState`, `subscribe`). Execute the `initializer` function, passing `setState` and `getState` to populate the initial state.
In `useStore(selector)`:
- Set up a React state variable that holds the currently selected slice of state.
- In `useEffect`, subscribe a listener to the store. In the listener callback:
  - Run the selector function on the new state.
  - Compare it with the previously selected slice.
  - If they differ, update the React state (forcing a re-render).
- Return the unsubscribe function from `useEffect`.

## Solution
```javascript
import { useState, useEffect, useCallback } from "react";

export function createStore(initializer) {
  let state;
  const listeners = new Set();

  const getState = () => state;

  const setState = (nextStateOrFn) => {
    const nextState = typeof nextStateOrFn === "function" ? nextStateOrFn(state) : nextStateOrFn;

    if (nextState !== state) {
      // Shallow merge updates
      state = Object.assign({}, state, nextState);
      
      // Notify all active subscribers
      listeners.forEach((listener) => listener(state));
    }
  };

  const subscribe = (listener) => {
    listeners.add(listener);
    
    // Return self-contained unsubscribe callback
    return () => {
      listeners.delete(listener);
    };
  };

  // Initialize store state
  const api = { getState, setState, subscribe };
  state = initializer(setState, getState, api);

  // React Hook Binding
  function useStore(selector = (s) => s) {
    const [, forceUpdate] = useState(0);
    
    // Track selected slice state using a mutable ref
    const selectedSliceRef = useRef(selector(state));
    const selectorRef = useRef(selector);
    
    // Keep selector function reference updated
    useEffect(() => {
      selectorRef.current = selector;
    });

    const triggerUpdate = useCallback(() => {
      forceUpdate((c) => c + 1);
    }, []);

    useEffect(() => {
      const handleStateChange = (nextState) => {
        try {
          const nextSlice = selectorRef.current(nextState);
          // Strict equality comparison
          if (selectedSliceRef.current !== nextSlice) {
            selectedSliceRef.current = nextSlice;
            triggerUpdate();
          }
        } catch (err) {
          console.error("Error in store selector:", err);
        }
      };

      // Subscribe to store updates
      const unsubscribe = subscribe(handleStateChange);
      
      return () => {
        unsubscribe();
      };
    }, [triggerUpdate]);

    return selectedSliceRef.current;
  }

  // Expose API methods on the hook function itself (matching Zustand structure)
  Object.assign(useStore, api);

  return useStore;
}
```

## Explanation
- **Publish-Subscribe**: The store maintains a `Set` of listener callbacks. When `setState` is called, it performs a shallow merge and triggers all listeners.
- **Selector-Driven Rendering**: In the custom hook, we run the selector on state changes and compare the output using strict equality (`!==`). If the values match, we skip updating the React state, preventing unnecessary component re-renders.
- **Memory Safety**: The hook returns `unsubscribe` from `useEffect`, removing the listener from the `listeners` Set when the component unmounts.

## Time Complexity
- `getState` / `setState`: $O(1)$ operations.
- Subscription notification: $O(L)$ where $L$ is the number of active listeners.

## Space Complexity
- $O(L)$ space to store active subscription listeners.

## Interviewer Follow-ups
1. "How would you implement this hook using React 18's native `useSyncExternalStore` Hook?" (Using `useSyncExternalStore` simplifies hook binding, automatically handling selectors, concurrent rendering, and edge cases: `return useSyncExternalStore(subscribe, () => selector(getState()), () => selector(getState()))`).
2. "Why does `setState` use `Object.assign`?" (To support shallow merges, allowing developers to pass partial state updates (e.g. `set({ loading: true })`) without losing other state properties).

## Senior-Level Discussion
Understanding publish-subscribe patterns is key to designing state management systems. Creating a lightweight store builder helps decouple state logic from React component rendering cycles, allowing state to be tested independently of DOM environments.
In production, rely on established libraries like Zustand, which are optimized to prevent memory leaks and handle complex concurrent rendering scenarios.

---

### Extra Practice: Redux Toolkit vs. Zustand tradeoffs
**Task:** Implement a Zustand store representing client global modal state and contrast its size/ DX overhead with Redux:
```javascript
import { create } from "zustand";
export const useModalStore = create((set) => ({
  isOpen: false,
  modalType: null,
  openModal: (type) => set({ isOpen: true, modalType: type }),
  closeModal: () => set({ isOpen: false, modalType: null })
}));
```
