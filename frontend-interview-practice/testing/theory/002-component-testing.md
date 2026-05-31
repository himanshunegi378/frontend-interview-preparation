# Testing: Component Testing with RTL & MSW

## Why It Matters
Component testing verifies that the modular building blocks of our UI render correctly, manage state updates, and integrate with backend APIs. Using patch-based global mocks (like overriding `window.fetch` with manual stubs) is brittle and frequently misses bugs like invalid request headers or incorrect body parsing. Senior engineers must mock the network layer using **Mock Service Worker (MSW)** and test components using **React Testing Library (RTL)** to build resilient, high-fidelity integration test suites.

---

## Core Concepts & Mental Models

### 1. React Testing Library (RTL) Philosophy
RTL operates on the core principle: *The more your tests resemble the way your software is used, the more confidence they can give you.*
*   **Encapsulated Render**: RTL mounts the component inside an isolated JSDOM environment.
*   **User Events**: Use `@testing-library/user-event` to simulate user actions (typing, clicking, hovering) because it triggers all corresponding browser-native events (focus, keydown, change), whereas `fireEvent` only dispatches the target event synthetically.
*   **Queries**: Locate elements using accessible roles (`getByRole`), label associations (`getByLabelText`), or visible text (`getByText`).

### 2. Mock Service Worker (MSW) Architecture
MSW intercepts network requests at the browser network layer using the **Service Worker API** (or node http interceptor hooks for server-side JSDOM runs):

```
[ Component ] ──> HTTP Request (fetch) ──> [ Browser Network Layer ]
                                                    │ (MSW Intercepts)
                                                    ▼
[ Component UI Updates ] <── JSON Mock Response <── [ MSW Mock Service ]
```

*   **No Global Mocks**: Because MSW runs outside the JavaScript execution context, it intercepts requests at the transport level. This leaves your client-side fetch clients (Axios, Fetch, Apollo) completely unmodified, testing your true network code.
*   **Declarative Handlers**: Define mock routes that return mock JSON responses, headers, and status codes.

---

## Real-World Case Study / Examples

### Setting up a Mock Service Worker Test Environment

1.  **Define Request Handlers**:
    ```javascript
    // src/mocks/handlers.js
    import { http, HttpResponse } from "msw";

    export const handlers = [
      http.get("/api/user", () => {
        return HttpResponse.json({ id: "user-123", name: "Bob" });
      }),
      http.post("/api/user/settings", async ({ request }) => {
        const data = await request.json();
        return HttpResponse.json({ success: true, updated: data });
      })
    ];
    ```
2.  **Configure test server setup**:
    ```javascript
    // src/mocks/server.js
    import { setupServer } from "msw/node";
    import { handlers } from "./handlers";

    export const server = setupServer(...handlers);
    ```
3.  **Integrate with test suite lifecycles**:
    ```javascript
    // src/setupTests.js
    import { server } from "./mocks/server";

    beforeAll(() => server.listen());
    afterEach(() => server.resetHandlers()); // Clears runtime mock overrides
    afterAll(() => server.close());
    ```

---

## Common Interview Traps

### The "Forgot to reset MSW handlers" Trap
*   **The Trap**: Writing tests where test #1 overrides an endpoint (`server.use(http.get('/api/user', ...))`), but test #2 fails because it receives the overridden response instead of the default handler.
*   **The Solution**: Ensure `server.resetHandlers()` is called inside the `afterEach` hook to clear temporary request intercept overrides between test runs.

---

## Junior vs. Senior View

*   **Junior View**: "Mock the fetch function globally: `global.fetch = jest.fn().mockResolvedValue(...)`. Use `fireEvent` to click buttons, and assert styles by checking CSS class names."
*   **Senior View**: "Verify component integration profiles by rendering real trees in RTL and simulating actions using `userEvent`. Stub network boundaries using MSW to preserve fetch client configuration, and isolate tests by resetting handlers in lifecycles to prevent test contamination."

---

## Related Interview Questions
1. "How does `userEvent.type()` differ from `fireEvent.change()` under the hood?"
2. "Why is MSW superior to mocking custom fetch wrapper hooks (like `useFetch`)?"
3. "How do you test a component that displays a loading spinner for a slow API call before displaying data?"
4. "Explain how to mock the global `localStorage` API in a JSDOM testing environment."

---

## Snapshot testing tradeoffs & Jest/Vitest
Snapshot tests write component markup trees to disk, asserting matches on later runs.
- **Tradeoffs**: Extremely brittle. Any styling change or CSS class update invalidates snapshots, leading to developer review fatigue. Prefer asserting structural elements (roles, texts) over snapshots.
