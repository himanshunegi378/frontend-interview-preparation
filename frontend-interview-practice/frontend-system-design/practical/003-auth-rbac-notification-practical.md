# Practical: Auth Silent Refresh Queue Interceptor

## Problem Title: Concurrent API Authentication Token Refresher

## Difficulty: Senior

## Skills Tested
- API Interceptors & Queueing
- Asynchronous Promise Chain Management
- Token Refresh Lifecycle Synchronization
- Concurrent Request Replaying

## Problem Statement
In applications using short-lived Access Tokens, multiple network calls are fired in parallel on page load. If the Access Token expires, all these concurrent calls return a `401 Unauthorized` status at the same time. If not handled correctly, the client will fire multiple redundant token refresh API requests, causing performance bottlenecks and server token validation failures.

Implement an `AuthInterceptor` class that:
1. Wraps an asynchronous HTTP request executor `request(url, config)`.
2. Intercepts `401 Unauthorized` errors.
3. Dedupes multiple concurrent failures so that only **one** token refresh API request is made.
4. Buffers all subsequent failed requests into a queue.
5. Resolves/replays all queued requests with the new Access Token once the refresh is successful, or rejects them if the refresh fails.

## Starter Code
```javascript
/**
 * Managed API Interceptor with a concurrent silent refresh queue.
 */
export class AuthInterceptor {
  constructor(apiClient, refreshCallback) {
    this.api = apiClient; // mock request agent: (url, config) => Promise
    this.refreshToken = refreshCallback; // () => Promise<newToken>
    this.isRefreshing = false;
    this.queue = [];
  }

  /**
   * Execute an API request, wrapping it in the token refresh interceptor.
   */
  async execute(url, config = {}) {
    // Implement
  }
}
```

## Requirements
- If `execute` fails with a `{ status: 401 }` error:
  - Queue the request's configurations.
  - If a refresh is not already in progress, trigger `this.refreshToken()`.
  - If a refresh is in progress, do *not* fire another refresh. Simply queue the request.
- Once `refreshToken()` resolves with the new token:
  - Replay all requests in the queue using the new token: call `this.api(url, updatedConfig)`.
  - Resolve the original pending promises with the replayed responses.
- If `refreshToken()` fails (rejects):
  - Reject all queued requests with the refresh error, prompting a redirect to login.
  - Reset state so subsequent calls can trigger refresh operations again.

## Edge Cases
- Recursive failures: if a replayed request *still* returns a 401 even after a refresh, reject it immediately to prevent infinite loops.
- Requests made while the refresh call is active (must be queued directly).

## Expected Approach
We wrap the request lifecycle in a Promise.
1. Try executing: `await this.api(url, config)`.
2. If it succeeds, return the result.
3. If it throws a 401 error:
   - Check if this request has already been retried (add a custom `_retry` flag inside config). If yes, throw the error to prevent loops.
   - If not, return a new Promise:
     ```javascript
     return new Promise((resolve, reject) => {
       this.queue.push({ url, config, resolve, reject });
       this._attemptRefresh();
     });
     ```
4. Inside `_attemptRefresh()`:
   - If `this.isRefreshing` is true, exit.
   - Set `this.isRefreshing = true`.
   - Call `this.refreshToken()`.
   - On success: loop through the queue, call `this.api(url, newConfig)` for each request, and resolve the corresponding promise with the result. Empty the queue.
   - On failure: loop through the queue, reject all promises with the error. Empty the queue.
   - In both cases, set `this.isRefreshing = false`.

## Solution
```javascript
export class AuthInterceptor {
  constructor(apiClient, refreshCallback) {
    this.api = apiClient; // Client request function
    this.refreshToken = refreshCallback; // Async function returning string
    this.isRefreshing = false;
    this.queue = [];
  }

  /**
   * Execute an API request with silent token refresh interceptors.
   */
  async execute(url, config = {}) {
    try {
      // 1. Run the initial API call
      return await this.api(url, config);
    } catch (error) {
      // 2. Intercept 401 Unauthorized errors
      if (error && error.status === 401) {
        
        // Prevent infinite loops if a request fails even after token refresh
        if (config._retry) {
          throw new Error("AuthInterceptor: Request failed post-refresh.");
        }

        // Mark request as queued for retry
        config._retry = true;

        // 3. Queue request and initiate single token refresh
        return new Promise((resolve, reject) => {
          this.queue.push({ url, config, resolve, reject });
          this._attemptRefresh();
        });
      }

      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Executes a single refresh call and replays or rejects the queue.
   */
  async _attemptRefresh() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      console.log("AuthInterceptor: Initiating single silent refresh...");
      const newAccessToken = await this.refreshToken();
      console.log("AuthInterceptor: Token refresh successful. Replaying queue...");

      // Replay all queued requests with the new Access Token
      const queueToReplay = this.queue;
      this.queue = [];
      this.isRefreshing = false;

      for (const req of queueToReplay) {
        // Inject the new token into authorization headers
        const updatedConfig = {
          ...req.config,
          headers: {
            ...req.config.headers,
            Authorization: `Bearer ${newAccessToken}`
          }
        };

        // Replay and resolve/reject original promise
        this.api(req.url, updatedConfig)
          .then((res) => req.resolve(res))
          .catch((err) => req.reject(err));
      }
    } catch (refreshError) {
      console.error("AuthInterceptor: Silent token refresh failed. Evicting queue...");
      
      const queueToReject = this.queue;
      this.queue = [];
      this.isRefreshing = false;

      // Reject all queued requests with the refresh error (triggers logout redirection)
      for (const req of queueToReject) {
        req.reject(new Error(`Authentication expired: ${refreshError.message}`));
      }
    }
  }
}
```

## Explanation
- **Queueing Array**: The `this.queue` array buffers requests during active token refresh calls, preventing duplicate network hits.
- **`_retry` Loop Guard**: Adding `_retry = true` to request configurations ensures that if the server rejects the *new* token, we break the cycle and throw the error rather than triggering infinite refresh loops.
- **Header Injection**: Retried requests have their headers dynamically updated with the new token (`Authorization: Bearer <newToken>`) before execution.

## Time Complexity
- **Request execution**: $O(1)$ constant time overhead.
- **Queue flush**: $O(Q)$ linear time to replay the $Q$ failed requests in the queue.

## Space Complexity
- **Buffer Storage**: $O(Q)$ space required to hold the queued request configurations in memory.

---

## Interviewer Follow-ups
1. "What if the refresh token expires? How does the application react?"
   (The `refreshToken()` call fails, the queue is rejected, and the client-side router redirects the user to the `/login` page to re-authenticate).
2. "How would you handle requests that are not idempotent (like POST order forms) to prevent duplicate transactions?"
   (Since the 401 error means the request never executed on the backend, replaying it is safe. For double-submit safety, incorporate idempotent request keys in headers).

---

## Senior-Level Discussion
Writing custom request coordinators shows an understanding of asynchronous programming.
By intercepting errors and replaying failed requests silently, you create a seamless user experience where users stay authenticated without interrupting their active workflows.
This pattern isolates security boundaries from product components, keeping code dry and clean.

---

### Extra Practice: Permission-based Rendering & Notifications
**Task:** Implement a user RBAC role verification wrapper that filters menu rendering lists:
```javascript
export function filterMenuByPermissions(menuItems, userRole, rolePermissionsMap) {
  const allowedPerms = rolePermissionsMap[userRole] || [];
  return menuItems.filter(item => {
    return !item.requiredPermission || allowedPerms.includes(item.requiredPermission);
  });
}
```
