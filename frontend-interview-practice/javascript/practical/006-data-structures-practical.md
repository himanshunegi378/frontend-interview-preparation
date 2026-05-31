# Practical: Advanced Event Emitter with Wildcards

## Problem Title: Namespace & Wildcard Event Emitter

## Difficulty: Senior

## Skills Tested
- Map/Set collection management
- String splitting and regex token matching
- Subscription lifecycle structures (preventing leaks)
- Argument forwarding

## Problem Statement
Implement a custom Event Emitter class `WildcardEventEmitter` that supports namespaces and wildcard subscribers using `Map` and `Set` collections.

The emitter must support:
1. `on(eventPattern, callback)`: Subscribe a callback to an event pattern. Returns an unsubscribe function.
2. `emit(eventName, ...args)`: Trigger all callbacks that match the event name.
3. `off(eventPattern, callback)`: Manually remove a subscriber.

### Namespace & Wildcard Rules:
- A dot-separated string defines namespaces (e.g., `user.login.success`).
- The wildcard `*` matches a single namespace block. For example, `user.*.success` matches `user.login.success` and `user.logout.success`, but not `user.login.ui.success`.
- The double wildcard `**` matches any number of trailing namespace blocks. For example, `user.**` matches `user.login`, `user.login.success`, and `user.settings.update`.

## Starter Code
```javascript
export class WildcardEventEmitter {
  // Implement internal storage constructor
  constructor() {
    // Implement
  }

  on(eventPattern, callback) {
    // Implement
    return () => {}; // Unsubscribe function
  }

  emit(eventName, ...args) {
    // Implement
  }

  off(eventPattern, callback) {
    // Implement
  }
}
```

## Requirements
- Optimize subscriber lookups: do not run full regex iterations over all registered patterns if an exact match exists.
- Ensure that the same callback function cannot be registered to the same pattern multiple times (use `Set` to enforce uniqueness).
- Unsubscribing must remove empty sets/maps from internal storage to prevent memory leaks.

## Edge Cases
- **No subscribers**: Emitting to an event with no subscribers should fail silently without throwing errors.
- **Double unsubscribes**: Calling the unsubscribe function multiple times should be safe.

## Expected Approach
Maintain a `Map` where the key is the event pattern string and the value is a `Set` of callback functions.
To match wildcard events during an `emit`, filter the keys of the Map. Convert the registered patterns into regex matching rules:
- Escape dots: `.` -> `\.`.
- Single wildcard: `*` -> `[^.]+`.
- Double wildcard: `**` -> `.*`.
Test the incoming `eventName` against these regex patterns and trigger matching callback sets.

## Solution
```javascript
export class WildcardEventEmitter {
  constructor() {
    // Map where Key is eventPattern (string), Value is Set of callbacks
    this._listeners = new Map();
  }

  on(eventPattern, callback) {
    if (typeof callback !== "function") {
      throw new TypeError("Callback must be a function");
    }

    if (!this._listeners.has(eventPattern)) {
      this._listeners.set(eventPattern, new Set());
    }

    const callbacks = this._listeners.get(eventPattern);
    callbacks.add(callback);

    // Return self-contained unsubscribe handler
    return () => {
      this.off(eventPattern, callback);
    };
  }

  off(eventPattern, callback) {
    if (!this._listeners.has(eventPattern)) return;

    const callbacks = this._listeners.get(eventPattern);
    callbacks.delete(callback);

    // Clean up empty collections from memory to prevent leaks
    if (callbacks.size === 0) {
      this._listeners.delete(eventPattern);
    }
  }

  emit(eventName, ...args) {
    const activeCallbacks = new Set();

    // 1. Optimization: check exact match first
    if (this._listeners.has(eventName)) {
      this._listeners.get(eventName).forEach((cb) => activeCallbacks.add(cb));
    }

    // 2. Scan patterns for wildcard matches
    for (const [pattern, callbacks] of this._listeners.entries()) {
      // Skip exact match as it was handled above
      if (pattern === eventName) continue;

      if (this._matchPattern(pattern, eventName)) {
        callbacks.forEach((cb) => activeCallbacks.add(cb));
      }
    }

    // 3. Execute all matching callbacks safely
    activeCallbacks.forEach((callback) => {
      try {
        callback(...args);
      } catch (err) {
        console.error(`Error in event listener for ${eventName}:`, err);
      }
    });
  }

  _matchPattern(pattern, eventName) {
    // Quick checks
    if (pattern === "*" || pattern === "**") return true;

    // Convert BEM/dot namespace pattern to RegExp
    // Escape standard regex characters, translate wildcards
    const escapedPattern = pattern
      .replace(/\./g, "\\.") // Escape namespace dots
      .replace(/\*/g, "__SINGLE_WILD__") // Temp placeholder
      .replace(/__SINGLE_WILD____SINGLE_WILD__/g, ".*") // double wildcard ** -> match anything
      .replace(/__SINGLE_WILD__/g, "[^.]+"); // single wildcard * -> match block without dots

    const regex = new RegExp(`^${escapedPattern}$`);
    return regex.test(eventName);
  }
}
```

## Explanation
- **Uniqueness via Set**: By using a `Set` for each event channel, the emitter prevents the same callback from being registered multiple times.
- **Wildcard Conversion**: The pattern matcher converts dot notation into matching regex segments, translating `*` to match everything except dots (`[^.]+`), and `**` to match any trailing characters (`.*`).
- **Resource Cleanup**: When a subscription is removed, we check if the callback Set is empty. If it is, we delete the key from our `_listeners` Map, ensuring we do not retain empty maps in memory.

## Time Complexity
- `on` & `off`: $O(1)$ lookup and insertions.
- `emit`: $O(K \times S)$ where $K$ is the number of active patterns in the Map and $S$ is the length of the string, due to regex scanning.

## Space Complexity
- $O(P \times C)$ where $P$ is the number of unique patterns and $C$ is the average number of callbacks per pattern.

## Interviewer Follow-ups
1. "What happens if a callback throws an error during emit execution?" (By wrapping each callback execution in a `try/catch` block, we ensure that one failing listener does not prevent other subscribers from executing).
2. "How would you implement this emitter using a tree (Trie) structure instead of a flat Map?" (A Trie structure stores namespaces as nested nodes: `user -> login -> success`. During emit, we traverse the trie path, matching branches for wildcards, which optimizes lookups to $O(D)$ where $D$ is the depth of the event namespace, removing the need to scan all registered patterns).

## Senior-Level Discussion
Event emitters are key to decoupling components in micro-frontends and large-scale applications. When implementing emitters in client frameworks like React or Vue, always unsubscribe inside lifecycle cleanups (`useEffect`) to prevent memory leaks from capturing component scopes in closures.

---

### Extra Practice: WeakMap & WeakSet Memory Management
**Task:** Implement a private properties metadata manager using `WeakMap` to avoid memory leaks:
```javascript
const metadata = new WeakMap();
export function setMetadata(obj, key, val) {
  if (!metadata.has(obj)) metadata.set(obj, {});
  metadata.get(obj)[key] = val;
}
export function getMetadata(obj, key) {
  return metadata.get(obj)?.[key];
}
```
