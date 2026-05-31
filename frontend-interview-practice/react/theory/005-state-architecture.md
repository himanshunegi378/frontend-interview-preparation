# React State Management Architecture: Context, Zustand, Redux, & TanStack Query

## Why It Matters
Senior frontend engineers must design scalable state management systems to prevent performance bottlenecks, reduce boilerplate, and simplify testing. Mismanaging state classification leads to excessive re-renders, bloated client bundles, and out-of-sync cache states.

---

## Core Concepts & Mental Models

### 1. State Classification Matrix
To build clean architectures, divide state into distinct categories:
- **Local State**: State used by a single component or its immediate children (managed via `useState`).
- **Global Client State**: Client-side UI state accessed by multiple independent components (e.g. theme, sidebar toggle, modal registry).
- **Server Cache State**: Client-side copy of database records fetched from APIs. Requires cache invalidation, loading indicators, and retry loops.
- **URL State**: State stored in the address bar (e.g. search query, active tab). Offers deep linking support out of the box.

```
State Architecture Flow:
┌───────────────────────────┐
│        Server Data        │
└─────────────┬─────────────┘
              ▼ (REST / GraphQL)
┌───────────────────────────┐
│     Server State Cache    │ ◄─── Managed by TanStack Query (auto-updates)
│    (User Profile, Feeds)  │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│    Global Client State    │ ◄─── Managed by Zustand / Redux (UI States)
│   (Sidebar Open, Themes)  │
└─────────────┬─────────────┘
              ▼
┌───────────────────────────┐
│        Local State        │ ◄─── Managed by useState (Text Fields, Modals)
└───────────────────────────┘
```

### 2. Context API Slicing & Render Bottlenecks
The React Context API is a dependency injection tool, **not** a state management library.
- **The Re-render Trap**: When a Context provider's value changes, **all** components consuming that context are forced to re-render, even if they only read a subset of properties that did not change.
- **Optimization Strategies**:
  - **Colocation**: Keep state as close to where it is used as possible.
  - **Context Splitting**: Divide large configurations into separate providers (e.g. `ThemeContext` vs. `UserSettingsContext`).
  - **Memoization**: Wrap context children in `React.memo` or use `useMemo` for provider values.

### 3. Client Stores: Redux vs. Zustand
- **Redux (RTK)**:
  - **Pros**: Structured architecture, powerful DevTools, excellent for large teams with complex client-side rules.
  - **Cons**: High boilerplate, increases bundle sizes, fits poorly for simple UI states.
- **Zustand (Lightweight Pub/Sub)**:
  - **Pros**: Zero-boilerplate, hooks-based API, utilizes selectors to prevent unnecessary re-renders, tiny footprint (under 2KB).
  - **Cons**: Less opinionated, requires developer discipline to keep actions organized.

### 4. Server State Cache (TanStack Query)
Traditionally, developers used Redux to cache API responses.
**TanStack Query (React Query)** decouples server caching from client state management. It provides:
- Automatic cache invalidation and background refetching.
- Out-of-the-box loading, error, and stale states.
- Request deduplication and garbage collection of unused query results.

---

## Real-World Case Study / Examples

### 1. The Bloated Settings Context
A settings provider manages user profile state and active theme. Updating the theme forces the heavy `UserProfile` component to re-render because they share the same provider:

```javascript
// Bad: Combined Context
const SettingsContext = createContext();

function App() {
  const [theme, setTheme] = useState("light");
  const [user, setUser] = useState(null);
  
  return (
    <SettingsContext.Provider value={{ theme, setTheme, user, setUser }}>
      <Sidebar />
      <HeavyUserProfile />
    </SettingsContext.Provider>
  );
}
```
**Fix:** Split into `ThemeContext` and `UserContext` providers, or migrate client-side state to Zustand.

---

## Common Interview Traps

### 1. Re-render triggers in Context Selectors
```javascript
// Trap: Returning a new object reference on every render!
const useTheme = () => {
  const context = useContext(SettingsContext);
  return { theme: context.theme, setTheme: context.setTheme }; 
};
```
**Trap:** Returning a new object literal inside a custom context hook. Even if `theme` does not change, the object reference changes on every render, forcing consumers to re-render.
**Fix:** Return primitive values directly, or memoize context provider properties.

---

## Junior vs. Senior View

- **Junior View**: "I put all my API responses and UI states inside Redux or a giant Context provider so I can access them from anywhere."
- **Senior View**: "I categorize state to keep architectures clean. I offload server caches to TanStack Query, use Zustand for global client-side UI states, and use local state for scoped components. I avoid Context API for high-frequency updates to prevent render bottlenecks, and keep states colocated to optimize performance."

---

## Related Interview Questions
1. "Explain the difference between how React Context and Zustand trigger component re-renders."
2. "Why is caching server state in Redux considered an anti-pattern in modern React applications?"
3. "How does TanStack Query's `staleTime` differ from `cacheTime`?"
4. "How do you implement a custom state selector in a publish-subscribe store model?"
