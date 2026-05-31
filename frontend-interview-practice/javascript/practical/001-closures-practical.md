# Practical: Closures & LRU Cache with TTL

## Problem Title: High-Performance LRU Cache with TTL and Event Callbacks

## Difficulty: Senior

## Skills Tested
- Closures for Private Scope Encapsulation
- Map Ordering Mechanics in JavaScript
- Timer Schedules and Memory Management (preventing leaks)
- Dynamic Callback Execution

## Problem Statement
Implement a closure-based LRU (Least Recently Used) cache factory `createLRUCache(options)` that returns a secure, encapsulated cache instance. The underlying data structures must remain completely inaccessible from the outside scope. 

The cache must support:
1. `get(key)`: Retrieve a value, updating its access recency.
2. `set(key, value)`: Add or update a key. If size exceeds capacity, evict the least recently used item.
3. `delete(key)`: Manually remove a key.
4. **TTL (Time to Live)**: Items should automatically expire after a specified time (milliseconds) and be evicted.
5. **Eviction Callback**: When an item is evicted (either due to capacity limit or TTL expiration), trigger an optional client callback `onEvict(key, value)`.

## Starter Code
```javascript
/**
 * @param {Object} options
 * @param {number} options.capacity - Maximum items allowed
 * @param {number} [options.ttl] - Expiry time in milliseconds (optional)
 * @param {Function} [options.onEvict] - Callback when an item is evicted: (key, value) => void
 */
export function createLRUCache(options) {
  const { capacity, ttl, onEvict } = options;
  
  // Implement encapsulated private state here
  
  return {
    get(key) {
      // Implement
    },
    set(key, value) {
      // Implement
    },
    delete(key) {
      // Implement
    },
    size() {
      // Implement
    }
  };
}
```

## Requirements
- The capacity constraint must maintain $O(1)$ operations for reads and writes.
- Expired items must not be returned on `get()` calls, and timers should clean up immediately to prevent memory leaks.
- All internal caches, lists, and timers must be private variables hidden within the closure.

## Edge Cases
- **Overwriting existing keys**: Re-setting an existing key must update the value, refresh the recency, and reset the TTL timer.
- **Immediate Expiry**: Setting a TTL of `0` or negative values should prevent storage.
- **Eviction loop**: Capacity eviction and TTL eviction must not double-fire the callback for the same key.

## Expected Approach
Leverage JavaScript's `Map` object, which remembers the insertion order of keys. By deleting and re-inserting a key during a read/write, we can keep the recency order updated at the tail of the map. Use `setTimeout` for TTL timers, and store these timer IDs in a private mapping inside the closure so they can be canceled when items are read, overwritten, or deleted.

## Solution
```javascript
export function createLRUCache({ capacity, ttl, onEvict }) {
  // Private variables encapsulated by closure
  const cache = new Map();
  const timers = new Map();

  const triggerEviction = (key, value, reason) => {
    // Clear any active timer
    if (timers.has(key)) {
      clearTimeout(timers.get(key));
      timers.delete(key);
    }
    cache.delete(key);
    if (onEvict) {
      onEvict(key, value, reason);
    }
  };

  return {
    get(key) {
      if (!cache.has(key)) return undefined;

      const record = cache.get(key);

      // Refresh order in Map: Delete and re-add
      cache.delete(key);
      cache.set(key, record);

      // Reset TTL timer if ttl option is set
      if (ttl) {
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
        }
        const timerId = setTimeout(() => {
          triggerEviction(key, record.value, "expired");
        }, ttl);
        timers.set(key, timerId);
      }

      return record.value;
    },

    set(key, value) {
      if (ttl <= 0) return;

      // Clean up previous entry if present
      if (cache.has(key)) {
        if (timers.has(key)) {
          clearTimeout(timers.get(key));
          timers.delete(key);
        }
        cache.delete(key);
      }

      // Check capacity bounds
      if (cache.size >= capacity) {
        // Evict the first key (least recently used)
        const lruKey = cache.keys().next().value;
        const lruRecord = cache.get(lruKey);
        triggerEviction(lruKey, lruRecord.value, "capacity");
      }

      const record = { value };
      cache.set(key, record);

      // Setup timer
      if (ttl) {
        const timerId = setTimeout(() => {
          triggerEviction(key, value, "expired");
        }, ttl);
        timers.set(key, timerId);
      }
    },

    delete(key) {
      if (!cache.has(key)) return false;
      const record = cache.get(key);
      triggerEviction(key, record.value, "manual");
      return true;
    },

    size() {
      return cache.size;
    }
  };
}
```

## Explanation
- **Encapsulation**: The maps `cache` and `timers` exist inside the outer factory function scope. Because of closures, the returned object methods maintain access to them, while outside code has zero direct access to modify the items or clear timers directly.
- **Recency Management**: Utilizing `Map.prototype.keys().next().value` retrieves the oldest inserted element in $O(1)$ time, which represents the LRU item because we re-insert elements upon usage.

## Time Complexity
- `get(key)`: $O(1)$ (Map hash lookup and deletions are constant-time operations).
- `set(key, value)`: $O(1)$.
- `delete(key)`: $O(1)$.

## Space Complexity
- $O(N)$ where $N$ is the capacity limit of the cache, storing cache records and active timer handles.

## Interviewer Follow-ups
1. "What happens to active timeout timers if we discard the LRU Cache instance itself?" (They remain running in the host event loop, causing a memory leak. We should implement a `clear()` method to teardown all active timeouts).
2. "How would you implement the same cache without relying on the ordering properties of JS ES6 `Map`?" (Use a combination of a hash `Object` and a doubly-linked list to maintain $O(1)$ recency updates).

## Senior-Level Discussion
In high-scale enterprise frontends, a client-side cache with TTL is often used to cache API payloads (e.g. search suggestions, dropdown selections). If timers are left hanging, they pin down the entire component tree, causing performance degradation. A robust implementation must supply clean lifecycle methods (`clear()` or `destroy()`) to allow the parent components to clean up cache resources when unmounted.

---

### Extra Practice: Scoping & Lexical Environment Execution
**Task:** Implement a custom block scope simulator `createBlockScope()` that allows declaring variables and resolves them using a scope chain array.
```javascript
export function createBlockScope(parentScope = null) {
  const bindings = new Map();
  return {
    declare(name, value) {
      if (bindings.has(name)) throw new Error("Variable already declared");
      bindings.set(name, value);
    },
    get(name) {
      if (bindings.has(name)) return bindings.get(name);
      if (parentScope) return parentScope.get(name);
      throw new ReferenceError(`${name} is not defined`);
    }
  };
}
```
