# Quiz: Frontend Operational & Deployment Strategy

## Questions

### Question 1 (Medium - Single Page Application 404 Routing Errors)
A Single Page Application (SPA) using React Router is deployed to a static hosting bucket (like AWS S3 with CloudFront). 
Navigating around the app works fine when clicking links. However, if a user refreshes the browser while on the `/settings/profile` page, or shares that link with a friend, the browser displays a standard "404 Not Found" error.
Why does this happen, and how do you resolve it at the hosting/CDN layer?

---

### Question 2 (Hard - Telemetry Transmission on Page Unload)
A developer wants to log telemetry events (e.g. user session durations) when the user closes their browser tab. They write:
```javascript
window.addEventListener("beforeunload", () => {
  fetch("/api/telemetry", {
    method: "POST",
    body: JSON.stringify(sessionData)
  });
});
```
Explain why this request is highly unreliable and frequently fails to deliver data to the server. Detail two separate native browser APIs that resolve this issue.

---

### Question 3 (Senior - "Build Once, Run Anywhere" Container Injection)
A frontend team uses Docker to containerize their static React application, serving it via Nginx. The API team requires that the application connect to different API endpoints depending on the server cluster it is deployed to.
If you are forbidden from compiling separate Docker images for each environment, how do you design a Docker/Nginx configuration that injects cluster-specific environment variables into the static files at container startup?

---

## Answer Key & Explanations

### Question 1: Static File Routing Fallbacks
- **Difficulty:** Medium
- **Answer:** 
  The 404 occurs because the static host tries to find a physical file or directory named `/settings/profile` on disk. Since it does not exist, the server returns a 404.
- **Explanation:**
  - In SPAs, routing is managed client-side by JavaScript. When clicking a link, the router intercepts the event, prevents default page loading, and updates the URL using the browser History API.
  - However, when refreshing the browser on `/settings/profile`, the browser makes a direct network request to the host for `/settings/profile`.
  - Static servers (like S3, Apache, or Nginx) map URL paths directly to folder structures. Since there is no physical file at `/settings/profile/index.html` or `/settings/profile`, it throws a 404.
- **Fix**:
  Configure the CDN (CloudFront) or static host to redirect all error pages (specifically 404s) to the root `/index.html` file with a `200 OK` status.
  - S3: Set the Index document and Error document both to `index.html`.
  - Nginx: Configure `try_files $uri $uri/ /index.html;`.
  - Once index.html is loaded, React Router boots up, reads the path `/settings/profile`, and renders the correct view.
- **Senior-Level Insight:** When configuring redirects on CDNs, ensure the response status is overridden to `200 OK` (not `302` or `404`) to prevent SEO crawler indexing penalties.

---

### Question 2: Browser Unload Cycles and Keepalive Network Requests
- **Difficulty:** Hard
- **Answer:** 
  The request fails because the browser terminates all pending asynchronous HTTP requests immediately when a page's unload lifecycle begins to free up system memory.
- **Explanation:**
  - When a user closes a tab, the browser's execution context is destroyed.
  - Asynchronous calls (like standard `fetch` or `xhr` requests) that are still active are immediately aborted, meaning they never reach the server.
- **Fixes**:
  1.  **`navigator.sendBeacon(url, data)`**: This API is designed specifically for telemetry. It sends data asynchronously in the background. The browser processes this request independently of the page lifecycle, ensuring it is delivered even after the tab is closed.
      *   *Constraints*: Only supports POST requests and is limited to small payloads (usually under 64KB).
  2.  **`fetch(url, { method: 'POST', keepalive: true, body })`**: The `keepalive` flag tells the browser to keep the request alive in the background even if the page is unmounted.
- **Common Mistakes:** Trying to solve this by blocking the main thread with a synchronous loop (e.g. `while(Date.now() < end) {}`) to delay the tab close, which degrades user experience and is blocked by modern browsers.
- **Senior-Level Insight:** Use `navigator.sendBeacon` as the primary telemetry transmitter during page unloads, falling back to `fetch` with `keepalive: true` if you require custom headers (like auth tokens) which `sendBeacon` does not support.

---

### Question 3: Nginx Shell Templating at Startup
- **Difficulty:** Senior
- **Answer:** 
  Mount a dynamic script in the Docker container's entrypoint folder (`/docker-entrypoint.d/`) that replaces placeholder values inside a static JS config file with the host environment variables at startup, before starting the Nginx process.
- **Explanation:**
  - Inside the React code, read variables from a global window configuration object: `const API_URL = window.__ENV__.API_URL`.
  - In the source code's `index.html` or a separate `env-config.js` file, write placeholder tokens:
    ```javascript
    // env-config.template.js
    window.__ENV__ = {
      API_URL: "$API_URL",
      APP_ENV: "$APP_ENV"
    };
    ```
  - In the Docker container, write a startup shell script `inject-env.sh`:
    ```bash
    #!/bin/sh
    # Replace placeholder tokens in the template file using envsubst
    envsubst < /usr/share/nginx/html/env-config.template.js > /usr/share/nginx/html/env-config.js
    ```
  - Place this script inside the `/docker-entrypoint.d/` directory of the official Nginx Docker image. The image is configured to automatically run all executable scripts in that folder on startup.
- **Common Mistakes:** Building separate Docker images for dev, staging, and production. This violates the Core Twelve-Factor App methodology ("Build once, run anywhere").
- **Senior-Level Insight:** Using startup scripts to generate a static configuration file at container boot ensures you compile the application code only once, while retaining the flexibility to deploy the same image to any server cluster.

---

### Question 4 (Feature Flags & Split Audits)
Explain how to implement client-only feature flag guards without introducing visual flickering on hydration.
**Answer:** Read flag configurations from static pre-hydrated scripts embedded in the HTML header, or fall back to skeleton overlays until server configurations mount.
