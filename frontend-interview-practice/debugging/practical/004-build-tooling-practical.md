# Practical: Debugging Circular Dependencies

## Problem Title: Monorepo Circular Dependency Detector

## Difficulty: Senior

## Skills Tested
- Directed Graph Cycle Detection (Topological Sort / DFS)
- Backtracking & Path Tracking
- Static Dependency Analysis
- Recursion Stack Management

## Problem Statement
When developing in monorepos or scaling large codebases, circular dependencies (File A imports B, and B imports A) trigger runtime errors where imported values evaluate to `undefined`. 

Implement a function `findCircularDependencies(graph)` that analyzes a directed module dependency graph, detects if any cycles exist, and returns the list of detected circular paths.

A directed graph is represented as:
```javascript
const graph = {
  "index.js": ["utils.js", "helpers.js"],
  "utils.js": ["math.js"],
  "math.js": ["index.js"], // Cycle here! (index -> utils -> math -> index)
  "helpers.js": []
};
```

Calling `findCircularDependencies(graph)` for the input above should return:
```json
[
  ["index.js", "utils.js", "math.js", "index.js"]
]
```

## Starter Code
```javascript
/**
 * Detects circular dependency paths in a directed module graph.
 */
export function findCircularDependencies(graph) {
  const cycles = [];
  // Implement cycle detection DFS
  return cycles;
}
```

## Requirements
- The function must return an array of arrays, where each sub-array represents a distinct cycle path starting and ending with the same module.
- Avoid duplicate reports of the same cycle starting at different nodes (e.g. if `A -> B -> A` is reported, do not report `B -> A -> B` separately).
- Ensure that self-referencing loops (File A imports itself) are caught.

## Edge Cases
- Disconnected graphs: the graph may contain multiple separate trees; the detector must traverse all entry points to find cycles.
- Node with no dependencies.
- Empty graph.

## Expected Approach
We use a standard Depth-First Search (DFS) graph traversal with **recursion stack coloring**:
- We keep three sets:
  - `unvisited`: Nodes we haven't visited yet.
  - `visiting`: Nodes in the current DFS path (recursion stack).
  - `visited`: Nodes that have been completely evaluated.
- For each unvisited node in the graph, we start a DFS call:
  1. Add the node to `visiting` and record the path: `currentPath.push(node)`.
  2. For each dependency of this node:
     - If it is in `visiting`: we have found a cycle! Extract the cycle path starting from the dependency's index to the end, append the dependency to close the loop, and record it.
     - If it is unvisited: recursively call DFS on it.
  3. Remove the node from `visiting` and pop from `currentPath`. Add it to `visited`.

To deduplicate:
Sort cycle arrays alphabetically before saving their unique signatures (e.g. convert to a sorted string key) to prevent recording rotations of the same cycle path.

## Solution
```javascript
/**
 * Traces a directed graph to locate circular dependency loops.
 * @param {Object} graph - Directed graph: Map<nodeName, Array<dependencies>>
 * @returns {Array<Array<string>>} List of detected cycle paths
 */
export function findCircularDependencies(graph) {
  const cycles = [];
  const visited = new Set();
  const visiting = new Set();
  const currentPath = [];
  const uniqueCycles = new Set(); // Track unique cycle hashes

  function dfs(node) {
    visiting.add(node);
    currentPath.push(node);

    const neighbors = graph[node] || [];

    for (const neighbor of neighbors) {
      if (visiting.has(neighbor)) {
        // Cycle detected! Locate start index of neighbor in our path
        const startIndex = currentPath.indexOf(neighbor);
        const cycle = currentPath.slice(startIndex);
        cycle.push(neighbor); // Close the loop path: A -> B -> A

        // Generate a sorted hash to avoid registering rotations of same cycle
        // e.g. A-B-A and B-A-B represent the same cycle
        const sortedNodes = [...new Set(cycle)].sort().join("-");
        
        if (!uniqueCycles.has(sortedNodes)) {
          uniqueCycles.add(sortedNodes);
          cycles.push(cycle);
        }
      } else if (!visited.has(neighbor)) {
        dfs(neighbor);
      }
    }

    currentPath.pop();
    visiting.delete(node);
    visited.add(node);
  }

  // Iterate over all nodes to support disconnected trees
  for (const node of Object.keys(graph)) {
    if (!visited.has(node)) {
      dfs(node);
    }
  }

  return cycles;
}
```

## Explanation
- **Coloring DFS Strategy**: Tracking `visiting` nodes (the active recursion stack) is the correct way to identify back-edges in directed graphs. If a neighbor is in `visiting`, it indicates a loop path.
- **Rotation Deduplication**: Sorting node names to build `uniqueCycles` hashes (e.g., `A-B-C` for both `A->B->C->A` and `B->C->A->B`) ensures we return a clean list of structural cycles.

## Time Complexity
- **Graph Traversal**: $O(V + E)$ where $V$ is the number of module nodes and $E$ is the number of dependency import declarations (visiting each node and edge once).

## Space Complexity
- **Recursion Stack**: $O(V)$ auxiliary space to hold the tracking sets and recursion call stack.

---

## Interviewer Follow-ups
1. "How would you handle external library imports (like react) which are not part of the local workspace graph?"
   (Filter out dependencies that start with non-relative paths (e.g. doesn't start with `./` or `../` or match your monorepo workspace prefix) to keep the analysis scoped to internal code files).
2. "How would you write a script that breaks the build if a circular dependency is detected?"
   (Configure this function inside a custom pre-commit build hook. If `findCircularDependencies(graph).length > 0`, print the cycles, log an error, and call `process.exit(1)` to halt the CI commit check).

---

## Senior-Level Discussion
Writing custom graph analysis utilities shows a solid understanding of compilers and static asset optimization.
By writing circular dependency check engines, you show that you understand how module loaders organize dependency trees, and possess the tools to protect codebases from runtime initialization failures.
This is highly relevant when building custom build pipelines or maintaining large monorepos with hundreds of packages.
