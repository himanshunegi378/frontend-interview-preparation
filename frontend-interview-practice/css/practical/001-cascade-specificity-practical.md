# Practical: Specificity Calculator

## Problem Title: Specificity Parser Engine

## Difficulty: Senior

## Skills Tested
- CSS Specificity Calculations
- String parsing and Regular Expressions
- Tokenization and boundary detection
- Handling nested pseudo-selectors (`:not`, `:is`, `:where`)

## Problem Statement
Implement a JavaScript function `calculateSpecificity(selector)` that parses a CSS selector string and returns its specificity as an array vector: `[A, B, C]`.
- **A**: ID Selectors (`#id`)
- **B**: Class selectors (`.class`), Attribute selectors (`[attr]`), and Pseudo-classes (`:hover`, `:first-child`)
- **C**: Type (element) selectors (`div`) and Pseudo-elements (`::before`)

The parser must account for:
- Commas separating multiple selectors (return the specificity of the *most specific* selector in the list).
- Pseudo-classes that wrap other selectors:
  - `:not(x)` and `:is(x)` add the specificity of the most specific selector inside their arguments.
  - `:where(x)` adds zero specificity, ignoring its content.

## Starter Code
```javascript
/**
 * @param {string} selector - The CSS selector string
 * @returns {[number, number, number]} Specificity array [A, B, C]
 */
export function calculateSpecificity(selector) {
  // Implement
  return [0, 0, 0];
}
```

## Requirements
- Support nesting of pseudo-selectors (e.g., `:not(:is(.active, #modal))`).
- Handle complex combinations of spaces, attribute brackets, and wildcards (`*`, which adds `[0, 0, 0]`).

## Edge Cases
- **Multiple selectors**: `div, .card, #header` should parse each, and return `[1, 0, 0]` (which is the specificity of `#header`).
- **Pseudo-elements**: Ensure double-colon selectors like `::after` and single-colon legacy representations like `:after` are classified correctly under Element specificity (**C**), while pseudo-classes like `:hover` remain under Class specificity (**B**).

## Expected Approach
To parse selectors, clean up extra spaces and split complex selector lists by commas. For each sub-selector, count standard tokens using regex patterns for IDs, classes, and attribute brackets. To parse nested pseudo-classes like `:not()`, `:is()`, and `:where()`, implement recursive parentheses balance checking. Parse the inner arguments, apply their specificity rules, and add them to the parent totals.

## Solution
```javascript
export function calculateSpecificity(selector) {
  if (!selector || typeof selector !== "string") return [0, 0, 0];

  const subSelectors = splitByCommas(selector.trim());
  let maxSpecificity = [0, 0, 0];

  for (const sub of subSelectors) {
    const spec = parseSingleSelector(sub);
    if (compareSpecificity(spec, maxSpecificity) > 0) {
      maxSpecificity = spec;
    }
  }

  return maxSpecificity;
}

function compareSpecificity(spec1, spec2) {
  for (let i = 0; i < 3; i++) {
    if (spec1[i] !== spec2[i]) {
      return spec1[i] - spec2[i];
    }
  }
  return 0;
}

function splitByCommas(str) {
  const parts = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < str.length; i++) {
    if (str[i] === "(") depth++;
    if (str[i] === ")") depth--;
    if (str[i] === "," && depth === 0) {
      parts.push(str.substring(start, i).trim());
      start = i + 1;
    }
  }
  parts.push(str.substring(start).trim());
  return parts;
}

function parseSingleSelector(selector) {
  let a = 0; // IDs
  let b = 0; // Classes, Attributes, Pseudo-classes
  let c = 0; // Elements, Pseudo-elements

  let current = selector;

  // 1. Remove pseudo-elements that use :: or legacy single-colon pseudo-elements
  const pseudoElements = [
    "::before", "::after", "::first-line", "::first-letter", "::selection", "::placeholder",
    ":before", ":after", ":first-line", ":first-letter"
  ];

  for (const pseudo of pseudoElements) {
    const regex = new RegExp(pseudo, "gi");
    let match;
    while ((match = regex.exec(current)) !== null) {
      c++;
      current = current.replace(match[0], "");
    }
  }

  // 2. Parse nested pseudo-classes recursively
  const pseudoClassesRegex = /:(not|is|where)\(/gi;
  let match;
  while ((match = pseudoClassesRegex.exec(current)) !== null) {
    const type = match[1].toLowerCase();
    const startIndex = match.index + match[0].length;
    let depth = 1;
    let endIndex = startIndex;

    while (depth > 0 && endIndex < current.length) {
      if (current[endIndex] === "(") depth++;
      if (current[endIndex] === ")") depth--;
      endIndex++;
    }

    const innerContent = current.substring(startIndex, endIndex - 1);
    const innerSpecificity = calculateSpecificity(innerContent);

    if (type === "not" || type === "is") {
      a += innerSpecificity[0];
      b += innerSpecificity[1];
      c += innerSpecificity[2];
    }
    // "where" adds 0 specificity, so we do nothing with innerSpecificity

    // Remove the parsed pseudo-class from the string
    current = current.substring(0, match.index) + current.substring(endIndex);
    pseudoClassesRegex.lastIndex = 0; // Reset regex
  }

  // 3. Count ID selectors
  const idRegex = /#[a-zA-Z0-9_-]+/g;
  const ids = current.match(idRegex) || [];
  a += ids.length;
  current = current.replace(idRegex, "");

  // 4. Count Attribute selectors
  const attrRegex = /\[[^\]]+\]/g;
  const attrs = current.match(attrRegex) || [];
  b += attrs.length;
  current = current.replace(attrRegex, "");

  // 5. Count Class selectors
  const classRegex = /\.[a-zA-Z0-9_-]+/g;
  const classes = current.match(classRegex) || [];
  b += classes.length;
  current = current.replace(classRegex, "");

  // 6. Count remaining pseudo-classes (excluding standard tag colons)
  const pseudoClassRegex = /:[a-zA-Z0-9_-]+/g;
  const pseudoClasses = current.match(pseudoClassRegex) || [];
  b += pseudoClasses.length;
  current = current.replace(pseudoClassRegex, "");

  // 7. Count elements (tag names)
  // Clean combinators first: >, +, ~, spaces, *
  const tagString = current.replace(/[>+~*]/g, " ").replace(/\s+/g, " ").trim();
  if (tagString) {
    const tags = tagString.split(" ");
    for (const tag of tags) {
      if (tag && /^[a-zA-Z0-9]+$/.test(tag)) {
        c++;
      }
    }
  }

  return [a, b, c];
}
```

## Explanation
- **Comma splitting**: The helper `splitByCommas` handles parenthetical depths so that commas inside nested pseudo-selectors (like `:is(div, span)`) do not split the root selector string.
- **Recursive Evaluator**: When encountering `:not()`, `:is()`, or `:where()`, the engine isolates the nested contents, runs `calculateSpecificity` on the interior selectors recursively, and integrates the results based on CSS rules (merging for `:not`/`:is`, ignoring for `:where`).
- **Regex Ordering**: By matching and replacing parsed tokens (IDs, then attributes, then classes), we prevent substrings (like class names containing numbers or hyphens) from double-triggering tag name lookups.

## Time Complexity
- $O(S)$ where $S$ is the length of the selector string, as we traverse characters linearly to match parentheses depths.

## Space Complexity
- $O(S)$ recursion stack space for deeply nested selectors.

## Interviewer Follow-ups
1. "How would you handle inline style overrides in this specificity model?" (Inline styles override all selector categories, which could be represented as an extra column at the front of the vector: `[1, a, b, c]`).
2. "Why does `:where()` return zero specificity regardless of its parameters?" (The `:where()` pseudo-class was designed specifically to allow applying utility styles that can be easily overridden without inflating specificity vectors).

## Senior-Level Discussion
In web performance and CSS linting engines, calculating specificity is used to find redundant styles and identify overrides. Parsing selectors dynamically helps monitor CSS delivery, ensuring that third-party style packages do not contaminate internal component styles with high-specificity selectors.

---

### Extra Practice: CSS Variables & Inheritance overrides
**Task:** Implement theme properties using CSS custom variables that support inheritance overrides on nested child nodes:
```css
:root {
  --primary-color: #333;
}
.dark-theme {
  --primary-color: #fff;
}
.button {
  background-color: var(--primary-color);
}
```
