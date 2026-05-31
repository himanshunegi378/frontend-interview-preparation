# PART 3: REACT INTERNALS, FIBER & CONCURRENT ARCHITECTURE

## Module 3.1: The Fiber Architecture & Reconciler

### 1. The Reconciler and Double-Buffering Strategy
React’s **Fiber Reconciler** is designed around a virtual stack frame system. A **Fiber node** represents a unit of work and a component instance.

To update the UI without showing incomplete states to the user, React uses a **Double-Buffering Strategy**. It maintains two fiber trees at any given time:

```
[Screen] ---> Current Tree (current DOM representation)
                   ^
                   | (Committed at the end of the Render)
                   |
             Work-In-Progress Tree (In-flight calculations)
```

1. **Current Tree:** Represents the nodes currently visible on the screen.
2. **Work-In-Progress (WIP) Tree:** Built during the background render phase. React performs reconciliation calculations on the WIP tree. Once finished, React swaps the WIP tree with the Current tree in a single, synchronous operation (the commit phase).

---

### 2. Render Phase vs. Commit Phase
The reconciliation lifecycle is split into two primary phases:

| Metric | Render Phase | Commit Phase |
| :--- | :--- | :--- |
| **Execution Mode** | Asynchronous, concurrent, interruptible. | Synchronous, blocking, non-interruptible. |
| **Task Flow** | Traverses elements, performs diffing, builds WIP tree, flags side effects (Flags/Effects list). | Performs actual DOM mutations, invokes lifecycle methods (`componentDidMount`), and runs effects (`useEffect`, `useLayoutEffect`). |
| **Purity** | Must be pure and free of side effects (can be aborted/restarted by the scheduler). | Intended for side effects and DOM layout measurements. |

---

### 3. Lanes-Based Priority Scheduling
In React 18 and 19, scheduling priorities are managed using **Lanes**. A Lane is represented as a 32-bit binary integer. Each bit represents a different level of update priority.

```typescript
// React Internal Lanes representation
export type Lane = number;
export type Lanes = number;

export const NoLane: Lane =             0b0000000000000000000000000000000;
export const SyncLane: Lane =           0b0000000000000000000000000000001; // Synchronous updates
export const InputContinuousLane: Lane =0b0000000000000000000000000000010; // Continuous events (hover/scroll)
export const DefaultLane: Lane =        0b0000000000000000000000000100000; // Normal updates (setState)
export const TransitionLane: Lane =     0b0000000000000000000000001000000; // Low-priority transitions (useTransition)
export const IdleLane: Lane =           0b0000000001000000000000000000000; // Idle processing

// Check if a lane is included in a set of lanes
export function hasHighestPriority(lanes: Lanes, lane: Lane): boolean {
  return (lanes & lane) !== 0;
}

// Merge lanes
export function mergeLanes(a: Lanes, b: Lanes): Lanes {
  return a | b;
}
```

By using bitwise operations, React can easily merge, filter, and prioritize updates. For example, if a high-priority `SyncLane` action occurs while a low-priority `TransitionLane` is rendering, React pauses the low-priority render, runs the synchronous update, and then restarts the transition render.

---

### 4. How the Reconciler `WorkLoop` Processes Updates
The `WorkLoop` is the heartbeat of React’s reconciler. It processes the WIP fiber tree node-by-node.

```typescript
// Simplified React Fiber WorkLoop Implementation
interface Fiber {
  tag: number;
  key: null | string;
  type: any;
  stateNode: any;
  child: Fiber | null;
  sibling: Fiber | null;
  return: Fiber | null;
  pendingProps: any;
  memoizedProps: any;
  memoizedState: any;
  lanes: number;
}

let workInProgress: Fiber | null = null;
let workInProgressRootRenderLanes: number = 0;

function workLoopConcurrent(): void {
  // Process fiber nodes as long as there is work and the scheduler has time left in the frame
  while (workInProgress !== null && !shouldYieldToHost()) {
    performUnitOfWork(workInProgress);
  }
}

function performUnitOfWork(unitOfWork: Fiber): void {
  const current = unitOfWork.stateNode; // Current version of the fiber
  let next: Fiber | null = beginWork(unitOfWork); // Reconcile node

  unitOfWork.memoizedProps = unitOfWork.pendingProps;
  if (next === null) {
    // If there is no child node, complete work for this node
    completeUnitOfWork(unitOfWork);
  } else {
    workInProgress = next;
  }
}

function beginWork(wip: Fiber): Fiber | null {
  // Reconcile props, state, and create child fibers
  console.log(`Reconciling Fiber tag: ${wip.tag}`);
  // If it has a child, return it to continue down the tree
  return wip.child;
}

function completeUnitOfWork(unitOfWork: Fiber): void {
  let completedWork: Fiber | null = unitOfWork;
  
  do {
    const returnFiber: Fiber | null = completedWork.return;
    completeWork(completedWork);

    const sibling = completedWork.sibling;
    if (sibling !== null) {
      workInProgress = sibling;
      return;
    }
    completedWork = returnFiber;
    workInProgress = completedWork;
  } while (completedWork !== null);
}

function completeWork(wip: Fiber): void {
  console.log(`Completed Fiber tag: ${wip.tag}`);
  // Build native DOM element structures and prepare updates for the commit phase
}

function shouldYieldToHost(): boolean {
  return false; 
}
```

---

## Module 3.2: State Mechanics & Hooks Under the Hood

### 1. Hook Linked Lists on Fiber Nodes
Hooks are stored on a Fiber node’s `memoizedState` property as a **singly linked list**. The order of this list is determined during the component's initial render. This is why hooks cannot be placed inside conditionals, loops, or nested functions.

```
Fiber.memoizedState ---> [ Hook 1 (useState) ]
                                |
                                v
                         [ Hook 2 (useEffect) ]
                                |
                                v
                         [ Hook 3 (useMemo) ]
```

#### Hook Node Structure
```typescript
interface Hook {
  memoizedState: any;  // The actual state value (or cached value/factory function)
  baseState: any;      // Base state during updates
  baseQueue: Update<any, any> | null;
  queue: UpdateQueue<any, any> | null; // Stores queue of state updates to process
  next: Hook | null;   // Pointer to the next hook
}

interface Update<S, A> {
  lane: Lane;
  action: A;
  next: Update<S, A> | null;
}

interface UpdateQueue<S, A> {
  pending: Update<S, A> | null;
  dispatch: (action: A) => void;
}
```

During render:
- **Mount Phase:** React creates a new Hook object and appends it to the tail of the linked list.
- **Update Phase:** React traverses the existing linked list. If the hooks call order changes (e.g., due to a conditional hook), the hook pointer goes out of sync with the previous render tree, causing state corruption or runtime crashes.

---

### 2. Deep Optimization of React Context
Context propagation bypasses the `shouldComponentUpdate` and `React.memo` checks of intermediate nodes. When a Context provider value changes, React traverses down the children tree and schedules updates on every fiber node that consumes that context.

#### Advanced Rerender Prevention Architectures

##### Option A: Context Splitting
Split context into separate providers for static configurations and dynamic state updates.
```typescript
import React, { createContext, useContext, useState, useMemo } from "react";

const StateContext = createContext<{ count: number } | null>(null);
const DispatchContext = createContext<((val: number) => void) | null>(null);

export const CounterProvider = ({ children }: { children: React.ReactNode }) => {
  const [count, setCount] = useState(0);

  return (
    <StateContext.Provider value={useMemo(() => ({ count }), [count])}>
      <DispatchContext.Provider value={setCount}>
        {children}
      </DispatchContext.Provider>
    </StateContext.Provider>
  );
};
```

##### Option B: Children Memoization Wrapper
```typescript
export const ExpensiveComponentWrapper = React.memo(({ children }: { children: React.ReactNode }) => {
  return <div className="expensive-panel">{children}</div>;
});
```

---

## Module 3.3: Concurrent React & Next.js App Router

### 1. Suspense Semantics Under the Hood
When a component suspended inside a Suspense boundary needs data (e.g., via a resource fetch or lazy import), it throws a Promise.

```typescript
export function createResource<T>(promise: Promise<T>) {
  let status: "pending" | "success" | "error" = "pending";
  let result: T | any;

  const suspender = promise.then(
    (res) => {
      status = "success";
      result = res;
    },
    (err) => {
      status = "error";
      result = err;
    }
  );

  return {
    read(): T {
      if (status === "pending") {
        throw suspender; 
      } else if (status === "error") {
        throw result;
      } else {
        return result;
      }
    },
  };
}
```

1. **Catching the Promise:** React catches the thrown Promise at the nearest `<Suspense>` parent boundary.
2. **Fallback Render:** React pauses rendering of the suspended subtree, hides it, and mounts the fallback UI.
3. **Resuming Render:** When the Promise resolves, React restarts the render phase of the suspended subtree.

---

### 2. Next.js App Router (RSC Payload vs. Client Hydration)
The Next.js App Router separates **React Server Components (RSC)** from client components.

#### RSC Wire Format (Simplified Conceptual Model)
Server Components are executed on the server and compiled into a lightweight JSON-like stream (RSC Wire Format). It defines the virtual DOM layout without shipping raw JS.

```
M1:{"id":"./src/components/ClientButton.js","chunks":["client-btn"],"name":""}
J0:["div",{"className":"container"},"Server Title",["$","@M1",{"text":"Click Me"}]]
```
- **`M1`:** Declares a reference to a Client Component with its JS chunk paths.
- **`J0`:** Describes the UI structure, embedding the client component placeholder (`@M1`) and passing props.

#### Streaming HTML & Hydration Flow
```
Server: [Render RSC] -> [Stream HTML + RSC Payload] -> Browser: [Render static HTML]
                                                                     |
                                                                     v
                                                            [Hydrate Client Components]
```
1. **Streaming HTML:** The server streams HTML chunks incrementally. The browser parses and renders this HTML immediately, showing a fast initial page load (FCP).
2. **Selective Hydration:** Rather than waiting for the entire bundle to load, React hydrates component containers as their client scripts load, prioritizing components the user interacts with first.
