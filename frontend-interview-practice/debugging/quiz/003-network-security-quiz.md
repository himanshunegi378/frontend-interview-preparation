# Quiz: CORS, Network Failures, & Token Security

## Questions

### Question 1 (Easy/Medium - CORS Preflight Trigger Rules)
Identify which of the following three client-side fetch requests will trigger a CORS preflight (`OPTIONS`) check, and state the rules that govern this behavior:
1.  `GET /api/info` with header `Content-Type: text/plain`.
2.  `POST /api/login` with header `Content-Type: application/x-www-form-urlencoded`.
3.  `POST /api/data` with header `Content-Type: application/json`.

---

### Question 2 (Medium - Cross-Origin Cookie Storage Failures)
An application hosted on `https://app.example.com` makes API calls to `https://api.example.com`. The API server responds with a `Set-Cookie` header to establish a session, but the browser cookie storage remains empty, and subsequent requests fail authorization checks.
Detail the two most likely configuration errors (one client-side, one server-side) causing this failure.

---

### Question 3 (Senior - Trailing Slash Redirects and POST Body Stripping)
In a production deployment, a client application sends a `POST` request to `https://api.example.com/users` (no trailing slash). 
1.  The reverse proxy (Nginx) responds with a `301 Moved Permanently` redirecting to `https://api.example.com/users/` (with a trailing slash).
2.  The browser automatically follows the redirect, but the backend server throws a `400 Bad Request` claiming the payload body is missing.
Explain the network execution behavior that caused the payload body to be stripped, and detail how to resolve this at both the client and proxy layers.

---

## Answer Key & Explanations

### Question 1: Simple Request vs. Preflight Triggers
- **Difficulty:** Easy/Medium
- **Answer:** 
  Only **Request 3** (`POST` with `application/json`) will trigger a CORS preflight check.
- **Explanation:**
  - The browser bypasses preflight checks only for **"Simple Requests"**. A request is simple if it meets all of the following:
    1.  Uses a simple HTTP method: `GET`, `POST`, or `HEAD`.
    2.  Uses only simple headers (automatically set by the browser, or standard headers like `Accept`, `Accept-Language`, `Content-Language`).
    3.  The `Content-Type` header is restricted to:
        *   `text/plain`
        *   `multipart/form-data`
        *   `application/x-www-form-urlencoded`
  - Requests 1 and 2 match these rules, so they bypass preflight.
  - Request 3 uses `application/json` as its `Content-Type`. Since `application/json` is not in the allowed list, the browser triggers a preflight `OPTIONS` request.
- **Senior-Level Insight:** Understanding preflight triggers helps optimize network waterfalls. If you are building high-frequency tracking beacons, using `text/plain` or `navigator.sendBeacon` bypasses preflights, reducing server request loads.

---

### Question 2: CORS Cookie Credentials Rules
- **Difficulty:** Medium
- **Answer:** 
  1.  **Client-Side Error**: The fetch request was initiated without setting `credentials: "include"`, which prevents the browser from reading or sending cookies on cross-origin requests.
  2.  **Server-Side Error**: The server's CORS configuration did not return `Access-Control-Allow-Credentials: true` or used a wildcard `*` for the `Access-Control-Allow-Origin` header (which is forbidden when credentials are enabled).
- **Explanation:**
  - Cross-origin cookies require explicit opt-in on both the client and the server.
  - Client-side configuration (using Fetch):
    ```javascript
    fetch("https://api.example.com/data", { credentials: "include" });
    ```
  - Server-side response headers must match the client's origin explicitly:
    ```http
    Access-Control-Allow-Origin: https://app.example.com
    Access-Control-Allow-Credentials: true
    ```
- **Senior-Level Insight:** Set the `SameSite=None` and `Secure` cookie attributes on the server if the API and client applications reside on different subdomains to ensure cookies are processed correctly.

---

### Question 3: HTTP Redirect Methods and Body Loss
- **Difficulty:** Senior
- **Answer:** 
  The body is stripped because browsers convert `301` and `302` redirects of `POST` requests to `GET` requests, which discards the payload body.
  To resolve this, ensure the client uses the correct URL with the trailing slash directly, or configure Nginx to return a **`307 Temporary Redirect`** or **`308 Permanent Redirect`**.
- **Explanation:**
  - Under standard HTTP/1.1 rules, if a browser receives a `301 Moved Permanently` or `302 Found` response for a POST request, it converts the redirected request to a `GET` request. Since GET requests do not contain bodies, the payload is stripped.
  - The server receives `GET /users/` without the required body parameters and throws a 400 error.
  - **The Client Fix**: Ensure the API client targets the exact final URL (`https://api.example.com/users/` with the trailing slash) to bypass the redirect entirely.
  - **The Proxy Fix (Nginx)**: Configure Nginx to return a `307` or `308` redirect instead of `301`. The HTTP specification guarantees that `307` and `308` redirects **must not** change the request method or strip the request body:
    ```nginx
    # Nginx trailing slash redirect override
    rewrite ^([^.\?]*[^/])$ $1/ redirect; # Default Nginx rewrite uses 302, change to 307
    ```
- **Senior-Level Insight:** In API system design, always favor explicit path routing. If redirects are necessary for write routes (POST/PUT/PATCH), always use `307` or `308` status codes to preserve request bodies.
