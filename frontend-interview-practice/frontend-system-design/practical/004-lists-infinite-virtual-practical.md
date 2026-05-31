# Practical: Infinite Scroll Hook

## Problem Title: Intersection Observer Infinite Scroll Hook

## Difficulty: Senior

## Skills Tested
- React Custom Hooks Design
- Intersection Observer API usage
- Ref bindings and element tracking
- Asynchronous trigger guards & state management

## Problem Statement
In web feeds, pagination must occur automatically as the user scrolls. Listening to raw scroll events blocks the main thread. 

Implement a custom React hook `useInfiniteScroll(onLoadMore, options)` that uses the browser's `IntersectionObserver` API to monitor a "sentinel" DOM element and trigger a load-more callback.

```javascript
// Usage Example:
function Feed() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const loadMore = async () => {
    setLoading(true);
    const newItems = await fetchPage();
    setItems(prev => [...prev, ...newItems]);
    setLoading(false);
  };

  const sentinelRef = useInfiniteScroll(loadMore, {
    enabled: !loading && hasMore,
    threshold: 0.5
  });

  return (
    <div>
      {items.map(item => <Card key={item.id} data={item} />)}
      {hasMore && <div ref={sentinelRef}>Loading more items...</div>}
    </div>
  );
}
```

## Starter Code
```javascript
import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to trigger actions when a sentinel element enters the viewport.
 */
export function useInfiniteScroll(onLoadMore, options = {}) {
  const { enabled = true, threshold = 0, rootMargin = "0px" } = options;
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Implement hook
}
```

## Requirements
- The hook must return a React ref function callback that can be bound to any DOM node (the sentinel).
- An active `IntersectionObserver` must monitor the sentinel. When the sentinel crosses the `threshold` visibility, trigger `onLoadMore()`.
- Disconnect the observer when the hook unmounts, or when `enabled` changes to false.
- Ensure that if the sentinel node changes (e.g. mounts/unmounts), the observer unbinds from the old node and binds to the new node successfully.

## Edge Cases
- Rapidly switching the `enabled` prop between true and false.
- The observer triggering when the page first loads (if the sentinel starts visible on the screen, this is expected, but must be guarded by `enabled`).
- Passing dynamic functions to `onLoadMore` (avoid stale closure issues by preserving callback stability).

## Expected Approach
We return a **callback ref** instead of a plain ref object. A callback ref is a function `ref => {...}` that React calls with the DOM element when it mounts, and with `null` when it unmounts. This is more reliable for dynamic sentinel nodes.
Inside the callback ref:
1. Save the node reference in `sentinelRef.current`.
2. If an observer exists, disconnect it.
3. If the node is `null` or `enabled` is false, exit.
4. Create a new `IntersectionObserver`:
   ```javascript
   observerRef.current = new IntersectionObserver(([entry]) => {
     if (entry.isIntersecting) {
       onLoadMore();
     }
   }, { threshold, rootMargin });
   ```
5. Call `observerRef.current.observe(node)`.

To prevent stale closures of `onLoadMore`, save the callback inside a mutable ref: `const callbackRef = useRef(onLoadMore); callbackRef.current = onLoadMore;`.

## Solution
```javascript
import { useEffect, useRef, useCallback } from "react";

/**
 * Custom hook to coordinate infinite scrolling.
 * @param {Function} onLoadMore - Callback when sentinel enters viewport
 * @param {Object} options
 * @param {boolean} [options.enabled] - Toggle observer activity
 * @param {number} [options.threshold] - Trigger threshold ratio (0.0 to 1.0)
 * @param {string} [options.rootMargin] - Margin bounding box offset
 * @returns {Function} Callback ref to attach to the sentinel element
 */
export function useInfiniteScroll(onLoadMore, options = {}) {
  const { enabled = true, threshold = 0.1, rootMargin = "0px" } = options;
  
  const observerRef = useRef(null);
  const sentinelRef = useRef(null);

  // Preserve the latest callback reference to prevent stale closure loops
  const callbackRef = useRef(onLoadMore);
  useEffect(() => {
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  // Cleanup helper
  const disconnect = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // React callback ref is executed whenever the element mounts or unmounts
  const refCallback = useCallback((node) => {
    disconnect(); // Unbind previous observer
    sentinelRef.current = node;

    if (!node || !enabled) return;

    // Initialize IntersectionObserver
    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && callbackRef.current) {
          callbackRef.current();
        }
      },
      { threshold, rootMargin }
    );

    // Start observing DOM node
    observerRef.current.observe(node);
  }, [enabled, threshold, rootMargin, disconnect]);

  // Clean up observer on unmount
  useEffect(() => {
    return () => disconnect();
  }, [disconnect]);

  return refCallback;
}
```

## Explanation
- **Callback Ref Pattern**: Using a function ref callback ensures that the observer reacts instantly when elements mount or unmount in the DOM, avoiding common bugs where plain ref objects are missing on initial render.
- **Stale Closure Mitigation**: Storing `onLoadMore` in `callbackRef` ensures that the observer's callback always executes the latest closure scope without needing to rebuild the entire observer instance when state variables change.
- **Resource Cleanup**: Disconnecting the observer on unmount and during key property changes prevents memory leaks and trailing events.

## Time Complexity
- **Observer Binding**: $O(1)$ constant time.
- **Intersection Checks**: Managed by the browser layout engine in $O(1)$ relative to the JavaScript thread.

## Space Complexity
- **Memory Overhead**: $O(1)$ constant memory overhead to hold the ref objects and observer instance.

---

## Interviewer Follow-ups
1. "Why use `rootMargin: '200px'` instead of a default margin?"
   (Setting a positive `rootMargin` like `200px` tells the observer to trigger the intersection event 200px *before* the sentinel enters the screen. This fetches the next page in advance, giving the user a seamless scroll experience without waiting at a loading spinner).
2. "How would you test this hook in a unit testing setup using Jest?"
   (Since Jest runs in JSDOM which lacks layout engines, mock the global `IntersectionObserver` class: mock `observe`, `disconnect`, and write a helper that triggers the mock observer's callback manually during test runs).

---

## Senior-Level Discussion
Writing reusable React hooks is a core skill for frontend architects.
By wrapping the native `IntersectionObserver` API in a clean callback ref lifecycle, you isolate DOM listening concerns from card layout implementations.
This ensures high scroll performance, keeps the code dry, and prevents memory leaks in high-frequency rendering contexts.

---

### Extra Practice: Virtualized List layout math
**Task:** Calculate the start index, end index, and transform offsets for a virtual list scrolling at viewport offset `scrollTop`:
```javascript
export function calculateVirtualRange({ scrollTop, viewportHeight, itemHeight, totalItems }) {
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight));
  const endIndex = Math.min(totalItems - 1, Math.floor((scrollTop + viewportHeight) / itemHeight));
  const offsetTop = startIndex * itemHeight;
  return { startIndex, endIndex, offsetTop };
}
```
