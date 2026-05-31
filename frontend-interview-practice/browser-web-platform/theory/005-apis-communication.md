# API Communication, WebSockets, & Server-Sent Events

## Why It Matters
A senior frontend engineer must select and implement appropriate API communication protocols based on application requirements. Using the wrong protocol—like configuring raw polling for a real-time collaborative doc or choosing WebSockets for simple notification updates—leads to wasted server CPU, high battery drain on mobile devices, and complex client state machines. Understanding the tradeoffs of REST, GraphQL, WebSockets, Server-Sent Events (SSE), and Service Worker synchronization is essential for building scalable, responsive apps.

---

## Core Concepts & Mental Models

### 1. Communication Protocols Comparison

| Protocol | Direction | Transport | Reconnection | Overhead | Use Case |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Short Polling** | Client $\rightarrow$ Server | HTTP/1.1 or 2 | N/A | High (New headers per poll) | Periodic status checks (e.g. build pipelines) |
| **Long Polling** | Client $\rightarrow$ Server (Deferred) | HTTP/1.1 or 2 | N/A | High | Legacy fallback for real-time channels |
| **SSE (Server-Sent)**| Server $\rightarrow$ Client | HTTP (EventSource) | Automatic (Built-in) | Low (Single connection stream) | Real-time dashboards, notification feeds, stock tickers |
| **WebSockets** | Bidirectional | TCP Custom Handshake | Manual (JS code required) | Low (Minimal framing overhead) | Collaborative editors, multiplayer games, chat apps |

### 2. REST vs. GraphQL
*   **REST (Representational State Transfer)**: Resource-oriented design using HTTP verbs (`GET`, `POST`, `PUT`, `DELETE`). Easy to cache at proxy/CDN levels, but prone to:
    *   *Over-fetching*: Downloading unnecessary fields (e.g., fetching a user's details when you only need their name).
    *   *Under-fetching*: Requiring multiple sequential HTTP calls to assemble a dashboard.
*   **GraphQL**: Schema-oriented design. The client sends a query specifying the exact fields it needs. A single HTTP `POST` endpoint handles all operations. Prevents over/under-fetching, but makes HTTP caching difficult because all operations are POST requests.

### 3. Server-Sent Events (SSE) vs. WebSockets
*   **WebSockets**: Starts as an HTTP connection, then upgrades to a raw TCP connection. It is bidirectional and full-duplex. Excellent for low-latency, high-frequency bidirectional data exchanges.
*   **SSE**: Utilizes standard HTTP connections with a `Content-Type: text/event-stream` header. The server holds the response open and streams data. Unidirectional (Server-to-client).
    *   *Why SSE is often preferred for dashboards*: It works over HTTP/2 out of the box (reusing existing connections), bypasses firewall restrictions that block raw WebSocket ports, and includes native client auto-reconnection with ID tracking (`Last-Event-ID`).

### 4. File Upload Topologies
How you transmit files from the client to the server impacts memory and network performance:
*   **Base64 Encoding**: Encodes binary data into strings inside JSON bodies. **Trap**: Base64 increases the file payload size by ~33%, consuming extra bandwidth and CPU.
*   **Multipart / Form-Data**: Sends the file in raw binary chunks separated by boundaries. Efficient and supported natively by browsers.
*   **Pre-signed S3 Uploads**: The client requests a temporary upload URL from the server, and then uploads the file directly to the storage bucket (S3, Cloud Storage). This bypasses the application server entirely, preventing CPU bottleneck and timeout issues.

---

## Real-World Case Study / Examples

### SSE vs. WebSockets for Live Notifications
A dashboard requires a real-time notification bell icon.

**Bad (WebSockets)**:
A developer sets up a WebSocket server. They must handle custom ping-pong heartbeats to check if the connection is alive, manage CORS, configure load balancers to support persistent sticky sessions, and write complex client-side code to handle reconnect loops.

**Fix (Server-Sent Events)**:
Since data flows only one-way (from server to user), implement SSE using the browser's native `EventSource` API:
```javascript
const eventSource = new EventSource("/api/notifications");

eventSource.onmessage = (event) => {
  const notification = JSON.parse(event.data);
  showToast(notification.message);
};

eventSource.onerror = (err) => {
  console.log("Automatically attempts reconnection in the background...");
};
```
No manual reconnection timers or heartbeats are needed. The browser manages connection retries in the background automatically.

---

## Common Interview Traps

### The "GraphQL is always better than REST" Trap
*   **The Trap**: Recommending GraphQL for all enterprise projects.
*   **The Reality**: GraphQL introduces complexity:
    1.  It is hard to cache using browser/CDN caches because it uses a single `POST` endpoint.
    2.  It introduces schema maintenance overhead.
    3.  A malicious client can execute complex nested queries that overwhelm server database CPU.
*   **The Answer**: Use REST for standard CRUD operations where caching is crucial, and GraphQL for complex dashboard assemblies with nested relationships.

---

## Junior vs. Senior View

*   **Junior View**: "To get real-time data, use `setInterval` to fetch the API every 3 seconds, or set up Socket.io. If you need to upload a file, convert it to a base64 string and POST it in a JSON body."
*   **Senior View**: "Select protocols based on directional requirements: use Server-Sent Events (SSE) for server-to-client notification streams, and WebSockets for low-latency bidirectional sessions. When handling files, upload binary data directly to cloud storage using pre-signed URLs to bypass the server, and implement offline sync using Service Worker sync manager to preserve data integrity."

---

## Related Interview Questions
1. "Explain the differences in connection limits between WebSockets and SSE over HTTP/1.1 vs HTTP/2."
2. "How does the browser's `navigator.onLine` API differ from active network reachability checking?"
3. "What security threats (like CSWSH - Cross-Site WebSocket Hijacking) target WebSockets, and how do you prevent them?"
4. "How would you implement chunked, resumable file uploads in vanilla JS?"

---

## File Uploads & PWA Basics
- **File Uploads**: Large file handling in the browser uses `File` and `Blob` APIs, splitting payloads into chunk arrays to allow pausing/resuming uploads.
- **PWA basics**: Progressive Web Apps rely on Service Workers to act as proxy interceptors, caching assets in CacheStorage and sync tasks using background sync APIs.
