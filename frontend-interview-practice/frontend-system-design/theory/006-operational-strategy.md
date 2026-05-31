# System Design: Frontend Operational & Deployment Strategy

## Problem Statement & Context
A growing SaaS platform requires a highly resilient frontend operational architecture. The system must support environment configurations (Development, Staging, Production) without rebuild steps, track client-side errors and performance metrics without overwhelming network bandwidth, manage feature flags for progressive rollouts, and configure CI/CD deployments to CDNs with caching configurations.

---

## 1. Requirements

### Functional Requirements
- **Environment Configuration**: Set API endpoints and variables dynamically at runtime without rebuilding the bundle.
- **Client Logging**: Capture JavaScript errors, failed network requests, and performance metrics, then send them to a telemetry service.
- **Feature Flags**: Manage real-time feature toggling and canary releases (e.g. roll out a feature to only 10% of users).

### Non-Functional Requirements
- **Low Network Footprint**: Batch client errors to prevent flood hits on backend logging servers.
- **Cache Optimization**: Set up content-hashed bundles with long-lived CDN cache controls, and enforce fallbacks for SPA sub-paths.
- **Zero-Build Configurations**: Avoid rebuilding bundles for different staging/prod environments.

---

## 2. Dynamic Environment Configurations
A common defect is baking environment variables into bundles at compile time (e.g. `process.env.API_URL`), requiring a rebuild for each staging target.

**The Solution**: Load a dynamic configuration script or JSON file at runtime before executing application code:

```
[ Browser ] ──> Fetch index.html ──> Fetch config.js (Bypasses caching, dynamic from server)
                                            │
                                            ▼
[ Client Application ] <── Read window.__ENV__.API_URL ──┘
```

The server templates `config.js` dynamically based on the current environment variables, exposing them on the global `window` object:
```html
<script src="/config.js"></script>
```
```javascript
// On the server, /config.js returns:
window.__ENV__ = {
  API_URL: "https://api.production.company.com",
  FEATURE_FLAG_ENDPOINT: "https://flags.company.com"
};
```
This allows the same physical build artifact to be deployed to Development, Staging, and Production without recompiles.

---

## 3. Client Telemetry & Error Logging Strategy
To capture uncaught errors, listen to global window events and batch them to reduce network traffic:

```javascript
class TelemetryClient {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.queue = [];
    this.isFlushing = false;
    
    // Global listeners
    window.addEventListener("error", (e) => this.log({ type: "JS_ERROR", message: e.message }));
    window.addEventListener("unhandledrejection", (e) => this.log({ type: "PROMISE_REJECT", message: e.reason }));
  }

  log(event) {
    this.queue.push({ ...event, timestamp: Date.now() });
    if (this.queue.length >= 10) this.flush();
  }

  async flush() {
    if (this.queue.length === 0 || this.isFlushing) return;
    this.isFlushing = true;
    
    try {
      // Use navigator.sendBeacon to ensure delivery even if the tab is closing
      const payload = JSON.stringify(this.queue);
      navigator.sendBeacon(this.endpoint, payload);
      this.queue = [];
    } finally {
      this.isFlushing = false;
    }
  }
}
```

---

## 4. Feature Flags & Canary Releases
Manage feature rollouts using a local evaluation engine:
*   **Ingest**: Fetch flag definitions on startup (or stream changes via Server-Sent Events).
*   **Evaluation (Bucketing)**: To roll out a feature to 10% of users, hash the user's ID to a number between 0 and 99:
    ```javascript
    function isFeatureEnabled(userId, flagName, rolloutPercentage) {
      const hash = getSimpleHash(`${userId}-${flagName}`);
      const bucket = hash % 100;
      return bucket < rolloutPercentage;
    }
    ```
This allows evaluating flags instantly on the client without firing network requests on every evaluation.

---

## 5. CI/CD CDN Deployment & Caching Strategy
*   **Hashed Assets**: Bundlers output filenames containing hashes: `main.c8f2a9.js`.
*   **CDN Cache Rules**:
    *   Hashed assets (`/static/*.js`, `/static/*.css`): Set `Cache-Control: max-age=31536000, immutable`. Since filenames change on code updates, they can be cached forever.
    *   Dynamic entries (`/index.html`, `/config.js`): Set `Cache-Control: no-cache`. Forces the browser to check if a new version exists on every load.
*   **SPA Routing Fallback**: Single Page Applications manage routes client-side. The CDN/Reverse Proxy must be configured with a fallback rule: if a requested file (e.g. `/dashboard/settings`) is missing, serve `/index.html` with a 200 status, allowing the client-side router to handle the path.

---

## 6. Tradeoffs & Senior-Level Discussion

### Tradeoff: Build-Once Deploy-Many vs. Compile-Time Configurations
*   *Compile-Time (e.g. env files)*: Straightforward setup, allows trees to shake code based on env variables. However, compiling multiple bundles slows down build pipelines.
*   *Runtime Configurations (config.js)*: Build once, deploy anywhere. Speeds up pipelines and reduces build count, but requires hosting a dynamic endpoint or template injection script on the server.

### Senior-Level Talking Points
"A resilient operational strategy requires separating feature releases from physical code deployments. We use Feature Flags evaluated locally using hashing functions to toggle features dynamically. Additionally, we avoid compiling environment variables directly into bundles. Instead, we fetch them dynamically at startup from `window.__ENV__`, allowing us to deploy the same physical container image to dev, staging, and production without rebuilding."

---

## API Contract Handling & Operational Configurations
- **API Contract Handling**: Syncing client type files with serverside schemas using toolsets like OpenAPI, GraphQL Codegen, or Protobuf compilers to prevent runtime contract mismatch errors.
- **Feature Flags**: Controlling feature visibility dynamically via remote toggle JSON feeds, wrapping layouts in permission-based rendering containers.
