# Practical: UI & Custom Hooks Testing

## Problem Title: Custom renderHook & act Simulation Engine

## Difficulty: Senior

## Skills Tested
- React Hook execution lifecycle mechanics
- State modification capturing & re-rendering simulation
- Reference updates and mutable object bindings
- Test utility harness development

## Problem Statement
In testing setups, utilities like `renderHook` from `@testing-library/react` are used to test hooks. 
However, understanding how `renderHook` captures state changes, updates mutable references (`result.current`), and forces re-renders during state mutations (via `act`) is essential for a senior developer.

Implement a simplified `renderHook` simulator function `simulateRenderHook(hookFactory)` that:
1.  Executes the hook factory function inside a simulated rendering shell.
2.  Returns a `result` object containing a `.current` property that always holds the latest return values of the hook.
3.  Exposes an `act` function. Any callback executed inside `act` must trigger a simulated re-render, updating `result.current` with the new values.

## Starter Code
```javascript
/**
 * Simplified renderHook simulator.
 */
export function simulateRenderHook(hookFactory) {
  const result = { current: null };

  const act = (callback) => {
    // Implement
  };

  // Implement initial render

  return {
    result,
    act
  };
}
```

## Requirements
- The initial return values of the hook must be available on `result.current` on mount.
- Modifying state variables inside the hook (via callback methods returned by the hook) must update `result.current` only when wrapped in `act()`.
- **Reference Integrity**: The `result` object reference returned by `simulateRenderHook` must remain identical; only the `.current` property updates.

## Simulation Hook Example
We will test our simulator with a custom hook mock:
```javascript
function useMockCounter(initial = 0) {
  let count = initial;
  const increment = () => {
    count++;
  };
  // To simulate hook state, our factory function must be run again to return the updated count.
  return { count, increment };
}
```
*Note: In standard React, changing state triggers a component re-render, executing the function body again. In our simulator, the `act` callback runs the action, and then the simulator re-runs `hookFactory()` to capture and return the new values on `result.current`.*

## Expected Approach
We create an internal function `render()`.
Inside `render()`, we call `result.current = hookFactory()`.
We execute `render()` initially.
We define `act(callback)`:
1. Execute the callback.
2. Call `render()` again to capture updates.
This matches the core concept of React's render loop where state mutations trigger re-evaluation of component functions.

## Solution
```javascript
/**
 * Simplified simulator for testing custom hooks.
 * @param {Function} hookFactory - Callback that executes the hook
 * @returns {{ result: { current: any }, act: Function }}
 */
export function simulateRenderHook(hookFactory) {
  const result = { current: null };

  // Re-evaluates the hook and updates the mutable result pointer
  const rerender = () => {
    try {
      result.current = hookFactory();
    } catch (err) {
      console.error("simulateRenderHook: Error rendering hook", err);
      throw err;
    }
  };

  // 1. Initial render on mount
  rerender();

  // 2. Action wrapper to capture state changes and trigger re-renders
  const act = (callback) => {
    if (typeof callback !== "function") {
      throw new Error("act: callback must be a function");
    }

    try {
      // Execute the state-mutating action
      callback();
    } finally {
      // Force a simulated re-render to update return values
      rerender();
    }
  };

  return {
    result,
    act
  };
}
```

## Explanation
- **Mutable Reference Pointer**: By storing results on `result.current` rather than returning a static value, we maintain reference stability across renders, matching the standard RTL signature.
- **Rerender Loop**: Calling `rerender()` inside `finally` guarantees that the hook is re-evaluated after actions execute, capturing updated values even if callbacks throw errors.

## Time Complexity
- **Rerender**: $O(H)$ where $H$ is the complexity of the hook logic.

## Space Complexity
- **Storage**: $O(1)$ constant space.

---

## Interviewer Follow-ups
1. "In real React, how does `act` actually communicate with the reconciler to flush updates?"
   (React's `act` hooks directly into the Fiber scheduler. It intercepts task schedules, flushes microtasks synchronously, and runs virtual DOM diffs immediately before yielding control, ensuring all state changes are committed before the test makes assertions).
2. "How would you expand this simulator to support hook input parameters?"
   (Expose a `rerender(newProps)` method returned by the simulator, allowing consumers to pass new prop values and re-evaluate the hook with the updated inputs).

---

## Senior-Level Discussion
Writing custom testing fixtures demonstrates a deep understanding of runtime execution contexts.
By simulating hook execution cycles, you show that you understand that React hooks are not magic, but are simply function executions coordinated by a state-tracking engine.
This knowledge is critical when debugging test framework integrations or writing testing drivers for custom state management engines.

---

### Extra Practice: Testing async UI states & Loading
**Task:** Implement an RTL testing helper that waits for loading states to vanish from DOM structures:
```javascript
export async function waitForElementToBeRemoved(queryFn, timeout = 1000) {
  const startTime = Date.now();
  while (queryFn()) {
    if (Date.now() - startTime > timeout) throw new Error("Timeout waiting for removal");
    await new Promise(resolve => setTimeout(resolve, 50));
  }
}
```
