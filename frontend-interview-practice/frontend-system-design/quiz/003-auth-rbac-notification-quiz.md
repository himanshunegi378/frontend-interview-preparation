# Quiz: Auth, RBAC, & Notification Systems

## Questions

### Question 1 (Medium - Concurrent Token Refresh Requests)
An application launches 5 parallel API calls (`fetchUserData`, `fetchBilling`, etc.) when loading a dashboard. If the Access Token is expired, a naive Axios/Fetch interceptor will detect the 401 error and trigger 5 concurrent `/refresh` requests.
Why is this duplicate execution problematic, and how do you ensure only a single refresh request is sent while buffering the other 4 requests?

---

### Question 2 (Hard - Client-Side RBAC Security Boundary)
A developer wraps administrative tools in a permission gate:
```javascript
<PermissionGate permissions={["admin_panel"]}>
  <AdminConfigForm />
</PermissionGate>
```
An interviewer asks: "Since all JavaScript is compiled and sent to the client, a user can modify their local permissions array in the browser console or intercept the JS code to display this element. Does client-side permission gating provide true security? If not, what is its purpose, and how do we enforce security?"

---

### Question 3 (Senior - Performance & Reflows in Toast Lists)
When bulk processing imports, an application triggers 15 toast alerts in under 1 second. Each toast animates onto the screen, pushing existing toasts down. On mobile devices, this causes heavy stuttering and input lag.
What CSS/DOM properties are causing this lag, and how would you redesign the Toaster component to run animations at 60 FPS?

---

## Answer Key & Explanations

### Question 1: Connection Token Refresh Race & Queues
- **Difficulty:** Medium
- **Answer:** 
  Concurrent `/refresh` calls trigger race conditions: the authentication server may invalidate previous refresh tokens upon rotating them, causing subsequent refresh calls in the same batch to fail and log the user out.
  
  To solve this, use an **`isRefreshing` flag** and a **request queue** inside the interceptor.
- **Explanation:**
  - When the first request returns a 401:
    1.  Check if `isRefreshing` is `true`.
    2.  If `false`, set `isRefreshing = true` and launch the `/refresh` API call.
    3.  If `true`, do not launch a new refresh call. Instead, return a Promise that remains pending, and push the request configuration into a `failedQueue` array:
        ```javascript
        let isRefreshing = false;
        let failedQueue = [];

        const processQueue = (error, token = null) => {
          failedQueue.forEach((prom) => {
            if (error) prom.reject(error);
            else prom.resolve(token);
          });
          failedQueue = [];
        };
        ```
    4.  When the single `/refresh` call completes, set `isRefreshing = false`, extract the new token, execute the callbacks in `failedQueue` to retry all requests, and empty the queue.
- **Senior-Level Insight:** Token rotation is an industry standard for securing refresh tokens. Failing to deduplicate client refresh requests will break applications during concurrent network queries.

---

### Question 2: Client UX vs. API Access Security
- **Difficulty:** Hard
- **Answer:** 
  No, client-side RBAC does **not** provide security. It is exclusively a User Experience (UX) tool designed to hide inactive controls. True security is enforced exclusively at the server-side API boundary.
- **Explanation:**
  - JavaScript executing in the user's browser is fully mutable. A user can open DevTools, alter the user object state (`user.permissions = ['admin_panel']`), and bypass client gates.
  - Therefore, the server must authenticate and validate permissions for *every single API request* it receives (e.g. check JWT permissions before returning database records).
  - **Client-Side Obfuscation**: To prevent unauthorized users from even seeing administrative code:
    1.  **Code-split admin sections**: Wrap the admin routes in `React.lazy` imports.
    2.  **Role-based chunk distribution**: Ensure the bundler/server only delivers the admin JS code chunk if the user's session verified on the server has the necessary permissions.
- **Common Mistakes:** Believing that hiding a button in React stops users from calling the API endpoint that the button triggers.
- **Senior-Level Insight:** Treat the frontend client as hostile and untrusted. Design systems assuming that users can view all code and forge any client state, and secure the backend APIs accordingly.

---

### Question 3: Layout Reflows vs. GPU-Accelerated Translations
- **Difficulty:** Senior
- **Answer:** 
  The stuttering is caused by animating layout-triggering CSS properties (like `height`, `margin-top`, or `top`) inside a list of DOM elements. This forces the browser to run expensive reflow and repaint cycles on every frame of the animation.
  
  To fix this:
  1.  **Composite-Only Animations**: Only animate using `transform: translateY(...)` and `opacity`. These run on the GPU, avoiding layout calculations.
  2.  **Toaster Caps**: Limit the maximum number of visible toasts at any time (e.g. max 3). Queue extra notifications in memory, mounting them only as older toasts fade out.
  3.  **Absolute Positioning**: Give each toast a fixed height, position them absolutely inside the toaster container, and calculate their vertical offsets programmatically.
- **Explanation:**
  - Animating properties like `margin-top` forces the browser's layout engine to recalculate the size and position of every single element in the DOM tree, leading to layout thrashing.
  - Translating elements using `transform: translateY` shifts the rendering task to the GPU. The GPU treats each toast as a pre-drawn bitmap layer, moving them instantly without recalculating sizes or repainting document frames.
- **Senior-Level Insight:** In high-speed user interfaces, never allow dynamic elements to shift the document layout continuously. Use viewport caps and GPU layers to keep animations fluid.
