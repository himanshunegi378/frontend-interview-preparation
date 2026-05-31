# Practical: Cross-Application Routing Bridge

## Problem Title: Micro-Frontend History Synchronizer

## Difficulty: Senior

## Skills Tested
- Pub-Sub Communication Bridges
- Event Loop Navigation Event Tracking
- Infinite Feedback Loop Prevention
- Router History Abstractions

## Problem Statement
In micro-frontend architectures, the container shell manages the primary navigation (e.g., using a browser history router), while dynamically loaded sub-applications manage their internal paths (using an in-memory history router). 

To ensure the URL in the browser's address bar matches the sub-app's internal state, we must synchronize history changes between the parent router and the child router. However, a naive bi-directional binding triggers infinite loops: the parent updates the child, which triggers the child listener, which updates the parent, and so on.

Implement a function `synchronizeHistory(parentHistory, childHistory)` that coordinates routing updates between two histories and prevents update loops.

## Starter Code
```javascript
/**
 * Synchronizes navigation events between parent and child history instances.
 * Returns an unbind function to clean up listeners.
 */
export function synchronizeHistory(parentHistory, childHistory) {
  // Implement history sync logic
  return () => {
    // Cleanup listeners
  };
}
```

## Requirements
- When `parentHistory` navigates to a new path, `childHistory` must be updated using `.push(path)`.
- When `childHistory` navigates to a new path, `parentHistory` must be updated using `.push(path)`.
- **Loop Prevention**: Do not invoke `.push()` on a history instance if it is already at the target path.
- The function must return a cleanup function that disconnects all listeners on both histories when executed.

## Mock History Interface
For testing and execution, assume both histories match this simplified interface:
```javascript
class MockHistory {
  constructor(initialPath = "/") {
    this.path = initialPath;
    this.listeners = [];
  }
  listen(callback) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }
  push(newPath) {
    if (this.path !== newPath) {
      this.path = newPath;
      this.listeners.forEach(cb => cb(newPath));
    }
  }
}
```

## Edge Cases
- Navigation actions triggered simultaneously from both routers.
- Null or empty path values (ignore or fallback).
- Cleaning up listeners multiple times.

## Expected Approach
We bind listeners to both histories: `parentHistory.listen(onParentUpdate)` and `childHistory.listen(onChildUpdate)`.
To avoid ping-pong infinite loops:
1. In `onParentUpdate(path)`: Check if `childHistory.path` is already equal to `path`. If not, call `childHistory.push(path)`.
2. In `onChildUpdate(path)`: Check if `parentHistory.path` is already equal to `path`. If not, call `parentHistory.push(path)`.
This simple path check breaks the recursion loop.

## Solution
```javascript
/**
 * Bi-directionally synchronizes parent and child history states safely.
 * @param {Object} parentHistory 
 * @param {Object} childHistory 
 * @returns {Function} Unbind cleanup function
 */
export function synchronizeHistory(parentHistory, childHistory) {
  let isNavigating = false;

  // 1. Listen to parent changes
  const unbindParent = parentHistory.listen((newPath) => {
    if (isNavigating) return;
    
    // Check if child path is already in sync
    const currentChildPath = childHistory.path || childHistory.location?.pathname;
    if (currentChildPath !== newPath) {
      isNavigating = true;
      try {
        childHistory.push(newPath);
      } finally {
        isNavigating = false;
      }
    }
  });

  // 2. Listen to child changes
  const unbindChild = childHistory.listen((newPath) => {
    if (isNavigating) return;

    // Check if parent path is already in sync
    const currentParentPath = parentHistory.path || parentHistory.location?.pathname;
    if (currentParentPath !== newPath) {
      isNavigating = true;
      try {
        parentHistory.push(newPath);
      } finally {
        isNavigating = false;
      }
    }
  });

  // 3. Return unbind helper
  return () => {
    unbindParent();
    unbindChild();
  };
}
```

## Explanation
- **Guard State & Path Matching**: We use a state flag `isNavigating` combined with path-equality checks (`currentPath !== newPath`) to break bi-directional event loops.
- **Dynamic Adapter Mappings**: The code checks `history.path` and standard browser bindings (`history.location.pathname`) to support different history adapters (native React Router history and memory histories).

## Time Complexity
- **Routing sync operation**: $O(1)$ constant time history evaluation.

## Space Complexity
- **Memory overhead**: $O(1)$ constant space overhead for listener refs.

---

## Interviewer Follow-ups
1. "What if the child history uses query parameters (e.g. `?tab=overview`) and the parent router does not support them?"
   (Implement path extraction logic to strip query parameters before pushing to the parent router, or define query mapping adapters inside the synchronization handlers).
2. "How would you handle asynchronous route transitions where a router can intercept and cancel navigation?"
   (If navigation is blocked, detect that the history did not update after `.push()`, and restore the previous state to keep both routers in sync).

---

## Senior-Level Discussion
Writing custom history bridges is a core requirement when designing micro-frontend shell systems.
By wrapping routing events in a guarded synchronization layer, you prevent infinite loop errors and ensure path synchronization remains seamless for users.
This pattern shows an understanding of state machines, message bridges, and decoupled browser routing lifecycles.

---

### Extra Practice: White-label Theme Loader
**Task:** Implement a dynamic theme style loader that injects custom styling variables based on a client configuration payload:
```javascript
export function applyWhiteLabelTheme(themeConfig) {
  const root = document.documentElement;
  for (const [key, value] of Object.entries(themeConfig)) {
    root.style.setProperty(`--theme-${key}`, value);
  }
}
```
