# Quiz: React State & Lifecycle Loops

## Questions

### Question 1 (Easy/Medium - Reference Dependency Infinite Loop)
Analyze the following component:
```javascript
import React, { useState, useEffect } from "react";

export function ProfileCard() {
  const [userData, setUserData] = useState({ name: "Alice", role: "guest" });

  useEffect(() => {
    // Update role if guest
    if (userData.role === "guest") {
      setUserData({ name: "Alice", role: "member" });
    }
  }, [userData]); // Dependency array

  return <div>{userData.name} - {userData.role}</div>;
}
```
Does this component render successfully or trigger an infinite loop? Explain the reference check mechanics.

---

### Question 2 (Medium - Stale Closure inside Window Listeners)
A developer implements a window event listener to capture keyboard shortcuts inside a chat application:
```javascript
import React, { useState, useEffect } from "react";

export function ChatInput() {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        console.log("Current messages list size:", messages.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []); // Empty dependencies list

  return <input value={inputValue} onChange={(e) => setInputValue(e.target.value)} />;
}
```
Every time the user hits Enter, the log outputs: `Current messages list size: 0`, even after messages have been added to the state. Why?

---

### Question 3 (Senior - Race Condition Sequence in Autocomplete Search)
Suppose a user types `"cat"` inside an autocomplete search bar.
The typing triggers three network calls:
1.  Query `"c"` is sent (Request A) - takes 800ms.
2.  Query `"ca"` is sent (Request B) - takes 400ms.
3.  Query `"cat"` is sent (Request C) - takes 100ms.
Trace the order of state resolution in a naive `useEffect` fetch setup, and write the fixed implementation using an `AbortController` to cancel stale requests.

---

## Answer Key & Explanations

### Question 1: Object Reference Inequality
- **Difficulty:** Easy/Medium
- **Answer:** 
  The component triggers an **infinite loop**, freezing the browser tab.
- **Explanation:**
  - On mount, the component renders with `userData = { name: "Alice", role: "guest" }`.
  - The `useEffect` executes because it is the initial render.
  - Since `userData.role` is `"guest"`, the code calls `setUserData({ name: "Alice", role: "member" })`.
  - This schedules a state update, triggering a second render pass.
  - In the second render, `userData` is a new object reference: `{ name: "Alice", role: "member" }`.
  - The `useEffect` comparison engine evaluates the dependency array: `prevUserData === nextUserData`.
  - Because two separate object literals in JavaScript are never equal by reference (`{}` !== `{}`), React determines that the dependency has changed and executes the effect body again.
  - Inside the effect body, the role is `"member"`, so the `setUserData` call is bypassed.
  - However, because the effect was executed again, React schedules *another* check cycle. Since new objects are created on every render, the reference mismatch continues indefinitely, locking the thread.
- **Fix**:
  Extract the specific primitive string value to check in the dependencies array:
  ```javascript
  useEffect(() => {
    if (userData.role === "guest") {
      setUserData({ name: "Alice", role: "member" });
    }
  }, [userData.role]); // Listen to the primitive string, not the object reference
  ```

---

### Question 2: Event Listener Stale Closure
- **Difficulty:** Medium
- **Answer:** 
  The event listener holds a stale closure of `messages`, referencing the initial empty array `[]` allocated on mount.
- **Explanation:**
  - The `useEffect` hook runs once on mount due to the empty dependency array `[]`.
  - Inside this effect, the `handleKeyDown` function is created. It captures a reference to the `messages` array in its scope (which is empty, `[]`).
  - When messages update later (via parent changes or input additions), React re-renders the component.
  - However, because dependencies list is empty, the effect is skipped. The listener remains bound to the *first* instance of `handleKeyDown` created on mount.
  - When the user presses Enter, the listener runs, referencing the initial `messages` array stored in its closure, logging `0`.
- **Fix**:
  Store the messages list in a mutable React ref that stays stable across renders:
  ```javascript
  const messagesRef = useRef(messages);
  useEffect(() => {
    messagesRef.current = messages; // Keep ref updated
  }, [messages]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter") {
        console.log("Current messages list size:", messagesRef.current.length);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  ```

---

### Question 3: Async Race Condition & AbortController Fix
- **Difficulty:** Senior
- **Answer:** 
  The search results resolve out of order: Request C completes first (100ms), followed by Request B (400ms), followed by Request A (800ms). The screen displays results for Query `"c"` instead of `"cat"`.
- **Explanation:**
  - **Resolution Timeline**:
    *   T+100ms: Request C resolves. Results for `"cat"` are set.
    *   T+400ms: Request B resolves. Results for `"ca"` overwrite `"cat"`.
    *   T+800ms: Request A resolves. Results for `"c"` overwrite `"ca"`.
  - The client sees the stale data for `"c"`, despite the input containing `"cat"`.
- **Fix**:
  Cancel the active fetch request inside the `useEffect` cleanup hook using an `AbortController`:
  ```javascript
  useEffect(() => {
    if (!query) return;

    const controller = new AbortController();

    fetch(`/api/search?q=${query}`, { signal: controller.signal })
      .then((res) => res.json())
      .then((data) => setResults(data))
      .catch((err) => {
        if (err.name === "AbortError") {
          console.log("Fetch aborted safely");
        } else {
          handleError(err);
        }
      });

    // Cleanup: aborts the active request if query changes before resolution
    return () => {
      controller.abort();
    };
  }, [query]);
  ```
- **Senior-Level Insight:** Aborting connections cancels TCP requests on the network, saving server-side processing bandwidth and preventing race conditions client-side.

---

### Question 4 (Duplicate API Calls)
Explain why API handlers call duplicate requests inside `useEffect` under React StrictMode.
**Answer:** StrictMode mounts, unmounts, and re-mounts every component on startup to surface cleanup leaks. If effect cleanup triggers are missing, duplicate calls occur.
