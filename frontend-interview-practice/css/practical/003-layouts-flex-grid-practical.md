# Practical: Responsive Equal-Height Card Grid with Sticky Footers

## Problem Title: Responsive Layout Engine (Cards Grid)

## Difficulty: Medium

## Skills Tested
- CSS Grid auto-placement algorithms (`auto-fit`)
- Flexbox space distribution within child nodes
- Text overflow handling in flex containers
- Responsive design without media queries

## Problem Statement
Build a responsive dashboard card grid. The layout must satisfy these structural requirements:
1. **Grid Wrapping**: Cards must wrap dynamically as the screen resizes. Do **not** use CSS `@media` queries.
2. **Equal Heights**: All cards in a single row must align to match the height of the tallest card in that row.
3. **Sticky Card Footer**: Each card has a header, body, and action footer. The footer must align at the bottom of the card, regardless of how short the card body text is.
4. **Text Ellipsis**: If the card title is extremely long, it must truncate with an ellipsis (`...`) instead of wrapping or pushing card dimensions out of bounds.

## Starter Code
```html
<div class="card-grid">
  <!-- Card Instance -->
  <div class="card">
    <h3 class="card-title">This is an extremely long title that should truncate instead of breaking the layout</h3>
    <p class="card-body">Short body.</p>
    <footer class="card-footer">Action Button</footer>
  </div>
  
  <div class="card">
    <h3 class="card-title">Normal Title</h3>
    <p class="card-body">This card has a much longer body. This pushes the height of all cards in this row to align. The footer of the adjacent card must stay anchored at the bottom.</p>
    <footer class="card-footer">Action Button</footer>
  </div>
</div>
```
```css
/* Implement styling rules below */
.card-grid {
}

.card {
}

.card-title {
}

.card-body {
}

.card-footer {
}
```

## Requirements
- The minimum width for each card should be `250px`. Cards should stretch to fill the remaining row space.
- Footers must remain anchored to the bottom.
- Titles must truncate cleanly on a single line.

## Edge Cases
- **Varying content lengths**: If one card has a body length of 500 words and another has 5 words, the footers of both cards must align at the bottom of their respective containers.
- **Title overflows**: Long title strings must not force the card to expand horizontally.

## Expected Approach
Use CSS Grid on `.card-grid` with `grid-template-columns: repeat(auto-fit, minmax(250px, 1fr))`. This creates a responsive layout that wraps and scales automatically without media queries.
Make each `.card` a Flexbox container with `flex-direction: column`. This allows stretching child elements. To push the footer to the bottom, set `flex-grow: 1` on `.card-body` (or use `margin-top: auto` on the footer).
To handle title overflows, apply `text-overflow: ellipsis`, `white-space: nowrap`, and `overflow: hidden` to `.card-title`.

## Solution
```css
.card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  width: 100%;
  box-sizing: border-box;
}

.card {
  display: flex;
  flex-direction: column;
  background-color: #ffffff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 20px;
  box-sizing: border-box;
  /* Ensure cards can shrink in flex layouts */
  min-width: 0; 
}

.card-title {
  margin: 0 0 10px 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
  
  /* Text Truncation */
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  /* Prevent flex items from expanding beyond parent */
  width: 100%;
}

.card-body {
  margin: 0 0 20px 0;
  font-size: 0.95rem;
  line-height: 1.5;
  color: #4a4a4a;
  
  /* Flex Grow: Push the footer to the bottom of the card */
  flex-grow: 1;
}

.card-footer {
  margin-top: auto; /* Fallback guard to pin footer */
  padding: 10px 0 0 0;
  border-top: 1px solid #f0f0f0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #0076ff;
  text-align: right;
}
```

## Explanation
- **Equal Heights**: In a grid layout, items in the same row are stretched to match the tallest item by default (`align-items: stretch`). This ensures all `.card` elements have equal heights.
- **Footer Pinning**: By setting `.card` to `display: flex; flex-direction: column` and giving `.card-body` `flex-grow: 1`, the body expands to consume all available height, pushing the footer to the bottom of the card.
- **Min-Width 0**: Flex items have a default `min-width: auto`, which prevents them from shrinking below their content size. If a card contains a long title, this default can prevent the card from shrinking, causing layout overflows. Setting `min-width: 0` on `.card` resolves this.

## Time Complexity
- Resolved during browser layout calculations. Sizing checks scale linearly $O(N)$ with the number of cards.

## Space Complexity
- $O(1)$ layout rendering overhead.

## Interviewer Follow-ups
1. "What if you want to support multi-line title truncation (e.g. truncate after exactly 2 lines)?" (Use the WebKit line-clamp properties: `display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;`).
2. "Why does `min-width: 0` on the flex item prevent the text truncation from expanding the card container width?" (By default, flex items resist shrinking below their content size. `min-width: 0` overrides this default, allowing the item to shrink and triggering the `overflow: hidden` text truncation rules).

## Senior-Level Discussion
Grid-based dashboards must remain stable across screen sizes. Using `repeat(auto-fit, minmax(...))` creates a responsive, fluid layout without media queries, making it easier to manage and maintain.
When building cards that contain dynamic content (like user comments), always configure layout limits (e.g. `min-width: 0` and `overflow` rules) on flex items to prevent text expansions from breaking the grid layout.

---

### Extra Practice: CSS Flexbox & Grid algorithms
**Task:** Build a flex-based layout where items shrink and grow based on dynamic sizing formulas:
```css
.flex-item-stretched {
  flex: 1 1 200px;
}
.flex-item-fixed {
  flex: 0 0 100px;
}
```
