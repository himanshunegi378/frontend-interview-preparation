# Practical: Deep Cloning Engine

## Problem Title: Complete Deep Clone with Reference Tracking

## Difficulty: Senior

## Skills Tested
- Reference Types vs Primitives
- Recursive traversal algorithms
- Circular Reference Detection using `WeakMap`
- Special JS constructor cloning (`Map`, `Set`, `Date`, `RegExp`)
- Prototype preservation

## Problem Statement
Write a high-performance deep clone function `deepClone(value)` that creates a complete, independent copy of a given value. The function must go beyond basic JSON serialization limits to support complex JavaScript objects.

Your implementation must support:
- Standard primitives and nested plain objects/arrays.
- Dynamic built-in objects: `Map`, `Set`, `Date`, `RegExp`.
- **Circular References**: Objects that reference themselves or create cyclical graphs must be resolved without triggering stack overflows, preserving original reference paths in the clone.
- Prototype link preservation.

## Starter Code
```javascript
/**
 * Deeply clones any given value.
 * @param {*} value - The input value to clone
 * @param {WeakMap} [cache] - Internal map for circular reference tracking
 * @returns {*} The deep cloned result
 */
export function deepClone(value, cache = new WeakMap()) {
  // Implement
  return value;
}
```

## Requirements
- Do not use `JSON.parse(JSON.stringify(value))` or native `structuredClone()`.
- Circular links must map to the newly cloned instances, not point back to original instances.
- Maintain key structures (e.g. clone descriptors or property configurations if necessary, but focusing on standard object ownership is acceptable).

## Edge Cases
- **Functions and Symbol properties**: Functions should be copied by reference (as functions are generally treated as behavioral templates). Symbol properties on objects should be cloned if present.
- **Empty collections**: Clones of empty Maps, Sets, or arrays must yield isolated empty instances.
- **Inherited prototypes**: Cloned objects must inherit the same prototypes as the original target objects (using `Object.create(Object.getPrototypeOf(obj))`).

## Expected Approach
Use a `WeakMap` cache to record every object reference we traverse. Before expanding an object recursively, check if it exists in the cache. If it does, return the cached clone reference immediately. Check for special types (like `Date`, `RegExp`, `Map`, `Set`) and clone them using their respective constructors. For plain objects and arrays, instantiate a shell (preserving the prototype), cache it, and recursively populate its keys.

## Solution
```javascript
export function deepClone(value, cache = new WeakMap()) {
  // 1. Handle Primitives and functions
  if (value === null || typeof value !== "object") {
    return value;
  }

  // 2. Handle circular references
  if (cache.has(value)) {
    return cache.get(value);
  }

  // 3. Handle special object constructors
  const type = Object.prototype.toString.call(value);

  if (value instanceof Date) {
    return new Date(value.getTime());
  }

  if (value instanceof RegExp) {
    const clonedRegExp = new RegExp(value.source, value.flags);
    clonedRegExp.lastIndex = value.lastIndex;
    return clonedRegExp;
  }

  if (value instanceof Map) {
    const clonedMap = new Map();
    cache.set(value, clonedMap);
    value.forEach((val, key) => {
      clonedMap.set(deepClone(key, cache), deepClone(val, cache));
    });
    return clonedMap;
  }

  if (value instanceof Set) {
    const clonedSet = new Set();
    cache.set(value, clonedSet);
    value.forEach((val) => {
      clonedSet.add(deepClone(val, cache));
    });
    return clonedSet;
  }

  // 4. Handle Arrays and Plain Objects
  const proto = Object.getPrototypeOf(value);
  const clone = Object.create(proto);

  // Cache the clone reference immediately before recursive lookups to handle circularity
  cache.set(value, clone);

  // Retrieve standard and Symbol properties
  const keys = Reflect.ownKeys(value);

  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    
    // Copy property descriptor properties
    if (descriptor) {
      Object.defineProperty(clone, key, {
        value: deepClone(value[key], cache),
        writable: descriptor.writable,
        enumerable: descriptor.enumerable,
        configurable: descriptor.configurable
      });
    } else {
      clone[key] = deepClone(value[key], cache);
    }
  }

  return clone;
}
```

## Explanation
- **Circular Reference Cache**: `WeakMap` tracks mapped memory locations. If a node is visited twice (e.g. circular dependency), we fetch the cloned reference directly from the cache to prevent infinite recursion.
- **Reflect.ownKeys**: Captures standard enumerable properties, non-enumerable properties, and Symbol keys, ensuring complete coverage compared to `Object.keys()`.
- **Property Descriptors**: Copying property configurations preserves features like read-only keys (`writable: false`).

## Time Complexity
- $O(N)$ where $N$ is the total number of nested keys and objects in the target data structure.

## Space Complexity
- $O(N)$ space required for call stack frame layers and reference storage in the `WeakMap`.

## Interviewer Follow-ups
1. "Why do we use `WeakMap` instead of a standard `Map` for our reference cache?" (To prevent memory leaks: keys in a `WeakMap` are held weakly, meaning that if the original object is garbage collected, the cache entry is removed automatically).
2. "How would you handle cloning objects with getter and setter properties?" (Instead of copying the evaluated value, we must copy the getter/setter functions themselves using `Object.getOwnPropertyDescriptor` and `Object.defineProperty`).

## Senior-Level Discussion
Deep cloning is expensive. In large-scale applications, frequent deep copying can degrade performance and cause garbage collection spikes. As a senior developer, consider using immutable data structures (like Immer) or structural sharing, which reuse unmodified parts of the object tree and only copy modified nodes, saving CPU and memory resources.

---

### Extra Practice: Deep Copy & Immutability
**Task:** Implement a custom deep copy function `deepCopy(obj)` that supports nested objects, arrays, and preserves date instances:
```javascript
export function deepCopy(obj) {
  if (obj === null || typeof obj !== "object") return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (Array.isArray(obj)) return obj.map(deepCopy);
  const copy = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      copy[key] = deepCopy(obj[key]);
    }
  }
  return copy;
}
```
