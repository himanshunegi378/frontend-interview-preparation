# Practical: Modular Responsive Widget with Container Queries

## Problem Title: Container-Query-Driven Profile Widget

## Difficulty: Medium / Senior

## Skills Tested
- CSS Container Queries (`@container`)
- Container relative units (`cqw`)
- Fluid Typography with mathematical bounds
- Flexbox and Grid layouts adaptation

## Problem Statement
Build a modular profile widget `.profile-widget` that adapts its layout and text sizes based on the width of its parent container rather than the browser viewport.

The widget must implement three distinct layout states:
1. **Narrow State (Container Width < 350px)**: A centered, vertical card layout (Avatar on top, text centered, buttons stacked at the bottom).
2. **Medium State (Container Width 350px to 600px)**: A horizontal list item layout (Avatar on the left, name/details in the center, buttons aligned on the right).
3. **Wide State (Container Width > 600px)**: A two-column grid layout (Left column displays details, right column displays active dashboard stats).
4. **Fluid Typography**: The user's name font size must scale dynamically between `16px` and `24px` based on container width using container query width units (`cqw`).

## Starter Code
```html
<div class="profile-container">
  <div class="profile-widget">
    <div class="profile-avatar">
      <img src="avatar.jpg" alt="Avatar">
    </div>
    <div class="profile-info">
      <h2 class="profile-name">Jane Doe</h2>
      <p class="profile-title">Lead Architect</p>
    </div>
    <div class="profile-stats">
      <div class="stat-item"><span>12</span> Projects</div>
      <div class="stat-item"><span>1.2k</span> Commits</div>
    </div>
    <div class="profile-actions">
      <button class="btn btn-primary">Connect</button>
      <button class="btn btn-secondary">Message</button>
    </div>
  </div>
</div>
```
```css
/* Implement Container styling and Widget responsive states below */
.profile-container {
  /* Establish containment context */
}

.profile-widget {
  /* Default styles */
}
```

## Requirements
- The container wrapper `.profile-container` must define the containment context.
- Use CSS `@container` syntax to switch layouts.
- Do not use global media queries (`@media`).

## Edge Cases
- **Nested components**: If two widgets are placed on the same page—one in a narrow sidebar and one in the main content area—they must render their respective narrow and wide layouts simultaneously.

## Expected Approach
Declare `container-type: inline-size` on `.profile-container`.
Use the container name or anonymous containment in `@container` queries to target `.profile-widget` child layouts:
- At container widths $\ge 350px$, switch the widget's flex direction to row and position elements horizontally.
- At container widths $\ge 600px$, convert the layout to a grid.
- Use `clamp(1rem, 3cqw + 0.5rem, 1.5rem)` on `.profile-name` to scale typography dynamically based on container width.

## Solution
```css
/* 1. Establish Container Context */
.profile-container {
  container-type: inline-size;
  width: 100%;
  box-sizing: border-box;
}

/* 2. Default State (Narrow: < 350px) */
.profile-widget {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  text-align: center;
  box-sizing: border-box;
  gap: 15px;
}

.profile-avatar img {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
}

.profile-name {
  margin: 0;
  color: #1a202c;
  font-weight: 700;
  /* Fluid Typography based on Container Width (cqw) */
  font-size: clamp(1rem, 4cqw + 0.5rem, 1.5rem);
}

.profile-title {
  margin: 4px 0 0 0;
  font-size: 0.9rem;
  color: #718096;
}

.profile-stats {
  display: none; /* Hide stats in narrow layout */
}

.profile-actions {
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 8px;
}

.btn {
  padding: 8px 16px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  border: none;
}

.btn-primary {
  background-color: #3182ce;
  color: #ffffff;
}

.btn-secondary {
  background-color: #edf2f7;
  color: #4a5568;
}

/* 3. Medium State (350px to 600px) */
@container (min-width: 350px) {
  .profile-widget {
    flex-direction: row;
    justify-content: space-between;
    text-align: left;
    padding: 16px 24px;
  }

  .profile-avatar img {
    width: 60px;
    height: 60px;
  }

  .profile-info {
    flex-grow: 1;
    margin-left: 20px;
  }

  .profile-actions {
    flex-direction: row;
    width: auto;
  }
}

/* 4. Wide State (>= 600px) */
@container (min-width: 600px) {
  .profile-widget {
    display: grid;
    grid-template-columns: 80px 2fr 1fr;
    grid-template-rows: auto auto;
    align-items: center;
    gap: 20px;
    padding: 24px;
  }

  .profile-avatar {
    grid-row: 1 / -1;
  }

  .profile-avatar img {
    width: 80px;
    height: 80px;
  }

  .profile-info {
    grid-column: 2;
    grid-row: 1;
    margin-left: 0;
  }

  .profile-stats {
    display: flex;
    grid-column: 2;
    grid-row: 2;
    gap: 20px;
    font-size: 0.875rem;
    color: #4a5568;
  }

  .profile-stats span {
    font-weight: 600;
    color: #1a202c;
  }

  .profile-actions {
    grid-column: 3;
    grid-row: 1 / -1;
    flex-direction: column;
    justify-content: center;
    align-self: center;
    width: 100%;
  }
}
```

## Explanation
- **Containment Scope**: Setting `container-type: inline-size` on `.profile-container` establishes a query context. Child styles are evaluated relative to this container's width.
- **Dynamic Grid Conversion**: At widths $\ge 600px$, the widget switches from a Flexbox layout to a CSS Grid layout, positioning the avatar, stats, details, and action buttons in a structured grid.
- **Fluid Sizing (cqw)**: The font size matches `clamp(1rem, 4cqw + 0.5rem, 1.5rem)`. Using `cqw` (container query width units) allows the font size to scale dynamically based on the width of the container, while the `1rem` and `0.5rem` values ensure proper fallback scaling when the user zooms.

## Time Complexity
- Resolved during browser layout calculations. Sizing updates scale linearly with container resize events.

## Space Complexity
- $O(1)$ layout rendering overhead.

## Interviewer Follow-ups
1. "What happens if a child element inside a container has styling that modifies the container's width?" (This can trigger an infinite layout loop. The browser detects these loops and stops rendering, but to prevent them, ensure that container widths are managed by parent elements rather than child contents).
2. "How would you write a container query that targets container height?" (Use `container-type: size` on the container, which requires setting a static height on the container element).

## Senior-Level Discussion
Container queries are a game changer for component library development. In modern design systems, components are designed to be layout-agnostic: a card widget should format itself correctly whether it is placed in a narrow sidebar, a wide main content area, or a multi-column grid, without needing global media queries. This makes components highly reusable and simplifies page development.
