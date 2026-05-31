# Quiz: CSS Accessibility & Focus Management

## Questions

### Question 1 (Medium - Focus Rings & Outline resets)
Is the CSS rule below considered an accessibility violation? If so, why, and how do you resolve it while maintaining a custom design aesthetic?
```css
/* Custom resets */
button:focus {
  outline: none;
}
```

---

### Question 2 (Hard - Skip Navigation Links)
Given this standard skip link layout, how do you make the skip link visually hidden by default but visible when focused by keyboard users?
```html
<a href="#main-content" class="skip-link">Skip to main content</a>
<main id="main-content">...</main>
```

---

### Question 3 (Senior - Focus Trap State Restoration)
Explain the steps required to implement a keyboard focus trap inside a modal dialog using vanilla DOM APIs. How do you handle Tab/Shift-Tab key bounds, and what should happen when the modal closes?

---

## Answer Key & Explanations

### Question 1: Outline Resets and Keyboard Focus Rings
- **Difficulty:** Medium
- **Answer:** Yes, this is a major accessibility violation (violates WCAG 2.1 Success Criterion 2.4.7 Focus Visible).
- **Explanation:**
  - Removing the default outline with `outline: none` removes the visual indicator that shows keyboard users (e.g. users navigating via Tab key) which interactive element is currently focused.
  - This makes the site unusable for keyboard-only and screen-reader users.
  - **Resolution**: Use the `:focus-visible` pseudo-class. This pseudo-class only applies styling when the browser determines that focus should be visually indicated (typically when navigating via keyboard, but not when clicking with a mouse):
    ```css
    /* Reset default outline, but define custom visible outline only on keyboard focus */
    button:focus {
      outline: none;
    }
    button:focus-visible {
      outline: 2px solid #0076ff;
      outline-offset: 4px;
    }
    ```
- **Common Mistakes:** Removing outlines completely to satisfy designer visual requests without providing a custom keyboard focus ring fallback.
- **Interviewer Follow-up:** "How does `:focus-visible` differ from `:focus`?" (`:focus` applies whenever an element receives focus (click or keyboard), while `:focus-visible` only applies when the browser determines that focus should be visually indicated (typically keyboard tab navigation)).
- **Senior-Level Insight:** Maintain outline offsets and high-contrast color choices in focus states to ensure compliance with WCAG accessibility guidelines.

---

### Question 2: Visually Hidden Skip Links
- **Difficulty:** Hard
- **Answer:**
```css
.skip-link {
  position: absolute;
  top: -9999px;
  left: -9999px;
  overflow: hidden;
}

.skip-link:focus {
  position: static;
  top: auto;
  left: auto;
  width: auto;
  height: auto;
  overflow: visible;
  padding: 10px 20px;
  background-color: #0076ff;
  color: #ffffff;
  z-index: 9999;
}
```
- **Explanation:**
  - Standard skip links allow keyboard users to skip past header navigations directly to the main content.
  - To hide the link from mouse users without hiding it from screen readers, position it offscreen: `top: -9999px`. (Do **not** use `display: none` or `visibility: hidden`, as those remove the element from the accessibility tree entirely).
  - When the keyboard user tabs to the link, the `:focus` selector triggers, reverting the position back to the normal flow (or fixed/absolute overlay) and rendering it visually on screen.
- **Common Mistakes:** Using `display: none` to hide skip links, which prevents screen readers and keyboard users from accessing them.
- **Interviewer Follow-up:** "What other accessibility considerations are needed when linking to `#main-content`?" (The target `<main>` element must be focusable. On older browsers, you may need to add `tabindex="-1"` to the target to ensure focus shifts correctly).
- **Senior-Level Insight:** Skip links are a simple, high-value addition that significantly improves developer compliance audits and accessibility scores.

---

### Question 3: Modal Focus Trap State Mechanics
- **Difficulty:** Senior
- **Answer:**
  1. **Save Previous Focus**: Save the currently focused element (`document.activeElement`) before opening the modal.
  2. **Initial Focus**: Move focus to the first interactive element inside the modal.
  3. **Keydown Listener**: Listen for `keydown` events inside the modal:
     - If the user presses `Tab`, check if the active element is the *last* focusable element inside the modal. If it is, prevent default behavior and move focus back to the *first* focusable element.
     - If the user presses `Shift-Tab` (backwards navigation), check if the active element is the *first* focusable element. If it is, prevent default and wrap focus back to the *last* focusable element.
  4. **Restore Focus**: When the modal closes, restore focus back to the saved element (`document.activeElement` recorded in step 1).
- **Common Mistakes:** Forgetting to handle `Shift-Tab` or failing to restore focus when closing the modal, which disorients keyboard users.
- **Interviewer Follow-up:** "How do you identify all focusable elements inside a container programmatically?" (Query the container for focusable tags: `a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), [tabindex]:not([tabindex="-1"])`).
- **Senior-Level Insight:** Focus traps are mandatory for accessible dialogs and dropdown menus, ensuring that keyboard users do not lose their place or tab into hidden background layers.
