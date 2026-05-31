# Practical: Deep Configuration Merger

## Problem Title: Deep Config Merger with Nullish Overrides

## Difficulty: Senior

## Skills Tested
- Spread and Rest operators in nested structures
- Nullish Coalescing (`??`) for strict value defaults
- Object traversal and mutation safety
- Recursive object merging

## Problem Statement
Implement a configuration merger function `mergeConfig(defaultConfig, userConfig)` that deeply merges a `userConfig` object into a `defaultConfig` object.

The merger must follow these rules:
1. **Plain Objects**: If a key in both objects contains a plain object, recursively merge their properties.
2. **Strict Nullish Overrides**: The user config should overwrite default values, including falsy values like `false`, `0`, and `""`. However, if a user property is strictly `undefined`, the default value must be retained. If it is `null`, it should overwrite the default value with `null` (since the user explicitly wants to nullify it).
3. **Array properties**: Arrays must not be merged index-by-index. The user array must completely overwrite the default array.
4. **Immutability**: Neither `defaultConfig` nor `userConfig` should be mutated. The function must return a new object.

## Starter Code
```javascript
/**
 * Deeply merges user configuration into default configuration.
 * @param {Object} defaultConfig - Base configuration templates
 * @param {Object} userConfig - User overrides
 * @returns {Object} A new merged configuration object
 */
export function mergeConfig(defaultConfig, userConfig) {
  // Implement
  return {};
}
```

## Requirements
- Support infinite nesting depth for plain objects.
- Ensure that properties from `userConfig` that do not exist in `defaultConfig` are copied over.
- Copy symbols and non-enumerable keys if present (for this exercise, focus on standard enumerable string keys).

## Edge Cases
- **Circular References**: For simplicity, assume configuration objects are tree structures without circular references.
- **Prototype Pollutions**: Do not copy keys like `__proto__` or `constructor` from the user configuration to prevent security injections.

## Expected Approach
Use recursive checks. If either config is not an object or is null, return the user config (handling nullish checks). Create a clone of the default config to start, iterate through user config keys, and apply merge rules recursively. If a key is `__proto__`, skip it to prevent prototype pollution.

## Solution
```javascript
function isObject(val) {
  return val && typeof val === "object" && !Array.isArray(val) && !(val instanceof Date) && !(val instanceof RegExp);
}

export function mergeConfig(defaultConfig, userConfig) {
  // If userConfig is nullish or undefined, return a clone of defaultConfig
  if (userConfig === undefined) {
    return isObject(defaultConfig) ? { ...defaultConfig } : defaultConfig;
  }

  if (!isObject(defaultConfig) || !isObject(userConfig)) {
    return userConfig !== undefined ? userConfig : defaultConfig;
  }

  // Create shell copy of defaultConfig to preserve immutability
  const merged = { ...defaultConfig };

  const userKeys = Object.keys(userConfig);

  for (const key of userKeys) {
    // Prevent Prototype Pollution
    if (key === "__proto__" || key === "constructor") {
      continue;
    }

    const defaultValue = defaultConfig[key];
    const userValue = userConfig[key];

    if (userValue === undefined) {
      // Retain default if user is explicitly undefined
      continue;
    }

    if (isObject(defaultValue) && isObject(userValue)) {
      // Recursively merge nested objects
      merged[key] = mergeConfig(defaultValue, userValue);
    } else {
      // Overwrite with user value (supports null, false, 0, etc. via direct assignment)
      merged[key] = userValue;
    }
  }

  return merged;
}
```

## Explanation
- **Immutability**: We use `{ ...defaultConfig }` to create a shallow copy at each recursive step, protecting the input configuration records from mutation.
- **Nullish Coalescing Rules**: The check `userValue === undefined` handles the default boundary. If `userValue` is `null` or a falsy primitive (like `false` or `0`), the check is bypassed, and the value overwrites the default.
- **Security Check**: Skipping `__proto__` and `constructor` keys blocks prototype pollution attacks from user-provided config payloads.

## Time Complexity
- $O(D + U)$ where $D$ and $U$ are the total number of keys in default and user configurations.

## Space Complexity
- $O(N)$ where $N$ is the depth of the nested configuration tree (recursion stack frames).

## Interviewer Follow-ups
1. "Why is `Array.isArray` check crucial inside the object validation?" (Without it, the recursive merger would treat arrays as plain objects and attempt to merge them index-by-index, resulting in mixed values instead of a clean overwrite).
2. "How would you extend this merger to support custom merging strategies for specific keys (e.g. concatenating arrays instead of overwriting)?" (Accept a resolver map as a third parameter: `mergeConfig(default, user, { arrays: 'concat' })` and route array merges accordingly).

## Senior-Level Discussion
Deep merging utilities are standard in build frameworks (Vite/Webpack configs) and server configurations. In production environments, avoid implementing custom deep mergers if you are handling untrusted user input, as prototype pollution can lead to remote code execution (RCE) on node servers. Rely on vetted packages like Lodash's `merge` or write strict schemas to validate inputs.

---

### Extra Practice: ESM Modules, Optional Chaining, & Nullish Coalescing
**Task:** Implement a configuration parser that reads nested configurations using optional chaining and nullish coalescing defaults:
```javascript
export function getNestedConfig(obj, path, defaultValue) {
  const parts = path.split(".");
  let current = obj;
  for (const part of parts) {
    current = current?.[part];
  }
  return current ?? defaultValue;
}
```
