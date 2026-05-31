# PART 4: SENIOR CODING CHALLENGES & ARCHITECTURAL PATTERNS

## Module 4.1: High-Performance UI Components

### 1. High-Performance Virtualized List from Scratch
A virtualized list renders only the visible items in the viewport, maintaining constant time $O(1)$ memory usage and DOM rendering counts regardless of list size.

```typescript
import React, { useRef, useState, useEffect, UIEvent } from "react";

interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  viewportHeight: number;
  bufferSize?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
}

export function VirtualList<T>({
  items,
  itemHeight,
  viewportHeight,
  bufferSize = 3,
  renderItem,
}: VirtualListProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  const totalHeight = items.length * itemHeight;

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - bufferSize);
  const endIndex = Math.min(
    items.length - 1,
    Math.floor((scrollTop + viewportHeight) / itemHeight) + bufferSize
  );

  const handleScroll = (event: UIEvent<HTMLDivElement>) => {
    setScrollTop(event.currentTarget.scrollTop);
  };

  const visibleItems = [];
  for (let i = startIndex; i <= endIndex; i++) {
    const item = items[i];
    const topPosition = i * itemHeight;
    visibleItems.push(
      <div
        key={i}
        style={{
          position: "absolute",
          top: 0,
          transform: `translateY(${topPosition}px)`,
          width: "100%",
          height: `${itemHeight}px`,
        }}
      >
        {renderItem(item, i)}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      style={{
        height: `${viewportHeight}px`,
        overflowY: "auto",
        position: "relative",
        width: "100%",
      }}
    >
      <div style={{ height: `${totalHeight}px`, width: "100%", position: "relative" }}>
        {visibleItems}
      </div>
    </div>
  );
}
```

---

### 2. Infinite Scroll with ResizeObserver and IntersectionObserver
Dynamic items can change height at runtime. We use `ResizeObserver` to track content dimensions, and `IntersectionObserver` to trigger infinite scroll page boundaries.

```typescript
import React, { useEffect, useRef, useState } from "react";

interface InfiniteScrollProps {
  onLoadMore: () => Promise<void>;
  hasMore: boolean;
  loading: boolean;
}

export const InfiniteScrollContainer: React.FC<InfiniteScrollProps> = ({
  onLoadMore,
  hasMore,
  loading,
}) => {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [sentinelHeight, setSentinelHeight] = useState(0);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setSentinelHeight(entry.contentRect.height);
      }
    });
    resizeObserver.observe(sentinel);

    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting && hasMore && !loading) {
          onLoadMore();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);

    return () => {
      resizeObserver.disconnect();
      observer.disconnect();
    };
  }, [onLoadMore, hasMore, loading]);

  return (
    <div className="infinite-container">
      <div ref={sentinelRef} style={{ height: "20px", background: "transparent" }} />
    </div>
  );
};
```

---

### 3. Accessible Compound Components Design System
Compound components share implicit state to work together as a unified UI module. Below is a WAI-ARIA compliant, key-navigable Accordion.

```typescript
import React, { createContext, useContext, useState, useId } from "react";

interface AccordionContextType {
  activeId: string | null;
  toggleId: (id: string) => void;
}

const AccordionContext = createContext<AccordionContextType | null>(null);

export const Accordion: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  const toggleId = (id: string) => {
    setActiveId((prev) => (prev === id ? null : id));
  };

  return (
    <AccordionContext.Provider value={{ activeId, toggleId }}>
      <div role="presentation" style={{ border: "1px solid #ccc", borderRadius: "4px" }}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
};

export const AccordionItem: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  return <div style={{ borderBottom: "1px solid #ccc" }}>{children}</div>;
};

export const AccordionHeader: React.FC<{ id: string; title: string }> = ({ id, title }) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionHeader must be inside Accordion");

  const isOpen = context.activeId === id;
  const buttonId = useId();
  const panelId = useId();

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      context.toggleId(id);
    }
  };

  return (
    <h3>
      <button
        id={buttonId}
        type="button"
        aria-expanded={isOpen}
        aria-controls={panelId}
        onClick={() => context.toggleId(id)}
        onKeyDown={handleKeyDown}
        style={{
          width: "100%",
          padding: "1rem",
          textAlign: "left",
          border: "none",
          background: "none",
          cursor: "pointer",
          fontWeight: "bold",
        }}
      >
        {title}
      </button>
    </h3>
  );
};

export const AccordionPanel: React.FC<{ id: string; children: React.ReactNode }> = ({ id, children }) => {
  const context = useContext(AccordionContext);
  if (!context) throw new Error("AccordionPanel must be inside Accordion");

  const isOpen = context.activeId === id;

  return (
    <div
      role="region"
      hidden={!isOpen}
      style={{
        padding: "1rem",
        display: isOpen ? "block" : "none",
      }}
    >
      {children}
    </div>
  );
};
```

---

## Module 4.2: Enterprise State Management & State Machines

### 1. Custom Micro-State Manager (Zustand-Style)
This custom state manager supports selector-based component subscriptions to prevent unnecessary re-renders.

```typescript
import { useSyncExternalStore } from "react";

type Listener = () => void;
type Selector<T, Slice> = (state: T) => Slice;

export class MicroStore<T> {
  private state: T;
  private listeners = new Set<Listener>();

  constructor(initialState: T) {
    this.state = initialState;
  }

  public getState = (): T => {
    return this.state;
  };

  public setState = (nextState: Partial<T> | ((state: T) => Partial<T>)): void => {
    const next = typeof nextState === "function" ? nextState(this.state) : nextState;
    this.state = { ...this.state, ...next };
    this.listeners.forEach((listener) => listener());
  };

  public subscribe = (listener: Listener): (() => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };

  public useStore = <Slice>(selector: Selector<T, Slice>): Slice => {
    return useSyncExternalStore(
      this.subscribe,
      () => selector(this.state),
      () => selector(this.state)
    );
  };
}
```

---

### 2. Finite State Machine (FSM) Engine
An FSM structure coordinates complex state transitions, enforcing compile-time validation.

```typescript
type Transitions<TState extends string, TEvent extends string> = {
  [S in TState]: {
    [E in TEvent]?: TState;
  };
};

export class StateMachine<TState extends string, TEvent extends string> {
  private currentState: TState;
  private transitions: Transitions<TState, TEvent>;
  private onTransitionListeners: Set<(state: TState, event: TEvent) => void> = new Set();

  constructor(initialState: TState, config: Transitions<TState, TEvent>) {
    this.currentState = initialState;
    this.transitions = config;
  }

  public get state(): TState {
    return this.currentState;
  }

  public transition(event: TEvent): TState {
    const nextState = this.transitions[this.currentState]?.[event];
    if (!nextState) {
      throw new Error(`Invalid transition: Event '${event}' cannot be triggered from state '${this.currentState}'`);
    }

    const previousState = this.currentState;
    this.currentState = nextState;
    this.onTransitionListeners.forEach((listener) => listener(nextState, event));
    return this.currentState;
  }

  public onTransition(listener: (state: TState, event: TEvent) => void): () => void {
    this.onTransitionListeners.add(listener);
    return () => {
      this.onTransitionListeners.delete(listener);
    };
  }
}
```

---

## Module 4.3: Robust Utility Polyfills & API Resiliency

### 1. Robust Debounce and Throttle Implementation
```typescript
export function debounce<Args extends any[]>(
  func: (...args: Args) => void,
  wait: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Args | null = null;
  let invokeImmediate = false;

  const debounced = (...args: Args) => {
    lastArgs = args;
    const isLeading = options.leading && !timeoutId;

    if (timeoutId) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      timeoutId = null;
      if (options.trailing !== false && lastArgs) {
        func(...lastArgs);
        lastArgs = null;
      }
    }, wait);

    if (isLeading) {
      func(...args);
      lastArgs = null;
    }
  };

  debounced.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastArgs = null;
  };

  return debounced;
}

export function throttle<Args extends any[]>(
  func: (...args: Args) => void,
  limit: number,
  options: { leading?: boolean; trailing?: boolean } = {}
) {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastArgs: Args | null = null;
  let lastCallTime = 0;

  const throttled = (...args: Args) => {
    const now = Date.now();
    lastArgs = args;

    if (lastCallTime === 0 && options.leading === false) {
      lastCallTime = now;
    }

    const remaining = limit - (now - lastCallTime);

    if (remaining <= 0 || remaining > limit) {
      if (timeoutId) {
        clearTimeout(timeoutId);
        timeoutId = null;
      }
      func(...args);
      lastCallTime = now;
      lastArgs = null;
    } else if (!timeoutId && options.trailing !== false) {
      timeoutId = setTimeout(() => {
        lastCallTime = options.leading === false ? 0 : Date.now();
        timeoutId = null;
        if (lastArgs) {
          func(...lastArgs);
          lastArgs = null;
        }
      }, remaining);
    }
  };

  throttled.cancel = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
    lastCallTime = 0;
    lastArgs = null;
  };

  return throttled;
}
```

---

### 2. Deep Clone Utility with Circular Reference Handling
```typescript
export function deepClone<T>(value: T, seen = new WeakMap<any, any>()): T {
  if (value === null || typeof value !== "object") {
    return value;
  }

  if (seen.has(value)) {
    return seen.get(value);
  }

  if (value instanceof Date) {
    return new Date(value.getTime()) as unknown as T;
  }

  if (value instanceof RegExp) {
    return new RegExp(value.source, value.flags) as unknown as T;
  }

  if (value instanceof Map) {
    const copy = new Map();
    seen.set(value, copy);
    value.forEach((val, key) => {
      copy.set(deepClone(key, seen), deepClone(val, seen));
    });
    return copy as unknown as T;
  }

  if (value instanceof Set) {
    const copy = new Set();
    seen.set(value, copy);
    value.forEach((val) => {
      copy.add(deepClone(val, seen));
    });
    return copy as unknown as T;
  }

  if (Array.isArray(value)) {
    const copy: any[] = new Array(value.length);
    seen.set(value, copy);
    for (let i = 0; i < value.length; i++) {
      copy[i] = deepClone(value[i], seen);
    }
    return copy as unknown as T;
  }

  const prototype = Object.getPrototypeOf(value);
  const copy = Object.create(prototype);
  seen.set(value, copy);

  const keys = Reflect.ownKeys(value);
  for (const key of keys) {
    const descriptor = Object.getOwnPropertyDescriptor(value, key);
    if (descriptor) {
      Object.defineProperty(copy, key, {
        ...descriptor,
        value: deepClone((value as any)[key], seen),
      });
    }
  }

  return copy;
}
```

---

### 3. Resilient Fetch Wrapper with Exponential Backoff and Jitter
```typescript
interface ResilientFetchOptions extends RequestInit {
  retries?: number;
  factor?: number;
  minTimeoutMs?: number;
  maxTimeoutMs?: number;
  retryPredicate?: (error: any, response?: Response) => boolean;
}

export async function resilientFetch(
  url: string | URL,
  options: ResilientFetchOptions = {}
): Promise<Response> {
  const retries = options.retries ?? 3;
  const factor = options.factor ?? 2;
  const minTimeoutMs = options.minTimeoutMs ?? 1000;
  const maxTimeoutMs = options.maxTimeoutMs ?? 10000;
  const retryPredicate = options.retryPredicate ?? ((error, response) => {
    if (error) return true;
    if (response) {
      return response.status === 429 || (response.status >= 500 && response.status < 600);
    }
    return false;
  });

  let attempt = 0;

  while (true) {
    try {
      const response = await fetch(url, options);

      if (!response.ok && retryPredicate(null, response) && attempt < retries) {
        const delay = calculateJitterDelay(attempt, factor, minTimeoutMs, maxTimeoutMs);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }

      return response;
    } catch (error) {
      if (retryPredicate(error) && attempt < retries) {
        const delay = calculateJitterDelay(attempt, factor, minTimeoutMs, maxTimeoutMs);
        await new Promise((r) => setTimeout(r, delay));
        attempt++;
        continue;
      }
      throw error;
    }
  }
}

function calculateJitterDelay(
  attempt: number,
  factor: number,
  minTimeoutMs: number,
  maxTimeoutMs: number
): number {
  const baseDelay = minTimeoutMs * Math.pow(factor, attempt);
  const cappedDelay = Math.min(baseDelay, maxTimeoutMs);
  return Math.random() * cappedDelay;
}
```
