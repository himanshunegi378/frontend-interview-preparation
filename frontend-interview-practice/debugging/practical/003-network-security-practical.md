# Practical: Debugging CORS & Network Security

## Problem Title: CORS Preflight & Credentials Validation Simulator

## Difficulty: Senior

## Skills Tested
- Browser CORS validation mechanisms
- HTTP Preflight (`OPTIONS`) request negotiation
- Cookie credential sharing policy checks
- Header inspection & validation logic

## Problem Statement
A common issue during deployment transitions is misconfigured CORS policies. 
Implement a validator function `validateCors(request, serverConfig)` that simulates browser and server CORS handshakes. The function must check an incoming mock request against server configurations, verify whether it passes browser CORS security, and return either a success payload (with response headers) or throw a descriptive error indicating the exact CORS violation (e.g., origin mismatches, wildcard credential violations, or missing methods).

A Mock Request is represented as:
```javascript
const request = {
  url: "https://api.example.com/users",
  method: "OPTIONS", // OPTIONS representing preflight
  headers: {
    "Origin": "https://app.example.com",
    "Access-Control-Request-Method": "POST",
    "Access-Control-Request-Headers": "Content-Type, Authorization",
    "Cookie": "session_id=123" // Contains credentials
  }
};
```

A Server Config is represented as:
```javascript
const serverConfig = {
  allowedOrigins: ["https://app.example.com"], // or ["*"]
  allowedMethods: ["GET", "POST", "OPTIONS"],
  allowCredentials: true
};
```

## Starter Code
```javascript
/**
 * Simulates a browser-to-server CORS and credentials check.
 * Returns response headers on success, or throws an error on failure.
 */
export function validateCors(request, serverConfig) {
  const responseHeaders = {};
  // Implement CORS checks
  return responseHeaders;
}
```

## Requirements
- Support preflight (`OPTIONS`) request checks.
- If `allowCredentials` is `true` inside `serverConfig`:
  - Enforce that the allowed origin is not a wildcard `*`. If it is a wildcard, throw an error.
  - Enforce that the response includes `Access-Control-Allow-Credentials: "true"`.
- If the incoming request method or custom headers are not supported by the server configuration, throw an error.
- Return the resolved CORS headers on success.

## Edge Cases
- Request with missing `Origin` header (this is a simple non-CORS request, allow it without CORS headers).
- Case-insensitive comparison of HTTP methods (e.g., `"options"` vs `"OPTIONS"`).

## Expected Approach
1.  Check if `Origin` header exists. If missing, it's a same-origin request; return empty headers.
2.  Compare the request's `Origin` against `serverConfig.allowedOrigins`. If mismatch, throw a CORS origin block error.
3.  If the request uses the `OPTIONS` method (preflight):
    - Retrieve `Access-Control-Request-Method` from the request.
    - Check if it is supported by `serverConfig.allowedMethods`. If not, throw a preflight method block error.
    - Retrieve `Access-Control-Request-Headers`. (For simplicity, assume headers are valid if origins match, or check against allowed headers).
4.  Check credential requirements:
    - If `serverConfig.allowCredentials` is true:
      - If `Origin` matches `*` or is in `allowedOrigins` as `*`, throw a wildcard credential conflict error.
      - Add `Access-Control-Allow-Credentials: "true"` to response headers.
      - Set `Access-Control-Allow-Origin` to the specific request origin.
    - If credentials are not allowed, you can return `Access-Control-Allow-Origin: *` or the matched origin.

## Solution
```javascript
/**
 * Evaluates CORS headers and credential checks.
 * @param {Object} request - Mock HTTP Request object
 * @param {Object} serverConfig - Server's CORS configuration
 * @returns {Object} Response CORS headers on success
 * @throws {Error} Descriptive CORS violation error on block
 */
export function validateCors(request, serverConfig) {
  const origin = request.headers["Origin"] || request.headers["origin"];
  
  // 1. Same-Origin request: Bypass CORS evaluations
  if (!origin) {
    return {};
  }

  const responseHeaders = {};
  const method = request.method.toUpperCase();

  // 2. Validate Origin
  const allowedOrigins = serverConfig.allowedOrigins || [];
  const isOriginAllowed = allowedOrigins.includes(origin) || allowedOrigins.includes("*");

  if (!isOriginAllowed) {
    throw new Error(`CORS Block: Origin "${origin}" is not allowed by Access-Control-Allow-Origin.`);
  }

  // 3. Handle Credentials Constraint
  if (serverConfig.allowCredentials) {
    // Wildcard origin is forbidden when credentials are true
    if (allowedOrigins.includes("*")) {
      throw new Error("CORS Block: Cannot use wildcard '*' for Access-Control-Allow-Origin when credentials are true.");
    }
    responseHeaders["Access-Control-Allow-Origin"] = origin;
    responseHeaders["Access-Control-Allow-Credentials"] = "true";
  } else {
    // If credentials are false, wildcard origin is acceptable
    responseHeaders["Access-Control-Allow-Origin"] = allowedOrigins.includes("*") ? "*" : origin;
  }

  // 4. Handle Preflight OPTIONS checks
  if (method === "OPTIONS") {
    const requestMethod = request.headers["Access-Control-Request-Method"] || request.headers["access-control-request-method"];
    if (!requestMethod) {
      throw new Error("CORS Preflight Block: Missing Access-Control-Request-Method header in OPTIONS request.");
    }

    const allowedMethods = (serverConfig.allowedMethods || []).map(m => m.toUpperCase());
    if (!allowedMethods.includes(requestMethod.toUpperCase())) {
      throw new Error(`CORS Preflight Block: Method "${requestMethod}" is not allowed by Access-Control-Allow-Methods.`);
    }

    responseHeaders["Access-Control-Allow-Methods"] = serverConfig.allowedMethods.join(", ");
    
    const requestHeaders = request.headers["Access-Control-Request-Headers"] || request.headers["access-control-request-headers"];
    if (requestHeaders) {
      responseHeaders["Access-Control-Allow-Headers"] = requestHeaders;
    }
  }

  return responseHeaders;
}
```

## Explanation
- **Wildcard Lock Enforcement**: The simulator enforces the W3C specification where setting `Access-Control-Allow-Origin: *` while enabling `Access-Control-Allow-Credentials: true` is rejected by the browser, throwing a descriptive error.
- **Preflight Request Validation**: Preflight checks examine the requested method and headers against server rules before permitting the browser to dispatch the true operation.

## Time Complexity
- **CORS checking**: $O(O + M)$ where $O$ is the allowed origins count and $M$ is the allowed methods count.

## Space Complexity
- **Memory footprint**: $O(O + M)$ to copy configurations into comparison arrays.

---

## Interviewer Follow-ups
1. "What happens if a response returns CORS headers but is missing status 200/204?"
   (If the preflight OPTIONS returns 4xx or 5xx, the browser considers the check failed and blocks the subsequent request, even if CORS headers are present).
2. "Why can't you write a proxy wrapper to fix CORS on third-party APIs you don't control?"
   (You can. You set up a node proxy server on your own origin. The client requests your proxy (same-origin, no CORS), and the proxy fetches the third-party API from the server side where CORS rules do not apply, returning the data back).

---

## Senior-Level Discussion
Debugging CORS and handshake policies is a core requirement when building distributed microservice systems.
By writing a custom simulation engine, you show you understand browser preflight checks, security scopes, and credential requirements under the hood.
This knowledge is invaluable when configuring corporate API gateways, reverse proxies, and single-sign-on (SSO) authorization flows.

---

### Extra Practice: Auth Token Expiry Debugging
**Task:** Write a token refresh interception function that retries requests upon receiving HTTP 401:
```javascript
export async function fetchWithAuth(url, options = {}, tokenStore) {
  let token = tokenStore.getAccessToken();
  options.headers = { ...options.headers, Authorization: `Bearer ${token}` };
  let response = await fetch(url, options);
  if (response.status === 401) {
    const freshToken = await tokenStore.refreshAccessToken();
    options.headers.Authorization = `Bearer ${freshToken}`;
    response = await fetch(url, options);
  }
  return response;
}
```
