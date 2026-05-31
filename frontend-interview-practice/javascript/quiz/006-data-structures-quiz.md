# Quiz: JavaScript Data Structures & Collections

## Questions

### Question 1 (Medium - Object Key Coercion)
What is the output of the console logs when this code is executed?
```javascript
const obj = {};
const key1 = 123;
const key2 = "123";
const key3 = [123];

obj[key1] = "Number";
obj[key2] = "String";
obj[key3] = "Array";

console.log(obj[key1]);
console.log(obj[key2]);
console.log(obj[key3]);
```

---

### Question 2 (Hard - Map vs. Object Iteration Order)
What is printed by this code, and what are the rules governing key sorting in plain Objects vs. Maps?
```javascript
const obj = {};
obj["3"] = "three";
obj["1"] = "one";
obj["b"] = "letter b";
obj["a"] = "letter a";

const map = new Map();
map.set("3", "three");
map.set("1", "one");
map.set("b", "letter b");
map.set("a", "letter a");

console.log(Object.keys(obj));
console.log([...map.keys()]);
```

---

### Question 3 (Senior - WeakMap GC Trigger)
Given the code below, when `clearWidget()` is executed, are the entries in the WeakMap garbage collected? Explain how reference chains affect WeakMap GC.
```javascript
let widget = { id: 101 };
const child = { parent: widget };
const meta = new WeakMap();

meta.set(widget, { status: "active" });
meta.set(child, { label: "childNode" });

function clearWidget() {
  widget = null;
}
clearWidget();
```

---

## Answer Key & Explanations

### Question 1: String Conversion of Object Keys
- **Difficulty:** Medium
- **Answer:**
  - `Array`
  - `Array`
  - `Array`
- **Explanation:**
  - In JavaScript plain objects, all keys (except Symbols) are coerced to strings.
  - `obj[key1] = "Number"` assigns value `"Number"` to key `"123"`.
  - `obj[key2] = "String"` overrides the value at key `"123"` with `"String"`.
  - `obj[key3] = "Array"` converts `[123]` to a string by calling `.toString()`, which returns `"123"`. This overrides the key `"123"` with the value `"Array"`.
  - All three properties refer to the same key `"123"`, returning `"Array"`.
- **Common Mistakes:** Thinking that numbers, strings, and single-element arrays remain distinct keys in plain objects. (To keep them distinct, use `Map`).
- **Interviewer Follow-up:** "How would the behavior change if we used a `Map` instead of `obj`?" (In a Map, keys of different types like `123`, `"123"`, and `[123]` remain separate keys).
- **Senior-Level Insight:** Use ES6 `Map` whenever keys are dynamic or not strictly strings/symbols to prevent collision bugs.

---

### Question 2: Object Property Sorting Rules
- **Difficulty:** Hard
- **Answer:**
  - `["1", "3", "b", "a"]`
  - `["3", "1", "b", "a"]`
- **Explanation:**
  - **Plain Objects**: Follow the ES6 property iteration order:
    1. Integer keys (indexes) are sorted in ascending numeric order. Here, `"1"` and `"3"` are integer keys, so they are sorted first: `["1", "3"]`.
    2. String keys are returned in insertion order: `["b", "a"]`.
    3. Symbol keys are returned in insertion order (not fetched by `Object.keys`).
    - The output for `obj` is `["1", "3", "b", "a"]`.
  - **Maps**: Always maintain key insertion order, regardless of type. The output is `["3", "1", "b", "a"]`.
- **Common Mistakes:** Expecting plain objects to preserve insertion order for numeric keys or sorting all keys alphabetically.
- **Interviewer Follow-up:** "How does this sorting behavior affect object serialization?" (JSON stringification reflects this key order, which can cause checksums on JSON payloads to differ even if the data is identical).
- **Senior-Level Insight:** When ordering matters (like dropdown list selections or event timelines), always use a `Map` instead of a plain object.

---

### Question 3: WeakMap GC Reference Chains
- **Difficulty:** Senior
- **Answer:**
  - The entry for `widget` is **not** garbage collected.
  - The entry for `child` is **not** garbage collected.
- **Explanation:**
  - Setting `widget = null` breaks the global reference to the widget object.
  - However, the `child` object still holds a reference to the widget object via `child.parent`.
  - Because `child` is reachable from the global scope, it is kept alive. Since `child` is alive, `child.parent` is alive, which keeps the widget object alive.
  - Since the widget object is still alive on the heap, its entry in the `meta` WeakMap cannot be garbage collected.
  - To allow GC, you must break the reference chain entirely: set `child.parent = null` or clear `child`.
- **Common Mistakes:** Assuming that clearing the main variable `widget` immediately cleans up the WeakMap entry even if other objects hold references to it.
- **Interviewer Follow-up:** "What happens if we set `child` to `null` instead?" (If `child` is cleared, its WeakMap entry is garbage collected because nothing else references `child`. However, the widget entry remains alive because `widget` is still referenced).
- **Senior-Level Insight:** WeakMap prevents leaks when the key objects are garbage collected, but you must ensure that no active reference chains keep those key objects alive on the heap.
