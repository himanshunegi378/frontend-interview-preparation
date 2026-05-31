# Quiz: Browser Storage & HTTP Caching

## Questions

### Question 1 (Easy/Medium - LocalStorage Blocking Mechanics)
A developer decides to cache a parsed 4MB JSON product catalog directly in LocalStorage. On application startup, they run:
```javascript
const catalog = JSON.parse(localStorage.getItem("catalog"));
```
What performance problems does this introduce? Specifically, explain how this code affects the browser's main thread and layout responsibilities.

---

### Question 2 (Medium - Cache-Control Header Comparisons)
Compare the behavior of the following three HTTP response header configurations:
1.  `Cache-Control: no-store`
2.  `Cache-Control: no-cache`
3.  `Cache-Control: max-age=0, must-revalidate`
Under what scenario should a developer choose each of these directives?

---

### Question 3 (Senior - SameSite Cookies and CSRF Defense)
A user is logged in to `bank.com`, which stores its session identifier in a cookie. The user visits a malicious website, `evil-hacker.com`, which renders the following image tag pointing to the bank's action endpoint:
```html
<img src="https://bank.com/transfer?amount=1000&to=hacker" />
```
Explain whether the session cookie will be sent along with the image request, and how the output changes depending on whether the cookie is configured with:
1.  `SameSite=None`
2.  `SameSite=Lax`
3.  `SameSite=Strict`

---

## Answer Key & Explanations

### Question 1: LocalStorage Main Thread Blocking
- **Difficulty:** Easy/Medium
- **Answer:** 
  This code blocks the browser's main thread, delaying initial page interactivity and layout paints (INP / LCP).
- **Explanation:**
  - **Synchronous Disk Access**: LocalStorage is a synchronous API. When `localStorage.getItem` is called, the browser halts JavaScript execution to read the data directly from the system's hard drive.
  - **CPU Parsing Cost**: Parsing a 4MB JSON string (`JSON.parse`) is a CPU-intensive operation.
  - While this read and parse operation runs (which can take 100ms to 500ms on low-end mobile devices), the main thread is completely blocked.
  - Because the main thread is blocked, the browser cannot process user interactions, handle clicks, or run layout/repaint calculations, causing noticeble freeze frames.
- **Common Mistakes:** Believing LocalStorage operations are executed in a background thread.
- **Fix**: Use IndexedDB (via an async wrapper like `idb-keyval`) to read large data structures asynchronously, or chunk catalog parsing using Web Workers.
- **Senior-Level Insight:** Keep LocalStorage usage restricted to lightweight states (under 10KB). For larger storage needs, IndexedDB is asynchronous and does not block the UI.

---

### Question 2: Caching Directives Comparison
- **Difficulty:** Medium
- **Answer:** 
  1.  `no-store`: Prevents caching entirely. The browser must download the asset every time. (Best for highly sensitive, private endpoints like transaction records).
  2.  `no-cache`: Caches the asset, but forces the browser to revalidate it with the server (using ETag/If-None-Match) before serving. (Best for files like `index.html` that update frequently).
  3.  `max-age=0, must-revalidate`: Behaves similarly to `no-cache` in modern browsers, caching the file but requiring revalidation.
- **Explanation:**
  - **`no-store`**: Commands all cache systems (proxies, CDNs, browsers) to write nothing to disk. A full network transfer occurs on every load.
  - **`no-cache`**: The client is allowed to store the file. When the user requests the file, the client sends a fast check request (`If-None-Match: "tag"`) to the server. If the file is unchanged, the server returns a `304 Not Modified` header (no body), allowing the client to load the cached file instantly.
  - **`max-age=0, must-revalidate`**: Specifies that the cache is immediately stale (`max-age=0`) and must be revalidated (`must-revalidate`). If the server goes offline, a standard `max-age=0` cache might fallback to serving stale data, but `must-revalidate` forbids this, returning a `504 Gateway Timeout` instead.
- **Senior-Level Insight:** For high-performance CDNs, combine `no-cache` on HTML files with content-hashed JS/CSS assets marked as `Cache-Control: max-age=31536000, immutable`. This ensures instant assets loads while guaranteeing that index.html updates are fetched immediately.

---

### Question 3: SameSite Cookie Rules & CSRF Prevention
- **Difficulty:** Senior
- **Answer:** 
  1.  `SameSite=None`: The cookie **will** be sent. The transfer action is authorized, and the exploit succeeds.
  2.  `SameSite=Lax`: The cookie **will not** be sent. The exploit fails.
  3.  `SameSite=Strict`: The cookie **will not** be sent. The exploit fails.
- **Explanation:**
  - **`SameSite=None`**: Cookies are sent in all cross-site requests, including embedded resources (like image src or iframe sources) loaded from third-party sites.
  - **`SameSite=Lax`**: Cookies are excluded on cross-site subresource requests (images, stylesheets, frames). They are only sent during top-level cross-site navigations (e.g. clicking a link `<a href="...">` that changes the URL in the browser's address bar). Since the image tag is a subresource request, the cookie is withheld.
  - **`SameSite=Strict`**: Cookies are withheld from all cross-site requests, including top-level navigations. Clicking a link from an email or external site to the bank will open the page in an unauthenticated state, requiring the user to refresh or navigate manually to send the cookie.
- **Common Mistakes:** Relying solely on `SameSite=Lax` for CSRF defense. While it blocks simple GET exploits, it does not prevent attacks if your application exposes state-mutating actions (like `/transfer`) over GET routes instead of POST routes.
- **Senior-Level Insight:** Always enforce state-mutating actions on POST/PUT requests protected by anti-CSRF tokens, and ensure auth cookies are set with `SameSite=Lax` or `SameSite=Strict` paired with `HttpOnly` and `Secure`.
