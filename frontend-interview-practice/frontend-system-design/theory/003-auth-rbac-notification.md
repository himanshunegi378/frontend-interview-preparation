# System Design: Auth, RBAC, & Notification Systems

## Problem Statement & Context
An enterprise platform requires a secure client-side authentication system, a flexible Role-Based Access Control (RBAC) UI engine to hide/disable features based on user permissions, and a global toast notification stack that displays real-time system events (success messages, warnings, connection drops) with high visual polish and screen-reader accessibility.

---

## 1. Requirements

### Functional Requirements
- **Authentication**: JWT token management, silent token refresh queues, and route-based auth guards.
- **RBAC UI**: Conditional layout rendering based on permission rules, and disabled statuses on actions.
- **Notification System**: Global toaster stack supporting success, warning, error levels, auto-dismiss timeouts, and manual dismiss triggers.

### Non-Functional Requirements
- **Security**: Strict token protection to defend against XSS and CSRF exploits.
- **Low Paint Overhead**: Toasts must mount outside the main application container via Portals to prevent parent layout shifts.
- **Accessibility**: Screen readers must announce toasts immediately using `aria-live` regions.

---

## 2. Authentication Flow Architecture
To balance security and developer experience, implement a **Short-Lived Access Token + Long-Lived Refresh Token** architecture:

```
[ Client App ] ──(Request API) ──> Interceptor checks: Access token expired?
      │                                    │
      │── Yes (Wait) ──────────────────────┘
      ▼
[ Auth Client ] ──(Silent Refresh POST /refresh with Cookie) ──> Server sends new Access Token
      │
      ▼
Interceptor flushes queued API requests with new Access Token
```

*   **Access Token (Memory)**: Stored in-memory in Javascript state. Short expiration (e.g. 15 minutes). Sent in the `Authorization: Bearer <token>` header.
*   **Refresh Token (HttpOnly Cookie)**: Stored in a `HttpOnly`, `Secure`, `SameSite=Lax` cookie. Long expiration (e.g. 7 days). Validated at `/api/auth/refresh` to issue new Access Tokens.
*   **Silent Refresh Queue**: If an API request fails with a `401 Unauthorized` status (due to token expiry), the client interceptor halts request processing, pushes the request into a buffer queue, triggers a token refresh call, and replays the queued requests with the new token.

---

## 3. Role-Based Access Control (RBAC) UI

### Permission Rules Schema
Store user permissions as an array of permission strings inside the authenticated user context:
```json
{
  "username": "alice",
  "role": "editor",
  "permissions": ["view_dashboard", "edit_articles"]
}
```

### Declarative Permission Gates
Wrap UI elements in a `<PermissionGate>` component to handle rendering constraints declaratively:
```javascript
export function PermissionGate({ permissions, children, fallback = null }) {
  const { user } = useAuth();
  
  const hasPermission = permissions.every(p => user?.permissions.includes(p));

  if (!hasPermission) {
    return fallback;
  }

  return children;
}
```

### Route Guards
Configure the application router to evaluate route metadata before mounting page components:
```javascript
const routes = [
  {
    path: "/admin",
    component: AdminPage,
    permissions: ["manage_users"]
  }
];
```

---

## 4. Toast Notification Stack Architecture

### State & Queue Management
Avoid binding notifications state directly to page-level layouts. Instead, maintain a global, headless notification store:
*   **State Array**: `[{ id, type, message, duration }]`
*   **Actions**: `addToast(message, type)`, `removeToast(id)`

### Portal Toaster Mounting
Render the toaster wrapper in a DOM node at the body root using `createPortal` to isolate style rules and layout behaviors:
```javascript
export function ToasterContainer() {
  const { toasts, removeToast } = useToastStore();
  
  return createPortal(
    <div className="toaster-wrapper" style={{ position: "fixed", bottom: 20, right: 20 }}>
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  );
}
```

---

## 5. Accessibility, Security, & Performance

### Accessibility (a11y)
*   **Aria Live Regions**: Add `role="status"` and `aria-live="polite"` to the toast container so screen readers read alerts automatically. For high-priority errors (like "Payment Failed"), use `role="alert"` and `aria-live="assertive"`.
*   **Keyboard Escape**: Allow users to close modals and notifications by pressing the `Escape` key.

### Security
*   **JWT Storage**: Never cache access/refresh tokens in LocalStorage because they can be exfiltrated via XSS. Always use HttpOnly cookie configurations.
*   **XSS in Toasts**: Escape HTML characters inside toast messages to prevent malicious scripts injected via API notification payloads.

### Performance
*   **Auto-Dismiss Timers**: Ensure that `setTimeout` hooks used to dismiss toasts clean up after themselves on component unmounts to prevent memory leaks.

---

## 6. Tradeoffs & Senior-Level Discussion

### Tradeoff: Cookie-Based Auth vs. Authorization Header Auth
*   *Authorization Header (Bearer)*: Simplifies scaling across multiple domains (avoids CORS cookie restrictions). However, it requires storing access tokens in JavaScript memory, which is vulnerable if an XSS attack accesses the execution stack.
*   *Cookie-Based (Strict)*: More secure against XSS exfiltration. However, it requires handling CSRF protections (using SameSite and CSRF tokens) and introduces domain constraints.

### Senior-Level Talking Points
"When designing authentication in single-page apps, the primary goal is minimizing XSS surface area. We isolate refresh tokens inside HttpOnly cookies, store access tokens in memory, and coordinate API requests using Axios interceptors. The interceptor intercepts 401 errors, buffers outbound requests, silent-refreshes the access token, and replays the queue. For UI controls, we combine route guards with declarative `<PermissionGate>` wrappers to enforce RBAC rules before rendering components."
