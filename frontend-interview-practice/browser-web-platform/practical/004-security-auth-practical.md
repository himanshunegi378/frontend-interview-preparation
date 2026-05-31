# Practical: Secure Token Refresh Queue Manager

## Problem Title: Concurrent Request Interceptor and JWT Refresher

## Difficulty: Senior

## Skills Tested
- Fetch interceptors and wrapper patterns
- Promise queueing for concurrent tasks
- State tracking for authentication cycles
- Resolving race conditions on token refreshes

## Problem Statement
Implement a secure HTTP client fetch wrapper `secureFetch(url, options)` that handles JSON Web Token (JWT) authorization headers and automatic token refreshes.

The client must handle the following sequence:
1. **Header Injection**: Append `Authorization: Bearer <token>` to every request (fetch the latest token using `getAccessToken()`).
2. **Token Expiration (401 Handling)**: If a request fails with an HTTP `401 Unauthorized` status, it indicates the access token has expired. The client must call `refreshAccessToken()` to fetch a new token, save it, and retry the original request.
3. **Concurrent Queueing**: If multiple API requests are fired simultaneously and all fail with a `401` status, they must **not** trigger multiple refresh token requests. The client must trigger a **single** refresh call, queue all other failing requests, and execute them with the new token once the refresh finishes.
4. **Failure Cascades**: If the refresh token request itself fails (e.g. returns a `401` or network error), clear the session, reject all queued requests, and redirect to login.

## Starter Code
```javascript
// Mock authentication state managers
let accessToken = "expired-token-123";

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

// Mock refresh action (resolves in 1s)
export async function refreshAccessToken() {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  setAccessToken("new-token-456");
  return "new-token-456";
}

/**
 * Executes a secure fetch with automatic token refreshes.
 */
export function secureFetch(url, options = {}) {
  // Implement wrapper logic here
}
```

## Requirements
- Ensure that only one refresh token request is active at any given time.
- All requests queued during the refresh must be retried with the new token on success.
- If the refresh token request fails, reject all pending requests in the queue with the refresh error.

## Edge Cases
- **Non-auth 401s**: If a request to the login or refresh endpoints returns a 401, do not attempt to refresh the token, as this would cause an infinite loop. Reject immediately instead.

## Expected Approach
Maintain a `isRefreshing` boolean flag and a `failedQueue` array in the module scope.
Inside `secureFetch`, append the access token to the headers and execute the fetch. If it returns a `401` status:
- If the URL is the refresh endpoint itself, reject immediately.
- If `isRefreshing` is `true`, return a new Promise whose `resolve` and `reject` handlers are pushed to the `failedQueue`.
- If `isRefreshing` is `false`, set the flag to `true`, and invoke `refreshAccessToken()`.
  - On success: Iterate through `failedQueue`, executing the original requests with the new token, resolving their promises. Clear the queue and reset the flag.
  - On failure: Iterate through `failedQueue`, rejecting all promises with the refresh error. Clear the queue, reset the flag, and redirect.

## Solution
```javascript
let accessToken = "expired-token-123";
let isRefreshing = false;
let failedQueue = [];

export function getAccessToken() {
  return accessToken;
}

export function setAccessToken(token) {
  accessToken = token;
}

export async function refreshAccessToken() {
  // Simulating api delay
  await new Promise((resolve) => setTimeout(resolve, 1000));
  
  // If the token is already refreshed by another path, reuse it
  if (accessToken === "new-token-456") return "new-token-456";
  
  setAccessToken("new-token-456");
  return "new-token-456";
}

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

export function secureFetch(url, options = {}) {
  // 1. Initialize headers and inject token
  const headers = new Headers(options.headers || {});
  if (!headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${getAccessToken()}`);
  }

  const fetchOptions = { ...options, headers };

  return fetch(url, fetchOptions).then((response) => {
    // 2. Check for 401 Unauthorized status
    if (response.status === 401) {
      // Prevent infinite loops on token auth endpoints
      if (url.includes("/api/auth/refresh") || url.includes("/api/auth/login")) {
        return Promise.reject(new Error("Authentication failed"));
      }

      // 3. Queue request if another refresh is already in progress
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              // Update headers and retry
              headers.set("Authorization", `Bearer ${token}`);
              resolve(fetch(url, { ...options, headers }));
            },
            reject: (err) => {
              reject(err);
            }
          });
        });
      }

      // 4. Trigger token refresh if this is the first failing request
      isRefreshing = true;

      return refreshAccessToken()
        .then((newToken) => {
          // Retry the original request
          headers.set("Authorization", `Bearer ${newToken}`);
          const retriedFetch = fetch(url, { ...options, headers });
          
          // Process all other queued requests
          processQueue(null, newToken);
          
          return retriedFetch;
        })
        .catch((err) => {
          // Reject all queued requests on failure
          processQueue(err, null);
          return Promise.reject(new Error("Session expired. Please log in again."));
        })
        .finally(() => {
          isRefreshing = false;
        });
    }

    return response;
  });
}
```

## Explanation
- **Queued Promises**: When `isRefreshing` is true, we return a new pending `Promise` and save its resolve/reject controllers. This holds the request suspended in the JS event loop. Once the refresh completes, we resolve these promises with the new token, triggering the retries.
- **Single Refresh Lock**: The `isRefreshing` boolean prevents concurrent failing requests from triggering multiple API calls to the refresh endpoint, saving server resources.
- **Authorization Injector**: Appends the Bearer token dynamically before fetch execution.

## Time Complexity
- Queue registration: $O(1)$ operations.
- Queue execution: $O(Q)$ where $Q$ is the number of queued requests.

## Space Complexity
- $O(Q)$ space to store pending request controllers on the queue.

## Interviewer Follow-ups
1. "What if one of the queued requests fails again with a 401 after the token refresh?" (To prevent infinite loops, add a retry counter to the request metadata: `options._retryCount = (options._retryCount || 0) + 1`. If `options._retryCount > 1`, reject immediately instead of attempting another refresh).
2. "How would you implement this utility inside an Axios client instead of raw fetch?" (Axios provides built-in `interceptors` for requests and responses, allowing you to intercept response errors and manage queues using similar Promise logic).

## Senior-Level Discussion
JWT token management is a common requirement in SPA architectures. Storing tokens securely and refreshing them without disrupting the user experience is critical.
When designing interceptors, always ensure that request headers are copied immutably to prevent side effects, and implement retry limits to prevent infinite loop bottlenecks if the server returns persistent 401 errors.
