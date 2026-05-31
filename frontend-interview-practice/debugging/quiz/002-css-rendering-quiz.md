# Quiz: CSS, Stacking Contexts, & SSR Hydration

## Questions

### Question 1 (Easy/Medium - Stacking Context z-index Conflict)
Consider the following HTML markup:
```html
<div class="box-1" style="position: relative; z-index: 1;">
  <div id="child-a" style="position: absolute; z-index: 9999; background: red;">
    Child A
  </div>
</div>

<div class="box-2" style="position: relative; z-index: 2;">
  <div id="child-b" style="position: absolute; z-index: 5; background: blue;">
    Child B
  </div>
</div>
```
When these elements overlap on screen, does `child-a` (red) render on top of `child-b` (blue), or does `child-b` render on top of `child-a`? Explain the browser's stacking rules.

---

### Question 2 (Medium - Mobile Viewport Horizontal Swipe Bug)
A web page layout looks correct on desktop monitors. However, when loaded on mobile browsers, the page can be swiped horizontally, revealing a white gap on the right side.
1.  What CSS layout constraints cause this bug?
2.  How would you debug this using the browser console to locate the exact element causing the overflow?

---

### Question 3 (Senior - Next.js SSR Date Hydration Mismatch)
A Next.js application renders a welcome banner displaying the current time:
```javascript
import React from "react";

export default function WelcomeBanner() {
  const currentTime = new Date().toLocaleTimeString();

  return (
    <div className="banner">
      <h1>Welcome back!</h1>
      <p>Current server access time: {currentTime}</p>
    </div>
  );
}
```
1.  Explain the Hydration warning that occurs when this page mounts in the browser.
2.  Detail the browser rendering differences that trigger the error.
3.  Provide the correct React fix.

---

## Answer Key & Explanations

### Question 1: Stacking Context Hierarchy
- **Difficulty:** Easy/Medium
- **Answer:** 
  `child-b` (blue) renders **on top** of `child-a` (red), despite having a lower z-index.
- **Explanation:**
  - The elements `.box-1` and `.box-2` both create new **Stacking Contexts** because they have a non-static position (`position: relative`) and a defined `z-index`.
  - The browser compares stacking levels at the parent stacking context boundary first:
    - `.box-2` has `z-index: 2`.
    - `.box-1` has `z-index: 1`.
  - Because `.box-2`'s stacking context is higher, **all** children of `.box-2` are painted on top of `.box-1` and its children, regardless of the child z-index values.
  - Thus, `child-b` (z-index 5) renders on top of `child-a` (z-index 9999).
- **Senior-Level Insight:** When designing modal dialogs or dropdown menus, mount them at the root of `<body>` using portals. This ensures they belong to the root stacking context and will always render on top of other page elements.

---

### Question 2: Viewport Overflow & Scrollbar Debugging
- **Difficulty:** Medium
- **Answer:** 
  1.  The bug is caused by elements having fixed pixel widths or margins that extend beyond the screen width, triggering an `overflow-x` container scroll.
  2.  To locate the element, run a script in the browser console that compares each element's width against the body width.
- **Explanation:**
  - Common CSS causes:
    - Hardcoded widths: `width: 500px` on elements inside mobile layouts (screen width 375px).
    - Grid/flex widths: `flex-basis: 100%` combined with positive margin/padding padding offsets.
    - Unbroken URL links that fail to wrap: `word-break: break-all` is missing.
  - **Console Debugging Script**:
    ```javascript
    // Highlight and log any elements wider than the viewport body
    document.querySelectorAll("*").forEach((el) => {
      if (el.offsetWidth > document.body.offsetWidth) {
        console.log("Overflowing node:", el);
        el.style.outline = "2px solid red"; // Highlight visually in red outline
      }
    });
    ```
- **Senior-Level Insight:** Avoid applying `overflow-x: hidden` to the body to "fix" mobile scroll bugs. This merely hides the scrollbar without resolving the layout issues, and can break sticky header position checks on mobile Safari.

---

### Question 3: Dynamic Server-to-Client Hydration Mismatch
- **Difficulty:** Senior
- **Answer:** 
  1.  React logs: `Warning: Text content did not match. Server: "10:15:30 AM" Client: "10:15:32 AM"`.
  2.  The error triggers because the time changes during the delay (e.g. 2 seconds) between the server compiling the HTML string and the client browser running the hydration script.
- **Explanation:**
  - During server render, Next.js compiles the banner: `<p>Current server access time: 10:15:30 AM</p>`.
  - The HTML is downloaded and painted instantly by the browser.
  - When the JS bundle loads, React runs the first render cycle to build the client virtual DOM tree. During this run, `new Date().toLocaleTimeString()` evaluates to a new time (e.g. `10:15:32 AM`).
  - React compares the server's HTML structure against its new virtual tree. Because the text contents do not match, React throws a hydration warning and is forced to re-paint the DOM node, causing layout stutters.
- **Fix**:
  Ensure the initial client render matches the server output by wrapping the dynamic date update inside `useEffect`:
  ```javascript
  import React, { useState, useEffect } from "react";

  export default function WelcomeBanner() {
    const [time, setTime] = useState("");

    useEffect(() => {
      // Runs only on the client after mounting, preventing mismatches
      setTime(new Date().toLocaleTimeString());
    }, []);

    return (
      <div className="banner">
        <h1>Welcome back!</h1>
        <p>Current server access time: {time || "Loading..."}</p>
      </div>
    );
  }
  ```
- **Senior-Level Insight:** In SSR setups, any component that displays dates, currencies, window measurements, or checks user localStorage must defer rendering dynamic values until after the client-side mount phase completes.

---

### Question 4 (Dropdown Positioning Issues)
Why do dropdown overlay menus clip behind adjacent components inside container elements with `overflow: hidden`?
**Answer:** `overflow: hidden` clips all child nodes exceeding box boundary layouts. Bypassing this requires mounting overlays onto document roots via Portals.
