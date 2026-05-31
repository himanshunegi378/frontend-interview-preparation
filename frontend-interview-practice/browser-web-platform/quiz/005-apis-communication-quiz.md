# Quiz: API Communication, WebSockets, & Server-Sent Events

## Questions

### Question 1 (Easy/Medium - GraphQL Payload Over-fetching)
Consider a profile header component that only needs to display the current user's profile image and display name. 
If the backend exposing user details uses a standard REST endpoint `/api/users/me` returning 100+ properties (address, billing history, preferences), and the GraphQL alternative uses `/graphql` with a custom query, compare the payload overhead and explain how the client queries only what it needs.

---

### Question 2 (Medium/Hard - SSE Connection Limits on HTTP/1.1 vs. HTTP/2)
A user opens 7 separate browser tabs of your real-time analytics dashboard. The application uses Server-Sent Events (`EventSource`) to receive real-time metrics. 
If the server hosting the app only supports HTTP/1.1, explain why the 7th tab fails to load and blocks all other network fetches to the site. How does upgrading the server to HTTP/2 resolve this issue?

---

### Question 3 (Senior - Cross-Site WebSocket Hijacking - CSWSH)
The browser's Same-Origin Policy (SOP) restricts scripts on `attacker.com` from reading HTTP responses from `bank.com`. 
However, WebSockets do not follow the Same-Origin Policy. If a user is logged in to `bank.com` and visits `attacker.com`, explain how `attacker.com` can establish a connection to `wss://bank.com/ws` to steal the user's data, and detail the mechanisms the server must implement to block this attack.

---

## Answer Key & Explanations

### Question 1: Field Selection and Over-fetching Mitigation
- **Difficulty:** Easy/Medium
- **Answer:** 
  REST forces the client to download the entire user model, wasting bandwidth. GraphQL solves this by letting the client send a structured query containing only the required fields.
- **Explanation:**
  - **REST**: The client requests `GET /api/users/me`. The server responds with a fixed JSON schema containing profile details, addresses, settings, and other metadata. The client ignores 98% of the data, but pays the cost of downloading and parsing it.
  - **GraphQL**: The client sends a POST request with the query:
    ```graphql
    query {
      me {
        displayName
        avatarUrl
      }
    }
    ```
  - The GraphQL engine resolves only those two fields and returns a matching JSON object: `data: { me: { displayName: "Alice", avatarUrl: "..." } }`, saving bandwidth and CPU processing time on mobile clients.
- **Senior-Level Insight:** While GraphQL optimizes payloads, it shifts computational complexity to the server. Senior developers must secure GraphQL endpoints with query depth limiting to prevent malicious clients from sending circular, deeply nested queries (e.g. `user { friends { friends { friends } } }`) that crash the server's database.

---

### Question 2: Browser Connection Limits and Multiplexing
- **Difficulty:** Medium/Hard
- **Answer:** 
  Under HTTP/1.1, browsers enforce a limit of **6 persistent TCP connections** per unique domain. The 7th tab runs out of connections and hangs, blocking all other network operations. HTTP/2 resolves this by multiplexing thousands of requests over a single TCP connection.
- **Explanation:**
  - **HTTP/1.1 Limit**: Because SSE holds the connection open indefinitely, each tab running `EventSource` consumes one TCP socket.
  - When the 7th tab is opened, it attempts to establish an SSE stream. However, the browser has already exhausted its limit of 6 connections to that domain.
  - The browser queues the 7th request, waiting for one of the other tabs to close. As a result, the tab hangs, and any standard API calls (`fetch`) to the same domain are blocked.
  - **HTTP/2 Solution**: HTTP/2 introduces **request multiplexing**. It establishes a single TCP connection to the domain. Inside this single connection, the browser multiplexes thousands of independent, concurrent streams.
  - Thus, all 7 tabs share the same single TCP connection, eliminating the socket limit issue.
- **Common Mistakes:** Trying to solve the connection limit by setting up manual socket reconnect loops in JavaScript, which does not address the underlying browser socket limit.
- **Senior-Level Insight:** When designing real-time portals, ensure HTTP/2 is enabled on your reverse proxies (e.g. Nginx, Cloudflare). If HTTP/2 is unavailable, implement a **Shared Worker** to manage a single SSE connection, sharing the data across all active browser tabs via `postMessage`.

---

### Question 3: CSWSH Vulnerabilities & Origin Validation
- **Difficulty:** Senior
- **Answer:** 
  An attacker can trigger CSWSH because the browser automatically attaches the victim's session cookie to the initial WebSocket handshake request. Since SOP does not block cross-origin WebSocket connections, the connection succeeds. 
  The server must validate the `Origin` header during the handshake and enforce CSRF protection tokens to block the attack.
- **Explanation:**
  - **The Attack**: When JavaScript on `attacker.com` executes `new WebSocket("wss://bank.com/ws")`, the browser starts an HTTP handshake.
  - Because it is a request to `bank.com`, the browser automatically includes any stored cookies for `bank.com` (session cookies) in the request headers.
  - Since WebSockets are exempt from the Same-Origin Policy, the browser allows the connection to open. The attacker now has a full-duplex tunnel authenticated as the victim, allowing them to execute trades or read balances.
  - **Server-Side Protection**:
    1.  **Origin Header Verification**: During the HTTP upgrade handshake, the server must check the `Origin` header. If the origin is not an approved domain (e.g. it says `attacker.com`), the server must reject the upgrade request with a `403 Forbidden` status.
    2.  **Handshake Tokens**: Enforce one-time authentication tokens. Before opening the WebSocket, the client requests a temporary, single-use token via a secure REST POST call. The token is appended to the WebSocket URL (e.g. `wss://bank.com/ws?token=123`), and the server validates it before upgrading the connection.
- **Common Mistakes:** Assuming that cookie security attributes (like `HttpOnly`) protect against CSWSH. `HttpOnly` only blocks JavaScript from reading the cookie; it does not stop the browser from automatically sending the cookie in the WebSocket handshake headers.
- **Senior-Level Insight:** Origin validation is the primary line of defense for WebSockets. Combined with secure `SameSite=Lax` or `Strict` cookie flags, it ensures that unauthorized cross-site scripts cannot hijack persistent real-time connections.

---

### Question 4 (Service Worker Lifecycles & PWAs)
Explain the difference between PWA Service Worker states: `install`, `activate`, and `fetch`.
**Answer:** `install` occurs when the user signs up; it downloads static bundles. `activate` runs when the service worker is activated (cleans up old cache keys). `fetch` acts as a network request proxy.
