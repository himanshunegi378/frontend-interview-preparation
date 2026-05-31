# Practical: Debugging CSS & SSR Hydration Mismatches

## Problem Title: Stacking Context & SSR Window Mismatch Resolution

## Difficulty: Senior

## Skills Tested
- CSS Stacking Context mechanics
- Next.js SSR Hydration warning diagnostics
- DOM portal overrides
- Client-side execution mounting guards

## Problem Statement
An application suffers from two bugs:
1.  **Overlay Obstruction**: A popup dropdown menu inside a Card component renders *underneath* an adjacent card wrapper, despite the dropdown having `z-index: 100` and the card wrapper having `z-index: 10`.
2.  **SSR Hydration Mismatch**: In a Next.js header component, reading the browser window dimensions directly during execution to render a mobile navigation icon triggers a console warning on page mount.

Diagnose and resolve both bugs.

## Starter Code
```javascript
import React, { useState, useEffect } from "react";

// Bug 1: Dropdown sits behind adjacent card due to stacking context!
export function DropdownCard({ title }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="card" style={{ position: "relative", z-index: 1 }}>
      <h3>{title}</h3>
      <button onClick={() => setIsOpen(!isOpen)}>Toggle Settings</button>
      {isOpen && (
        <div 
          className="dropdown" 
          style={{ position: "absolute", top: "100%", left: 0, zIndex: 100, background: "white", border: "1px solid #ccc" }}
        >
          <ul>
            <li>Edit</li>
            <li>Delete</li>
          </ul>
        </div>
      )}
    </div>
  );
}

// Bug 2: Accessing window width directly during SSR renders triggers Hydration Mismatch!
export function HeaderNavigation() {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  return (
    <header style={{ padding: "10px", background: "#eee" }}>
      <h2>My App</h2>
      {isMobile ? (
        <button aria-label="Open Menu">☰ Mobile Menu</button>
      ) : (
        <nav>
          <a href="/home">Home</a> | <a href="/settings">Settings</a>
        </nav>
      )}
    </header>
  );
}
```

## Requirements
- Fix the Dropdown Card positioning so the dropdown menu always paints on top of adjacent sibling components (without changing the relative positioning of parent cards).
- Resolve the `HeaderNavigation` hydration warning so that server and client initially render identical outputs, checking viewport size only after mounting.

## Edge Cases
- Dynamic resizing of the window: ensure the mobile navigation still responds when dragging screen sizes at runtime.
- Nested stacking contexts: prevent cards from bleeding styles into other parent containers.

## Expected Approach
To resolve Bug 1 (Dropdown Z-index):
Since each `.card` has `position: "relative", zIndex: 1`, they create separate stacking contexts. Sibling cards override each other based on DOM order.
The correct solution is to use a **React Portal** (`createPortal`) to mount the dropdown at the root of `document.body`, completely bypassing the card's stacking context boundary.

To resolve Bug 2 (Hydration Mismatch):
Ensure that the component initially renders the desktop navbar on both server and client (matching default states). Inside a `useEffect` hook, query the window width and update the state to trigger a client-only render update for mobile clients. Additionally, add a window resize listener inside the effect to keep the mobile check updated at runtime.

## Solution
```javascript
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

// Fixed Bug 1: Dropdown mounts to the document body via Portal, bypassing card stacking boundaries
export function DropdownCard({ title }) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState(null);

  const toggleDropdown = (event) => {
    // Measure button location on screen to position the portal absolute overlay
    const rect = event.currentTarget.getBoundingClientRect();
    setButtonRect({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width
    });
    setIsOpen(!isOpen);
  };

  return (
    <div className="card" style={{ position: "relative", zIndex: 1, border: "1px solid #ddd", padding: "15px", margin: "10px" }}>
      <h3>{title}</h3>
      <button onClick={toggleDropdown}>Toggle Settings</button>
      
      {isOpen && buttonRect && createPortal(
        <div 
          className="dropdown-portal" 
          style={{ 
            position: "absolute", 
            top: `${buttonRect.top}px`, 
            left: `${buttonRect.left}px`, 
            minWidth: `${buttonRect.width}px`,
            zIndex: 99999, 
            background: "white", 
            border: "1px solid #ccc",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            padding: "5px"
          }}
        >
          <ul style={{ listStyle: "none", margin: 0, padding: "5px" }}>
            <li style={{ padding: "5px 10px", cursor: "pointer" }}>Edit</li>
            <li style={{ padding: "5px 10px", cursor: "pointer" }}>Delete</li>
          </ul>
        </div>,
        document.body // Mount directly to root body
      )}
    </div>
  );
}

// Fixed Bug 2: Safe SSR Navigation checks width ONLY after mounting
export function HeaderNavigation() {
  const [isMobile, setIsMobile] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    // Check initial width on client mount
    const checkWidth = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkWidth();

    // Listen to runtime viewport resizing
    window.addEventListener("resize", checkWidth);
    
    // Cleanup event listener
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  return (
    <header style={{ padding: "10px", background: "#eee", display: "flex", justifyContent: "space-between" }}>
      <h2>My App</h2>
      {/* 
        If not mounted yet, render default desktop navbar to ensure the 
        server output and initial client output match exactly!
      */}
      {!isMounted || !isMobile ? (
        <nav>
          <a href="/home">Home</a> | <a href="/settings">Settings</a>
        </nav>
      ) : (
        <button aria-label="Open Menu" style={{ padding: "5px 10px" }}>
          ☰ Mobile Menu
        </button>
      )}
    </header>
  );
}
```

## Explanation
- **Portal Insertion**: By mounting the dropdown element onto `document.body` via `createPortal`, we lift it out of the parent `.card`'s stacking context. It sits directly in the root document context, ensuring it paints on top of all other elements.
- **Client Rendering Lock**: Initializing `isMounted` to `false` and setting it to `true` inside `useEffect` ensures that the server render and the client's first paint both compile the desktop `<nav>`. The client evaluates the window size and updates to the mobile menu only during the subsequent commit phase, eliminating the hydration warning.

## Time Complexity
- **DOM calculations**: $O(1)$ constant time bounding rect calculation.

## Space Complexity
- **Portal nodes**: $O(1)$ constant DOM nodes created.

---

## Interviewer Follow-ups
1. "What if the user scrolls the page while the portal dropdown is open? How would you update its coordinates?"
   (Listen to global `scroll` events on window, recalculating `button.getBoundingClientRect()` and updating the portal coordinates in real time).
2. "Why not just disable SSR entirely for components that contain layout logic?"
   (Disabling SSR (using `ssr: false` in dynamic loading) resolves the warning, but leaves a blank gap on initial load, reducing search ranking performance (SEO). Deferring layout checks inside `useEffect` preserves initial text visibility).

---

## Senior-Level Discussion
Debugging stacking context limits and SSR hydration failures is essential when scaling complex web frameworks.
By utilizing React Portals, you decouple overlays from parent style constraints, ensuring consistent visual layouts.
Using client-side mounting gates inside `useEffect` allows you to manage dynamic viewport changes safely, maintaining fast, error-free SSR compilation chains.
