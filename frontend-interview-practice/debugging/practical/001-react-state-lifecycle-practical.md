# Practical: Debugging React State & Lifecycle Loops

## Problem Title: React Search Autocomplete Bug Fix

## Difficulty: Senior

## Skills Tested
- React rendering loops diagnostics
- `useEffect` dependency reference matching
- Asynchronous API race condition mitigation
- Network request cancellation (`AbortController`)

## Problem Statement
A developer reports two critical issues inside an Autocomplete Search component:
1.  **Infinite Re-rendering Loop**: When the component mounts, it immediately crashes the tab due to an infinite re-render loop.
2.  **Stale Search Results**: If the loop is bypassed, typing quickly causes a race condition where older search queries override the latest results if the network responds out of order.

Analyze and fix the buggy component.

## Starter Code
```javascript
import React, { useState, useEffect } from "react";

export function AutocompleteSearch({ config }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [requestConfig, setRequestConfig] = useState(config || {});

  // Bug 1: Infinite render loop!
  useEffect(() => {
    setRequestConfig(config);
  }, [config]);

  // Bug 2: Race conditions on search fetches!
  useEffect(() => {
    if (!query) return;

    fetch(`/api/search?q=${query}`)
      .then((res) => res.json())
      .then((data) => setResults(data));
  }, [query]);

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {results.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Requirements
- Fix the infinite render loop caused by the `config` object dependency.
- Resolve the fetch race condition so that only the results corresponding to the latest query are displayed.
- The component must clean up after itself and cancel pending requests when unmounted.

## Edge Cases
- `config` contains dynamic objects that change references but hold identical data (e.g. `{ limit: 10 }`).
- Empty queries (ensure we clear results immediately when the query is empty, rather than leaving stale results on screen).

## Expected Approach
To resolve the loop:
Compare the properties of `config` before updating state, or store it in a ref. Alternatively, avoid syncing the prop to state if it is not modified inside the component. If we must sync it, perform deep equality checking, or listen to specific primitive keys of `config` (like `config.limit`).

To resolve the race condition:
Create an `AbortController` inside the `query` `useEffect`. Pass the `signal` to `fetch`. In the cleanup hook, call `controller.abort()`. Catch `AbortError` in the promise chain and ignore it. Additionally, if the query is empty, set results to an empty array.

## Solution
```javascript
import React, { useState, useEffect, useRef } from "react";

export function AutocompleteSearch({ config }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  
  // Use a ref to cache the configuration, preventing render loop dependencies
  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  }, [config]); // Evaluated on reference updates, but does not trigger state updates

  useEffect(() => {
    // If the input is empty, clear results and exit
    if (!query) {
      setResults([]);
      return;
    }

    const controller = new AbortController();
    const limit = configRef.current?.limit || 10;

    fetch(`/api/search?q=${query}&limit=${limit}`, {
      signal: controller.signal
    })
      .then((res) => {
        if (!res.ok) throw new Error("Search request failed");
        return res.json();
      })
      .then((data) => {
        setResults(data);
      })
      .catch((err) => {
        // Ignore aborted requests safely
        if (err.name === "AbortError") {
          console.log("Fetch aborted for query:", query);
        } else {
          console.error("Search error:", err);
        }
      });

    // Cleanup: aborts active request if query changes or component unmounts
    return () => {
      controller.abort();
    };
  }, [query]);

  return (
    <div>
      <input 
        type="text"
        value={query} 
        onChange={(e) => setQuery(e.target.value)} 
        placeholder="Type to search..."
      />
      <ul>
        {results.map((item, idx) => (
          <li key={idx}>{item}</li>
        ))}
      </ul>
    </div>
  );
}
```

## Explanation
- **Bypassing the State Sync Loop**: By replacing `requestConfig` state with a mutable `configRef`, we eliminate the state update trigger. The ref is updated on every render, but does not trigger a re-render cycle, breaking the loop.
- **Race Condition Interception**: `controller.abort()` cancels the connection at the browser level. If a new key is pressed, the previous query is aborted, preventing stale responses from resolving and overwriting the latest search results.

## Time Complexity
- **Input Update**: $O(1)$ constant time.
- **DOME Renders**: $O(R)$ where $R$ is the size of the results array returned from the server.

## Space Complexity
- **Memory footprint**: $O(R)$ space to store the results array in the state.

---

## Interviewer Follow-ups
1. "How would you add a debounce to this input to prevent flooding the server?"
   (Store the query in a localized state, but update a separate `debouncedQuery` state variable inside a setTimeout debouncer. Bind the `useEffect` fetch hook to the `debouncedQuery` instead of the raw `query` input).
2. "What if the browser does not support AbortController (legacy clients)?"
   (Use an `active` boolean flag pattern inside the effect: set `let active = true;` on start, set `active = false` during cleanup, and check `if (active) setResults(...)` inside the fetch resolve block).

---

## Senior-Level Discussion
Debugging state loop dependencies and async race conditions is a core requirement when building search-heavy frontends.
By encapsulating updates in clean lifecycles, caching configurations inside refs, and aborting stale connections, you protect systems from client crash failures and server overload.
This demonstrates a deep understanding of React fiber updates, closure bindings, and browser connection lifecycles.
