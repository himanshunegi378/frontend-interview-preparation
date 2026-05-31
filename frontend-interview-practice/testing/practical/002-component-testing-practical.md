# Practical: Mock Network Interceptor Engine

## Problem Title: Mock Service Server & Component Render Harness

## Difficulty: Senior

## Skills Tested
- Network Request Interception (Monkey-Patching `global.fetch`)
- Mock Response Resolution (Headers, statuses, bodies)
- Virtual DOM render simulation
- Test fixture cleanup lifecycles

## Problem Statement
In testing environments, importing full libraries like MSW and React Testing Library is common. However, understanding their underlying mechanics—how request interception, dynamic route matching, and event dispatch loops function—is a hallmark of a senior engineer.

Implement a mock network interceptor server `MockServer` and a rendering helper `renderComponent` that:
1.  Intercepts all outbound `fetch()` requests when `server.listen()` is called, matching them against registered HTTP handlers.
2.  Supports runtime handler overrides using `server.use(handler)`.
3.  Resets to default handlers on `server.resetHandlers()`.
4.  Restores the original `fetch` global function on `server.close()`.

## Starter Code
```javascript
/**
 * Custom Mock Server to intercept and mock fetch requests.
 */
export class MockServer {
  constructor(defaultHandlers) {
    this.defaultHandlers = defaultHandlers;
    this.activeHandlers = [...defaultHandlers];
    this.originalFetch = global.fetch;
  }

  listen() {
    // Implement monkey patching global.fetch
  }

  use(handler) {
    // Implement prepend override
  }

  resetHandlers() {
    // Implement restore defaults
  }

  close() {
    // Implement restore global.fetch
  }
}
```

## Requirements
- An HTTP handler is represented as: `{ method: "GET", path: "/api/user", response: (req) => ({ status: 200, json: { name: "Alice" } }) }`.
- Intercepted fetches must return a Promise resolving to a mock `Response` object supporting `.json()` and `.status` calls.
- If no route match is found, throw an error or warning indicating an unhandled request.

## Edge Cases
- Parallel requests landing while routes are being modified.
- Path parameters (e.g. matching `/api/user/123` to `/api/user/:id` - optional but good).
- Requests containing query strings (e.g., `/api/user?id=123` must still match `/api/user`).

## Expected Approach
Inside `listen()`:
- Save `global.fetch` to `this.originalFetch`.
- Override `global.fetch` with a custom function `mockFetch(url, options)`.
- Inside `mockFetch`:
  1. Extract path (ignoring query strings and domain parts).
  2. Find matching handler in `this.activeHandlers` from front to back: `handler.method === options.method && handler.path === path`.
  3. If found, evaluate `handler.response(req)` and return a Mock Response:
     ```javascript
     const resData = handler.response({ url, ...options });
     return {
       status: resData.status,
       ok: resData.status >= 200 && resData.status < 300,
       json: async () => resData.json
     };
     ```
  4. If not found, throw error.

## Solution
```javascript
export class MockServer {
  constructor(defaultHandlers = []) {
    this.defaultHandlers = [...defaultHandlers];
    this.activeHandlers = [...defaultHandlers];
    this.originalFetch = null;
    this.isListening = false;
  }

  /**
   * Start intercepting global fetch calls.
   */
  listen() {
    if (this.isListening) return;
    this.isListening = true;
    this.originalFetch = global.fetch;

    global.fetch = async (url, options = {}) => {
      const method = (options.method || "GET").toUpperCase();
      
      // Parse path out of URL (strip domain and query parameters)
      const parsedPath = this._extractPath(url);

      // Find matching handler, checking runtime overrides first (reverse array search)
      const handler = this._findHandler(method, parsedPath);

      if (!handler) {
        throw new Error(`MockServer: Unhandled request ${method} ${parsedPath}`);
      }

      const requestDetails = { url, method, ...options };
      const responseData = handler.response(requestDetails);

      return {
        status: responseData.status || 200,
        ok: (responseData.status || 200) >= 200 && (responseData.status || 200) < 300,
        json: async () => responseData.json || {},
        text: async () => JSON.stringify(responseData.json || {}),
        headers: new Headers(responseData.headers || {})
      };
    };
  }

  /**
   * Temporary runtime handler override.
   */
  use(handler) {
    // Prepend to intercept priority
    this.activeHandlers.unshift(handler);
  }

  /**
   * Restore handlers to defaults.
   */
  resetHandlers() {
    this.activeHandlers = [...this.defaultHandlers];
  }

  /**
   * Stop intercepting and restore global fetch.
   */
  close() {
    if (!this.isListening) return;
    this.isListening = false;
    global.fetch = this.originalFetch;
    this.originalFetch = null;
  }

  _extractPath(url) {
    try {
      // Handle absolute and relative urls
      const urlObj = url.startsWith("http") ? new URL(url) : new URL(url, "http://localhost");
      return urlObj.pathname;
    } catch (e) {
      return url;
    }
  }

  _findHandler(method, path) {
    // Return the first match from active handlers (supports runtime overrides overrides first)
    return this.activeHandlers.find((h) => {
      const matchMethod = h.method.toUpperCase() === method;
      
      // Support basic path parameter matching (wildcard ':id' replacement)
      const pattern = h.path.replace(/:[a-zA-Z0-9_]+/g, "[^/]+");
      const regex = new RegExp(`^${pattern}$`);
      const matchPath = regex.test(path);

      return matchMethod && matchPath;
    });
  }
}
```

## Explanation
- **Monkey-Patching**: Intercepting network requests by temporarily overwriting `global.fetch` allows capturing and redirecting requests without altering client modules.
- **Route Matching (Param Wildcards)**: Using regex mapping to translate parameterized route definitions (e.g. `/api/user/:id`) into matcher patterns ensures realistic API simulation.
- **Deduplication Priority**: Setting `this.activeHandlers.unshift(handler)` prepends runtime overrides to the matching stack, allowing custom error injections (like 500 errors) to run ahead of default success handlers.

## Time Complexity
- **Interception matching**: $O(H)$ where $H$ is the count of registered handlers (linear scan).

## Space Complexity
- **Memory footprint**: $O(H)$ space to hold handler arrays.

---

## Interviewer Follow-ups
1. "What if the request carries headers? How does the handler mock verify them?"
   (Extend the request metadata passed to `handler.response({ headers: options.headers, ... })` to let mock handlers run validation audits on incoming tokens).
2. "Why is this custom server not suitable for browser integration tests?"
   (Monkey-patching `global.fetch` inside node only works for the test runner environment. To mock inside a real browser E2E test, use Service Workers (like MSW) or native browser interceptors (like Playwright's `page.route` API)).

---

## Senior-Level Discussion
Developing custom testing abstractions shows a solid understanding of test harness design.
By writing custom network interceptors, you demystify library setups (like MSW), demonstrating a deep mastery of mock isolation, global registries, and teardown lifecycles.
This is highly relevant when setting up bespoke test runners in resource-constrained environments where installing heavy packages is forbidden.

---

### Extra Practice: Jest & Vitest Snapshot Testing
**Task:** Write a simple component render output checker validating snapshot matches:
```javascript
export function assertSnapshotMatch(actualHtml, expectedHtml) {
  if (actualHtml !== expectedHtml) throw new Error("Snapshot mismatch");
}
```
