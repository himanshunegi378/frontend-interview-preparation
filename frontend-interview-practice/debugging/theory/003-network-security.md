# Debugging: CORS, Network Failures, & Token Security

## Why It Matters
Network and security bugs—such as Cross-Origin Resource Sharing (CORS) preflight failures, authorization token expiration, or environment path mismatches—can completely block users from accessing web applications. These errors are often environment-specific, making them hard to diagnose locally. Senior engineers must understand browser preflight checks, cookie security policies, and reverse proxy routing mechanics to troubleshoot and resolve these issues.

---

## Core Concepts & Mental Models

### 1. Demystifying CORS Errors
CORS is a browser-enforced security mechanism, not a server-side error. It restricts a script running on domain A (`Origin: https://app.com`) from reading responses from domain B (`https://api.com`).
*   **The Preflight Check (`OPTIONS`)**: For "non-simple" requests (e.g., content-type is `application/json`, or contains custom headers like `Authorization`), the browser first sends a preflight `OPTIONS` request.
*   **The Response Headers**: The server must respond to the `OPTIONS` request with success (usually `200` or `204`) and include:
    - `Access-Control-Allow-Origin: https://app.com` (or matches the origin; wildcard `*` fails if credentials are included).
    - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE`.
    - `Access-Control-Allow-Headers: Content-Type, Authorization`.
*   **The Credentials Trap**: If the request includes cookies (`credentials: "include"`), the server must respond with `Access-Control-Allow-Credentials: true` and the origin *cannot* be a wildcard `*`. It must be an explicit domain.

### 2. Authorization Token Expiration & Cookie Issues
*   **Cookie Expiration vs. Session Expiration**: If a cookie has `Expires` or `Max-Age` set, it persists on disk. If omitted, it is a "Session Cookie" and is deleted when the browser tab/process closes.
*   **Secure & SameSite Failures**: If a cookie is set with `Secure` but the local development server runs on HTTP (not HTTPS), the browser will discard the cookie, preventing authentication. SameSite issues occur when third-party embeds (like Stripe checkout frames) attempt to transmit cookies on cross-origin requests.

### 3. Production-Only Path & Proxy Discrepancies
Many bugs only surface in production due to differences in proxy configurations:
*   **API Path Rewriting**: Locally, developers run a proxy configuration (like `vite.config` proxies `/api` to `localhost:8080`). In production, this is managed by reverse proxies (like Nginx, Cloudflare, or AWS ALBs).
*   **Protocol Mismatches**: Local development running on HTTP, while production enforces HTTPS. If secure cookies or secure WebSocket protocols (`wss://`) are not configured, connections fail.

---

## Real-World Case Study / Examples

### Debugging a preflight CORS Failure on a POST Request
A web portal fails to send orders, throwing:
`Access to fetch at 'https://api.company.com/orders' from origin 'https://app.company.com' has been blocked by CORS policy.`

**Diagnostic Path**:
1.  Open the browser **Network tab**.
2.  Locate the failed request. Notice that the request method is `OPTIONS`, and the status code is `405 Method Not Allowed`.
3.  **The Diagnosis**: The browser sent the preflight `OPTIONS` request to check if `application/json` is permitted. The backend server does not have an active handler for the `OPTIONS` method on the `/orders` route, returning a 405 error, which causes the browser to block the subsequent `POST` request.
4.  **The Fix**: Configure the backend server or API Gateway (e.g. AWS API Gateway, Nginx) to handle the `OPTIONS` method, returning a `200 OK` status with the required CORS headers:
    ```http
    Access-Control-Allow-Origin: https://app.company.com
    Access-Control-Allow-Methods: POST, OPTIONS
    Access-Control-Allow-Headers: Content-Type, Authorization
    Access-Control-Allow-Credentials: true
    ```

---

## Common Interview Traps

### The "Fix CORS by disabling browser checks" Trap
*   **The Trap**: Suggesting using a Chrome extension that disables CORS check or bypassing security locally to solve CORS issues.
*   **The Reality**: This does not solve the issue for users. Bypassing browser checks is a security risk. The issue must be fixed on the backend by configuring the server to send the correct headers, or client-side by using a reverse proxy to serve both the app and the API from the same domain.

---

## Junior vs. Senior View

*   **Junior View**: "CORS is a frontend bug. Fix it by asking the backend team to set `Access-Control-Allow-Origin: *`. If cookies aren't working, try saving tokens in LocalStorage."
*   **Senior View**: "CORS is a browser security protocol. Resolve CORS issues by configuring correct headers on the backend server or API gateway. Secure cookies by matching HTTPS requirements, and use reverse proxies to serve client-side and server-side assets from the same origin to bypass cross-origin checks completely."

---

## Related Interview Questions
1. "Why does a GET request with `Content-Type: text/plain` not trigger a CORS preflight check?"
2. "How does the `Access-Control-Max-Age` header optimize network performance?"
3. "Explain what happens if a cookie is set with `SameSite=None` but lacks the `Secure` flag."
4. "How do you troubleshoot a connection termination error on a secure WebSocket (`wss://`) endpoint in production?"
