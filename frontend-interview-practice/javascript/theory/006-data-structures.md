# JavaScript Data Structures: Objects, Arrays, Map, Set, WeakMap, & WeakSet

## Why It Matters
Senior frontend engineers must understand how JavaScript collections are implemented in browser engines to select the appropriate data structure for each scenario. Selecting the wrong collection can lead to $O(N)$ lookup times, high memory overhead, and memory leaks (especially in cache layers).

---

## Core Concepts & Mental Models

### 1. Plain Objects vs. Maps
- **Plain Objects (`{}`)**:
  - Keys are coerced to strings or symbols.
  - No built-in iteration ordering (keys are generally returned in insertion order for strings, but sorted numerically for integer keys).
  - Contain default inherited prototype keys (like `.toString`), which can cause name collision bugs.
- **Maps**:
  - Keys can be of any type (including objects, functions, and primitives).
  - Maintain insertion order for all keys.
  - Do not contain inherited prototype keys.
  - Offer $O(1)$ lookup times.

### 2. Arrays vs. Sets
- **Arrays (`[]`)**:
  - Ordered list of elements accessed by index.
  - Finding an element requires $O(N)$ linear search (unless sorted).
  - Duplicate values are allowed.
- **Sets**:
  - Collection of unique values.
  - Finding/deleting an element is an $O(1)$ operation.

### 3. WeakMap & WeakSet (Memory Leak Protections)
- **WeakMap**:
  - Keys must be **objects** or **registered symbols** (primitives are not allowed).
  - Values can be of any type.
  - References to the key objects are held **weakly**. If there are no other references to a key object, the object can be garbage collected, and the corresponding value is removed from the WeakMap automatically.
  - Keys are not enumerable (you cannot list keys or read sizes).
- **WeakSet**:
  - Collection of unique objects held weakly.

```
WeakMap GC reference link:
┌───────────┐         GC Root Reference
│  MyObject │ <─────────────────────────── window.activeWidget
└─────┬─────┘
      │ (Weak Reference)
      ▼
┌───────────┬───────────┐
│  WeakMap  │   Value   │
│   Key     │  (State)  │
└───────────┴───────────┘
If window.activeWidget is set to null, MyObject is garbage collected, and the WeakMap entry is swept away automatically.
```

### 4. V8 Array Packing Elements
V8 compiles arrays into different optimization shapes depending on content density:
- **Fast Elements (Packed)**: Continuous index storage in memory (very fast).
- **Dictionary Elements (Holey)**: Sparse index mappings (e.g. `arr[0] = 1; arr[9999] = 2;`). V8 converts these into slow hash-table lookups to prevent allocating large blocks of empty memory.

---

## Real-World Case Study / Examples

### 1. DOM Element State Cache
Using a `WeakMap` allows associating custom states or metadata with DOM elements without leaking memory when those elements are removed from the document:

```javascript
const elementMetadata = new WeakMap();

function trackElement(el, data) {
  elementMetadata.set(el, data);
}

// When el is removed from the DOM and no other references exist,
// both el and its metadata are garbage collected automatically.
```

---

## Common Interview Traps

### 1. Key Coercion in Plain Objects
```javascript
const obj = {};
const key1 = { name: "Alice" };
const key2 = { name: "Bob" };

obj[key1] = 1;
obj[key2] = 2;

console.log(obj[key1]); 
// Outputs: 2!
// Both key1 and key2 are coerced to the string "[object Object]", overwriting the value.
```

---

## Junior vs. Senior View

- **Junior View**: "Objects and Arrays are the only collections you need. Map and Set are just newer features that do the same thing."
- **Senior View**: "Map and Set are optimized hash-tables that offer constant-time lookups. WeakMap and WeakSet are crucial for cache layers and metadata tracking because they store keys as weak references, preventing memory leaks. Senior engineers avoid using plain objects for dynamic key-value caches to prevent prototype pollution and performance degradation from polymorphic shape changes."

---

## Related Interview Questions
1. "Explain how V8 optimizes packed arrays vs. holey arrays."
2. "Why are WeakMap keys not enumerable?"
3. "Compare the performance of `Map.prototype.has` with `Array.prototype.includes` for large datasets."
4. "How do you implement a private state accessor using a `WeakMap`?"
