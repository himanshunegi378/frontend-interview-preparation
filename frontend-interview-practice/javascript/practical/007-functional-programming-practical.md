# Practical: Debounce & Throttle with Advanced Options

## Problem Title: Complete Rate-Limiting Engine (Debounce and Throttle)

## Difficulty: Senior

## Skills Tested
- Closure Scoping and Scheduling
- Timer management (`setTimeout` lifecycle)
- Rest/Spread and dynamic context binding (`this`)
- Complex state flags (leading, trailing, cancellation)

## Problem Statement
Implement two high-performance rate-limiting utility factories:
1. `debounce(fn, delay, options)`: Returns a debounced function. Options must support:
   - `leading` (boolean): Run the target function on the leading edge of the timeout.
   - `trailing` (boolean): Run the target function on the trailing edge of the timeout.
   - `cancel()`: A method on the returned function to cancel pending executions.
2. `throttle(fn, interval, options)`: Returns a throttled function. Options must support:
   - `leading` (boolean): Run the target function on the leading edge of the interval.
   - `trailing` (boolean): Run the target function on the trailing edge of the interval.
   - `cancel()`: A method on the returned function to cancel pending executions.

## Starter Code
```javascript
export function debounce(fn, delay, options = { leading: false, trailing: true }) {
  // Implement
  function debounced(...args) {}
  debounced.cancel = () => {};
  return debounced;
}

export function throttle(fn, interval, options = { leading: true, trailing: true }) {
  // Implement
  function throttled(...args) {}
  throttled.cancel = () => {};
  return throttled;
}
```

## Requirements
- Maintain proper execution context (`this`) and forward all arguments correctly.
- If both `leading` and `trailing` are set to `true` in `debounce`, the function should execute on both edges if called multiple times within the delay.
- The `cancel()` method must clear all active timers and reset internal state to prevent memory leaks.

## Edge Cases
- **Immediate cancels**: Invoking the returned function and immediately calling `.cancel()` should prevent any executions from firing.
- **Double leading fires**: Rapidly calling a leading-edge function should only fire once at the start, ignoring subsequent calls until the window closes.
- **Null/negative delays**: Delays $\le 0$ must execute the function synchronously.

## Expected Approach
For `debounce`: Maintain a `timerId` and `lastArgs`/`lastThis` in the closure. On call, if `leading` is true and no timer exists, execute immediately. Otherwise, reset the timer. On timer expiration, if `trailing` is true, execute with the most recent arguments.

For `throttle`: Maintain `timerId`, `lastArgs`, `lastThis`, and `lastExecTime`. If the current time exceeds the last execution time plus the interval, and `leading` is true, execute immediately. Otherwise, schedule a timer to run the trailing edge callback when the interval expires.

## Solution
```javascript
export function debounce(fn, delay, { leading = false, trailing = true } = {}) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;
  let invokeImmediate = false;

  if (delay <= 0) {
    return function(...args) {
      return fn.apply(this, args);
    };
  }

  function debounced(...args) {
    lastArgs = args;
    lastThis = this;

    const isInvokingImmediate = leading && !timerId;

    if (timerId) {
      clearTimeout(timerId);
    }

    timerId = setTimeout(() => {
      const argsToUse = lastArgs;
      const thisToUse = lastThis;
      timerId = null;
      lastArgs = null;
      lastThis = null;

      if (trailing && !isInvokingImmediate && argsToUse) {
        fn.apply(thisToUse, argsToUse);
      }
    }, delay);

    if (isInvokingImmediate) {
      fn.apply(lastThis, lastArgs);
      lastArgs = null;
      lastThis = null;
    }
  }

  debounced.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = null;
    lastArgs = null;
    lastThis = null;
  };

  return debounced;
}

export function throttle(fn, interval, { leading = true, trailing = true } = {}) {
  let timerId = null;
  let lastArgs = null;
  let lastThis = null;
  let lastExecTime = 0;

  if (interval <= 0) {
    return function(...args) {
      return fn.apply(this, args);
    };
  }

  const invokeTrailing = () => {
    lastExecTime = leading ? Date.now() : 0;
    timerId = null;
    const argsToUse = lastArgs;
    const thisToUse = lastThis;
    lastArgs = null;
    lastThis = null;

    if (trailing && argsToUse) {
      fn.apply(thisToUse, argsToUse);
    }
  };

  function throttled(...args) {
    lastArgs = args;
    lastThis = this;
    const now = Date.now();

    if (lastExecTime === 0 && !leading) {
      lastExecTime = now;
    }

    const remainingTime = interval - (now - lastExecTime);

    if (remainingTime <= 0 || remainingTime > interval) {
      if (timerId) {
        clearTimeout(timerId);
        timerId = null;
      }
      lastExecTime = now;
      const argsToUse = lastArgs;
      const thisToUse = lastThis;
      lastArgs = null;
      lastThis = null;
      fn.apply(thisToUse, argsToUse);
    } else if (!timerId && trailing) {
      timerId = setTimeout(invokeTrailing, remainingTime);
    }
  }

  throttled.cancel = () => {
    if (timerId) {
      clearTimeout(timerId);
      timerId = null;
    }
    lastArgs = null;
    lastThis = null;
    lastExecTime = 0;
  };

  return throttled;
}
```

## Explanation
- **Debounce Mechanics**: When called, we clear any pending timer. If `leading` is true and no timer exists, it fires immediately. The trailing timer is scheduled to execute the function at the end of the delay window, provided `trailing` is enabled.
- **Throttle Mechanics**: We track `lastExecTime`. If the interval has passed, we execute immediately. If not, and `trailing` is enabled, we schedule a timer for the remaining time to execute the trailing call, ensuring that intermediate clicks are throttled and the final state is captured.

## Time Complexity
- Construction (wrapping): $O(1)$.
- Invocations: $O(1)$ operations.
- Cancellations: $O(1)$.

## Space Complexity
- $O(1)$ auxiliary space, retaining references to arguments and timer IDs.

## Interviewer Follow-ups
1. "What happens if a throttled function executes trailing calls while the target component unmounts?" (It causes a React state-update on an unmounted component warning or memory leak. We should register a `.cancel()` invocation in the component's cleanup function).
2. "How does `requestAnimationFrame` compare to `throttle` with a 16.67ms interval?" (rAF aligns executions directly with the browser's refresh rate, making it more efficient for animations, whereas setTimeout is subject to event loop scheduling delay).

## Senior-Level Discussion
In high-scale UIs, debounces and throttles must be carefully managed. When used inside React components, they must be wrapped in `useCallback` or `useRef` to prevent re-creation on every render. Additionally, always invoke the `.cancel()` method inside the component's cleanup Hook (`useEffect`) to release timer handlers from memory.

---

### Extra Practice: Memoization & Higher-Order Functions
**Task:** Implement a generic memoization utility that supports custom key generation for multi-argument functions:
```javascript
export function memoize(fn, keyHasher = (...args) => JSON.stringify(args)) {
  const cache = new Map();
  return function(...args) {
    const key = keyHasher(...args);
    if (cache.has(key)) return cache.get(key);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}
```
