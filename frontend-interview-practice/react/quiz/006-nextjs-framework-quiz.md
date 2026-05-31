# Quiz: Next.js Framework & Server Components

## Questions

### Question 1 (Medium - Client/Server Import Rules)
Which of the following operations are allowed inside a React Server Component (RSC), and which are restricted to Client Components (`"use client"`)?
- A) Fetching data directly from database engines (e.g. `pg` or `Prisma`).
- B) Attaching event handlers like `onClick` to elements.
- C) Reading parameters from the URL path.
- D) Utilizing `useContext` to share UI state themes.

---

### Question 2 (Hard - Hydration Mismatch Resolution)
Identify the hydration error inside this component and explain the fix.
```javascript
import React from "react";

export function TimeBadge() {
  const isServer = typeof window === "undefined";
  
  return (
    <div class="badge">
      Logged at: {isServer ? "ServerTime" : localStorage.getItem("loginTime")}
    </div>
  );
}
```

---

### Question 3 (Senior - RSC Data Fetching Deduplication)
If three nested Server Components on the same page call `fetch('https://api.example.com/user')` simultaneously during rendering, does Next.js duplicate the network requests? How does Next.js optimize nested data fetching?

---

## Answer Key & Explanations

### Question 1: Server vs. Client Component Capabilities
- **Difficulty:** Medium
- **Answer:**
  - **Allowed in RSC**: A (Fetching data directly from databases), C (Reading parameters from the URL path via page props).
  - **Restricted to Client Components**: B (Attaching event handlers like `onClick`), D (Utilizing `useContext` to share UI state themes).
- **Explanation:**
  - Server Components execute on the server, allowing them to access server resources (like databases and APIs) directly. Since they do not run in the browser, they cannot attach event listeners (which require the DOM) or use hooks like `useContext` and `useState` (which manage client-side state).
  - Client Components handle user interactions, hooks, and browser APIs.
- **Common Mistakes:** Thinking that Client Components only render on the client. (Client Components are still pre-rendered to HTML on the server during SSR).
- **Senior-Level Insight:** Use Server Components for data fetching and layout shells, and use Client Components for interactive elements like forms, modals, and buttons to minimize client-side JavaScript.

---

### Question 2: Environmental Hydration Discrepancies
- **Difficulty:** Hard
- **Answer:** This causes a hydration mismatch error because the initial markup rendered on the server differs from the initial markup rendered in the browser.
- **Explanation:**
  - On the server, `isServer` is `true`, so the server renders: `Logged at: ServerTime`.
  - In the browser, during the initial render pass, `isServer` is `false`, and React attempts to evaluate `localStorage.getItem("loginTime")`.
  - React's hydration engine compares the server-rendered HTML with the client's initial Virtual DOM. Since `ServerTime` does not match the local storage value, React throws a hydration mismatch error.
  - **Fix**: Use a mounted state check to ensure client-only values are rendered only after hydration is complete:
    ```javascript
    import { useState, useEffect } from "react";

    export function TimeBadge() {
      const [mounted, setMounted] = useState(false);
      useEffect(() => setMounted(true), []);

      if (!mounted) {
        return <div class="badge">Logged at: Loading...</div>; // Match server markup
      }

      return (
        <div class="badge">
          Logged at: {localStorage.getItem("loginTime")}
        </div>
      );
    }
    ```
- **Common Mistakes:** Using window or browser storage checks directly inside the render path.
- **Senior-Level Insight:** During hydration, the initial client render must match the server-rendered HTML exactly. Use `useEffect` to safely defer client-only rendering until the component has mounted.

---

### Question 3: Request Memorization in Next.js
- **Difficulty:** Senior
- **Answer:** No, the request is not duplicated. Next.js automatically dedupes identical `fetch` requests within the same render pass using **Request Memoization**.
- **Explanation:**
  - In the App Router, Next.js overrides the global `fetch` API.
  - When a fetch is executed, Next.js checks if a request with the same URL and options has already been made in this render pass.
  - If a match is found, Next.js returns the cached promise, preventing duplicate network requests.
  - This memoization only lasts for the duration of the current request rendering cycle (it is not shared across users or page reloads).
- **Common Mistakes:** Creating complex context providers to pass data down to avoid duplicate fetches.
- **Interviewer Follow-up:** "How do you bypass request memoization when you need fresh data?" (Pass `{ cache: 'no-store' }` or use the `unstable_noStore()` helper).
- **Senior-Level Insight:** Request memoization allows you to fetch data directly inside the components that need it, simplifying data flow and keeping components self-contained.

---

### Question 4 (Optimistic UI Rollbacks)
Explain how to manage rollback synchronization in Optimistic UI updates.
**Answer:** Record the previous state in a closure before triggering the fetch. If the request fails, dispatch the saved state to restore the UI.
