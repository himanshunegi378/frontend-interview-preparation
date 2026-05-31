# Practical: Design Token Compiler

## Problem Title: Platform-Agnostic Design Token Compiler

## Difficulty: Senior

## Skills Tested
- JSON Schema Traversal & Parsing
- String compilation (code generation)
- Flat key-path serialization (flattening nested objects)
- File writing pipeline (mocked or actual)

## Problem Statement
In design systems, brand guidelines are stored in a central JSON file (tokens) representing colors, spacing, and typography. Product teams on different platforms need these tokens compiled to their native formats.

Write a compiler function `compileTokens(tokensJson)` that takes a nested tokens JSON object and compiles it to two string targets:
1.  **CSS Custom Properties**: A string format of CSS variables wrapped inside a `:root {}` selector block.
2.  **TypeScript Theme Definition**: A nested, readonly TypeScript object structure containing the flat value strings, facilitating autocomplete.

Nested JSON Token Input Example:
```json
{
  "color": {
    "primary": { "value": "#0070f3" },
    "neutral": {
      "dark": { "value": "#333333" }
    }
  },
  "spacing": {
    "small": { "value": "8px" }
  }
}
```

Target Output Formats:
- CSS Custom Properties:
```css
:root {
  --color-primary: #0070f3;
  --color-neutral-dark: #333333;
  --spacing-small: 8px;
}
```
- TypeScript:
```typescript
export const tokens = {
  color: {
    primary: "var(--color-primary)",
    neutral: {
      dark: "var(--color-neutral-dark)"
    }
  },
  spacing: {
    small: "var(--spacing-small)"
  }
} as const;
```

## Starter Code
```javascript
/**
 * Design Token Compiler for design systems.
 */
export function compileTokens(tokensJson) {
  // Implement
  return {
    css: "",
    ts: ""
  };
}
```

## Requirements
- Support arbitrary nesting of token categories.
- A leaf node is always identified by containing a key named `"value"`.
- The CSS variable names must be derived from the object paths joined by hyphens (e.g., `color.primary` $\rightarrow$ `--color-primary`).
- The TypeScript output must refer to the CSS variable references rather than hardcoding the raw hex/pixel values. This allows themes to be swapped dynamically on the client by modifying CSS values while maintaining strong type checks.

## Edge Cases
- Token names containing spaces or uppercase characters (convert to kebab-case).
- Missing `"value"` key at leaf nodes (raise error or skip).
- Empty tokens object.

## Expected Approach
We use recursive depth-first search (DFS) to traverse the tokens object.
We maintain an array of path keys to keep track of the current nesting level.
If the current node contains the `"value"` key, we have found a leaf:
1.  Join the path keys with hyphens: `path.join("-")`.
2.  Add to the CSS variable list: `--${variableName}: ${node.value};`.
3.  Add the TypeScript mapping: `path` maps to `var(--${variableName})`.

To build the TypeScript object representation, we write a helper function that inserts the `var(...)` strings into a replica nested object structure matching the original path, and serialize it to a string.

## Solution
```javascript
/**
 * Compiles a nested tokens JSON into CSS Custom Properties and TypeScript mappings.
 * @param {Object} tokensJson 
 * @returns {{ css: string, ts: string }}
 */
export function compileTokens(tokensJson) {
  const cssVariables = [];
  const tsObject = {};

  /**
   * Helper to set nested property on object by path array.
   */
  function setNestedProperty(obj, path, value) {
    let current = obj;
    for (let i = 0; i < path.length - 1; i++) {
      const key = path[i];
      if (!current[key]) {
        current[key] = {};
      }
      current = current[key];
    }
    current[path[path.length - 1]] = value;
  }

  /**
   * Recursive DFS traversal of the tokens tree.
   */
  function traverse(node, currentPath = []) {
    if (!node || typeof node !== "object") return;

    if ("value" in node) {
      // Leaf node detected
      const cleanPath = currentPath.map(p => p.toLowerCase().replace(/\s+/g, "-"));
      const varName = `--${cleanPath.join("-")}`;
      
      cssVariables.push(`  ${varName}: ${node.value};`);
      setNestedProperty(tsObject, cleanPath, `var(${varName})`);
      return;
    }

    for (const [key, child] of Object.entries(node)) {
      traverse(child, [...currentPath, key]);
    }
  }

  // 1. Run tree traversal
  traverse(tokensJson);

  // 2. Format CSS Output
  const cssOutput = `:root {\n${cssVariables.join("\n")}\n}`;

  // 3. Format TS Output
  const tsOutput = `export const tokens = ${JSON.stringify(tsObject, null, 2).replace(/"/g, "")} as const;`;

  return {
    css: cssOutput,
    ts: tsOutput
  };
}
```

## Explanation
- **Static Token Resolution**: DFS scans the JSON configurations, locating leaves and compiling their variable paths.
- **Dynamic Variable Injection**: By mapping TS values to `var(--...)`, we decouple component styling variables from hardcoded token hex values. Components consume the type-safe token references (e.g. `tokens.color.primary`), but the actual style output is driven dynamically by the CSS custom properties, allowing client-side dynamic overrides.

## Time Complexity
- **Tree Traversal**: $O(T)$ where $T$ is the count of nodes inside the tokens JSON.
- **Output Compilation**: $O(T)$ to stringify outputs.

## Space Complexity
- **Recursive Call Stack**: $O(D)$ where $D$ is the nesting depth of the design tokens.

---

## Interviewer Follow-ups
1. "How would you handle composite design tokens, like typography models containing size, weight, and line-height values under a single key?"
   (Detect composite node values and generate individual sub-variables, e.g. `--font-header-size`, `--font-header-weight`, rather than a single string).
2. "How would you integrate this compilation script into a CI/CD build pipeline?"
   (Run the compiler script during post-install or build hooks, generating `.css` and `.ts` files inside a target output folder before the compilation steps run).

---

## Senior-Level Discussion
Developing custom asset preprocessors shows a solid understanding of compile-time optimizations.
By converting static configuration files into type-safe variables, we improve developer experience (autocomplete support) and maintain design consistency across multiple codebases without relying on run-time parsing engines.
This pattern represents best practice in design system operations (DesignOps), ensuring consistency across web, native, and document outputs.

---

### Extra Practice: Designing a Form Builder
**Task:** Build a form-schema compiler that generates form layouts dynamically from a JSON configuration array:
```javascript
export function compileFormSchema(schema) {
  return schema.map(field => {
    return `<label>${field.label}</label><input type="${field.type}" name="${field.name}" />`;
  }).join("");
}
```
