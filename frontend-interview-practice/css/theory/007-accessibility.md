# CSS Accessibility, Dark Mode, & Print Styles

## Why It Matters
A senior frontend engineer must ensure web applications are usable by all individuals, including those with visual, motor, or cognitive impairments. This means designing layouts that respect system preferences (dark mode, reduced motion), support keyboard-only navigation without losing focus rings, maintain proper color contrast ratios, and print elegantly. Failing to address accessibility leads to WCAG non-compliance, legal risks, and poor user experiences.

---

## Core Concepts & Mental Models

### 1. Keyboard Navigation & Focus Ring Management
Keyboard-only users rely on the visual focus indicator (the "focus ring") to know which element is currently active.
- **The Trap**: Historically, developers used `outline: none` or `outline: 0` to remove the default browser focus outline because of aesthetic preferences. This makes the page completely unusable for keyboard navigators.
- **Modern Solution**: Utilize `:focus-visible` rather than `:focus`. `:focus-visible` only applies the outline when the browser detects keyboard interaction, avoiding the focus ring for mouse clicks while keeping it visible for keyboard navigation.
- **Sizing outlines**: Use `outline-offset` to push the focus ring away from the element boundary, improving readability:
```css
button:focus-visible {
  outline: 2px solid #005fcc;
  outline-offset: 4px;
}
```

### 2. Prefers-Reduced-Motion (Managing Animations)
For users with vestibular disorders, fast screen movement, parallax scrolling, or complex transitions can cause nausea or dizziness.
- **The Solution**: Use the `prefers-reduced-motion` media query to disable or simplify CSS transitions and keyframe animations:
```css
@media (prefers-reduced-motion: reduce) {
  *, ::before, ::after {
    animation-delay: -1ms !important;
    animation-duration: 1ms !important;
    animation-iteration-count: 1 !important;
    background-attachment: scroll !important;
    scroll-behavior: auto !important;
    transition-duration: 0s !important;
    transition-delay: 0s !important;
  }
}
```

### 3. Color Contrast & Theme Management (Dark Mode)
- **Contrast Ratios**: Under WCAG 2.1 AA, normal text must have a contrast ratio of at least **4.5:1** against its background, and large text (18pt/24px or bold 14pt/18.5px) must have at least **3:1**.
- **Dark Mode**: Managed using the `prefers-color-scheme` media query. The modern approach is to define colors as CSS Custom Properties (variables) and swap their values inside the query:
```css
:root {
  --background-color: #ffffff;
  --text-color: #1a1a1a;
  --primary-color: #005fcc;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background-color: #121212;
    --text-color: #e0e0e0;
    --primary-color: #3399ff;
  }
}

body {
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
}
```

### 4. Print Styles
Web pages often look broken when printed. A senior engineer uses the `@media print` query to optimize physical layouts:
- **Hide UI elements**: Exclude navbars, sidebars, buttons, and footers (`display: none`).
- **Color Overrides**: Force light background and dark text to save ink.
- **Page Breaks**: Control page printing boundaries using properties like `break-inside: avoid` (prevents elements like images or tables from splitting across pages) and `break-before: page`.
- **Expose URLs**: Append link URLs to link text for reference:
```css
@media print {
  body {
    background: white;
    color: black;
  }
  .nav, .sidebar, .footer, button {
    display: none !important;
  }
  a[href]::after {
    content: " (" attr(href) ")";
  }
  .print-page-break {
    break-before: page;
  }
  table, img {
    break-inside: avoid;
  }
}
```

---

## Real-World Case Study / Examples

### Accessible Custom Checkbox
When building custom checkboxes, developers often hide the native input using `display: none`, which removes it from the keyboard focus loop and accessibility tree.
**Fix**: Keep the input accessible but visually hidden using CSS clipping:
```html
<label class="custom-checkbox">
  <input type="checkbox" class="sr-only" />
  <span class="checkbox-indicator"></span>
  Accept Terms
</label>
```
```css
/* Visually hidden but accessible to screen readers */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  border: 0;
}

.checkbox-indicator {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid #ccc;
}

/* Render outline when native hidden input receives keyboard focus */
.sr-only:focus-visible + .checkbox-indicator {
  outline: 2px solid #005fcc;
  outline-offset: 2px;
}
```

---

## Common Interview Traps

### 1. The "display: none" Accessibility Trap
- **Trap**: Hiding content with `display: none` or `visibility: hidden` hides it from screen readers *and* keyboard tab loops.
- **The Solution**: Use the `sr-only` (screen-reader only) pattern to hide visual elements while preserving screen reader readouts. Use `aria-hidden="true"` to hide decorative icons from screen readers.

---

## Junior vs. Senior View

- **Junior View**: "I just use a dark mode library. Outlines are ugly, so I remove them. People print web pages?"
- **Senior View**: "Accessibility is built into the styling system. I structure focus states using `:focus-visible`, support system preferences like `prefers-reduced-motion` and `prefers-color-scheme` using CSS variables, and apply `@media print` styles to hide navigation bars and output URLs on paper. I understand how screen readers consume the DOM tree and ensure interactive states correspond to visual indicators."

---

## Related Interview Questions
1. "How do you style focus states for keyboard users while keeping them hidden for mouse clickers?"
2. "Explain what dynamic viewport units (`svh`, `lvh`, `dvh`) solve compared to standard `vh` on mobile browsers."
3. "How would you prevent images and headers from being split across page boundaries when printing a document?"
4. "Why is the `sr-only` CSS class required for screen reader accessibility, and how does it differ from `opacity: 0`?"
