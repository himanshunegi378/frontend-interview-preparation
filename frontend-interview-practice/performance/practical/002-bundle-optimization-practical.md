# Practical: Dependency Graph Tree Shaker

## Problem Title: Static Dependency Dead-Code Eliminator

## Difficulty: Senior

## Skills Tested
- Static Dependency Graph Traversal (DFS/BFS)
- Set & Map Data Operations
- Module Import/Export Dependency Mapping
- Dead Code Elimination

## Problem Statement
A JavaScript bundler wants to implement a tree-shaking engine. The engine must analyze a list of modules, trace which exported functions are imported and used by the entry file (directly or indirectly), and return the names of exported functions that are unused (dead code) and can be safely stripped from the production build.

A module is represented as an object:
```javascript
const modules = {
  "index.js": {
    imports: { "./utils.js": ["add"] }, // File -> list of imported symbols
    exports: []
  },
  "utils.js": {
    imports: { "./math.js": ["sum"] },
    exports: ["add", "subtract"]
  },
  "math.js": {
    imports: {},
    exports: ["sum", "multiply"]
  }
};
```

Write a function `shakeTree(modules, entryFile)` that traverses the dependency tree starting at `entryFile`, identifies which exported symbols are actually used, and returns an object listing the unused exports for each module.

For the inputs above, calling `shakeTree(modules, "index.js")` should return:
```json
{
  "utils.js": ["subtract"],
  "math.js": ["multiply"]
}
```

## Starter Code
```javascript
/**
 * Analyzes a module graph and identifies unused exports.
 */
export function shakeTree(modules, entryFile) {
  // Implement tree-shaking graph traversal
  return {};
}
```

## Requirements
- Support multi-level transitive imports (e.g. `index.js` imports `utils.js` which imports `math.js`).
- If an entire module is never imported, all of its exports are considered unused. The entry file's exports are assumed to be used (entry points).
- Ensure that circular dependencies (Module A imports B, and B imports A) do not trigger infinite loops during graph traversal.

## Edge Cases
- Dynamic module paths (ignore or mark all exports as used).
- Wildcard imports (e.g. `import * as math from "./math"`). If a wildcard import is detected, assume **all** exports of that module are used. We represent wildcard imports in the imports list as: `{"./math.js": ["*"]}`.

## Expected Approach
We use a queue or stack to perform a Breadth-First Search (BFS) or Depth-First Search (DFS) starting from the `entryFile`.
We maintain a Map of `usedExports`: `Map<file, Set<symbol>>`.
The queue elements represent symbols to check: `{ file, symbol }`.
1.  Initialize the queue with all imports declared inside the `entryFile`. For each import `file -> symbols`, add `{ file, symbol }` to the queue and mark it in `usedExports`.
2.  While the queue is not empty:
    - Dequeue `{ file, symbol }`.
    - Retrieve the module definition for `file`.
    - Check if this module imports other symbols from dependencies to resolve the requested `symbol`. 
    - *Simplification*: Any symbol imported by `file` that is needed to resolve the used exports is also marked as used and queued. If a file imports a symbol, we assume it is used.
3.  Once traversal completes, compare the `usedExports` map against the original `exports` list for each module. Any exported symbol not present in `usedExports` is returned in the output object.

## Solution
```javascript
/**
 * Traces a module graph and returns the unused exports for each module.
 * @param {Object} modules - The dependency graph representation
 * @param {string} entryFile - The starting file name
 * @returns {Object} Unused exports map
 */
export function shakeTree(modules, entryFile) {
  if (!modules || !modules[entryFile]) {
    return {};
  }

  // Track used symbols per file: Map<fileName, Set<symbolName>>
  const usedSymbols = new Map();
  for (const filename of Object.keys(modules)) {
    usedSymbols.set(filename, new Set());
  }

  // Queue format: { file, symbol }
  const queue = [];

  // 1. Seed queue with initial imports from entry file
  const entryModule = modules[entryFile];
  if (entryModule.imports) {
    for (const [depPath, symbols] of Object.entries(entryModule.imports)) {
      if (modules[depPath]) {
        symbols.forEach((sym) => {
          queue.push({ file: depPath, symbol: sym });
          usedSymbols.get(depPath).add(sym);
        });
      }
    }
  }

  // 2. Traversal Loop
  while (queue.length > 0) {
    const { file, symbol } = queue.shift();
    const moduleInfo = modules[file];

    if (!moduleInfo) continue;

    // Handle wildcard imports: if "*" is imported, mark all exports as used
    if (symbol === "*") {
      if (moduleInfo.exports) {
        moduleInfo.exports.forEach((exp) => {
          if (!usedSymbols.get(file).has(exp)) {
            usedSymbols.get(file).add(exp);
            queue.push({ file, symbol: exp });
          }
        });
      }
    }

    // Trace imports of the current file.
    // If the file imports symbols from other files, they are transitively marked as used.
    if (moduleInfo.imports) {
      for (const [depPath, symbols] of Object.entries(moduleInfo.imports)) {
        if (modules[depPath]) {
          symbols.forEach((sym) => {
            const hasBeenMarked = usedSymbols.get(depPath).has(sym);
            if (!hasBeenMarked) {
              usedSymbols.get(depPath).add(sym);
              queue.push({ file: depPath, symbol: sym });
            }
          });
        }
      }
    }
  }

  // 3. Compile unused exports list
  const unusedMap = {};

  for (const [filename, moduleInfo] of Object.entries(modules)) {
    if (filename === entryFile) continue; // Skip entry file

    const used = usedSymbols.get(filename) || new Set();
    
    // If a module was never imported, all its exports are unused
    const declaredExports = moduleInfo.exports || [];
    
    const unused = declaredExports.filter(exp => !used.has(exp));
    
    // Only include in results if the module declares exports and has unused ones
    if (declaredExports.length > 0 && unused.length > 0) {
      unusedMap[filename] = unused;
    }
  }

  return unusedMap;
}
```

## Explanation
- **Static Graph Analysis**: The BFS queue traces dependencies statically, mapping imports to exports across modules.
- **Deduplication Check**: Checking `usedSymbols.get(depPath).has(sym)` before enqueueing prevents redundant processing and infinite loops on circular dependencies.
- **Wildcard Resolve**: If the import is `*`, the compiler treats all exports as used, which matches bundler fallback behaviors.

## Time Complexity
- **Traversal**: $O(V + E)$ where $V$ is the number of modules and $E$ is the number of import/export declarations in the graph.

## Space Complexity
- **Storage**: $O(V + E)$ to maintain the queue and the `usedSymbols` tracking map.

---

## Interviewer Follow-ups
1. "What if a module has side-effects (e.g., executing code when imported)? Can you safely tree-shake it?"
   (No. If a module has side-effects (like modifying global variables or polyfilling), it cannot be stripped even if its exports are unused. This is why configuring `"sideEffects": false` in package.json is necessary to tell the bundler it is safe).
2. "How does code-splitting affect tree-shaking?"
   (Code splitting divides modules into different chunks. The tree-shaking engine runs first to remove dead code, and then the chunk-splitter groups the remaining modules into physical files).

---

## Senior-Level Discussion
Understanding static analysis is a distinguishing trait of senior frontend engineers.
By writing custom graph traversal algorithms, you show you understand how Webpack, Rollup, and Vite optimize bundles behind the scenes.
This knowledge is invaluable when diagnosing build configuration issues or tuning corporate CI compilation steps.

---

### Extra Practice: Preloading & Prefetching
**Task:** Create a dynamic asset preloader that inserts resource link tags to optimize browser fetch priority:
```javascript
export function preloadAsset(url, asType = "script") {
  const link = document.createElement("link");
  link.rel = "preload";
  link.as = asType;
  link.href = url;
  document.head.appendChild(link);
}
```
