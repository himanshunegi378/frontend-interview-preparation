# Practical: Test Anti-Pattern Scanner

## Problem Title: Static Code Analyzer for Testing Best Practices

## Difficulty: Senior

## Skills Tested
- Static Code Analysis (String parsing / Regular expressions)
- Lint Rule Enforcement
- Abstract Pattern Matching
- Code Quality Metrics

## Problem Statement
When codebases scale, developers who are unfamiliar with React Testing Library guidelines often write fragile tests (such as querying class names directly or using snapshots blindly), or write empty tests that pass without executing any assertions.

Implement a static code analyzer function `analyzeTestFile(testCodeString)` that parses a test file's source code and flags the following anti-patterns:
1.  **Direct DOM Queries**: Warn if code calls `.querySelector`, `.querySelectorAll`, `.getElementById`, or `.getElementsByClassName` inside test scopes, suggesting standard Testing Library queries instead.
2.  **Snapshot Fragility**: Flag any occurrences of `.toMatchSnapshot()` or `.toMatchInlineSnapshot()`, recommending explicit assertions.
3.  **Empty Assertions**: Flag any test blocks (`it(...)` or `test(...)`) that do not contain at least one `expect(...)` call.

## Starter Code
```javascript
/**
 * Analyzes a test file's code string and returns a list of quality violations.
 */
export function analyzeTestFile(testCodeString) {
  const violations = [];
  // Implement analyzer
  return violations;
}
```

## Requirements
- Output format must be an array of violation objects: `{ rule: string, line: number, message: string }`.
- Find the line number of each violation (1-indexed).
- To detect empty assertions, track the boundaries of test blocks (`it(...)` or `test(...)`) and ensure they contain the substring `expect(`.

## Edge Cases
- Test code comments: ignore matches that occur inside single-line (`//`) or multi-line (`/* ... */`) comments.
- Nested test blocks (e.g. `describe` blocks containing multiple `it` blocks).
- String literals: ignore matches if they occur inside string constants (e.g. `const msg = "don't querySelector"`).

## Expected Approach
For a robust yet simple implementation:
1.  Split the code into lines to track line numbers.
2.  Maintain a state machine or use regular expressions to strip out comments and string literals, preventing false positives.
3.  Scan each line for direct DOM query regexes: `/\.(querySelector|querySelectorAll|getElementById|getElementsByClassName)\(/`.
4.  Scan each line for snapshot regexes: `/\.toMatch(Inline)?Snapshot\(/`.
5.  To scan for empty assertions:
    - Locate the start of test blocks: `/(?:it|test)\s*\(\s*["'`].*?["'`]\s*,\s*(?:async\s*)?\(\s*\)\s*=>\s*\{/`.
    - Find the matching closing brace `{ ... }` of the test block.
    - Extract the content of the block. If it doesn't contain `expect`, record a violation at the test block's starting line.

## Solution
```javascript
/**
 * Analyzes test file code for testing anti-patterns.
 * @param {string} testCodeString 
 * @returns {Array<{ rule: string, line: number, message: string }>}
 */
export function analyzeTestFile(testCodeString) {
  const violations = [];
  const lines = testCodeString.split("\n");

  // Helper to strip comments and strings to prevent false positives in audits
  function cleanLine(line) {
    // Strip single-line comments
    let cleaned = line.replace(/\/\/.*$/, "");
    // Strip string literals (simple match for demonstration)
    cleaned = cleaned.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '""');
    return cleaned;
  }

  // 1. Line-by-line checks (DOM Queries and Snapshots)
  lines.forEach((rawLine, index) => {
    const lineNumber = index + 1;
    const line = cleanLine(rawLine);

    // Rule A: Direct DOM Queries
    const domQueryMatch = line.match(/\.(querySelector|querySelectorAll|getElementById|getElementsByClassName|getElementsByTagName)\(/);
    if (domQueryMatch) {
      violations.push({
        rule: "DIRECT_DOM_QUERY",
        line: lineNumber,
        message: `Line ${lineNumber}: Avoid calling DOM query '.${domQueryMatch[1]}' directly in tests. Use screen.getByRole or screen.getByText instead.`
      });
    }

    // Rule B: Snapshot Fragility
    const snapshotMatch = line.match(/\.toMatch(Inline)?Snapshot\(/);
    if (snapshotMatch) {
      violations.push({
        rule: "SNAPSHOT_FRAGILITY",
        line: lineNumber,
        message: `Line ${lineNumber}: Snapshot tests are fragile and hard to maintain. Replace with explicit assertions (e.g. expect(...).toBeInTheDocument()).`
      });
    }
  });

  // 2. Scan for empty assertions in test blocks
  // Find test blocks: it(...) or test(...)
  const testBlockRegex = /(?:it|test)\s*\(\s*["'`].*?["'`]\s*,\s*(?:async\s*)?\([\s\S]*?\)\s*=>\s*\{([\s\S]*?)\}/g;
  
  let match;
  while ((match = testBlockRegex.exec(testCodeString)) !== null) {
    const blockContent = match[1];
    const blockIndex = match.index;

    // Calculate line number where the test block begins
    const beforeBlock = testCodeString.substring(0, blockIndex);
    const startLine = beforeBlock.split("\n").length;

    // Check if the block has comments stripped before searching for expect
    const cleanedBlock = blockContent
      .replace(/\/\*[\s\S]*?\*\//g, "") // Strip block comments
      .replace(/\/\/.*$/gm, "");        // Strip line comments

    if (!cleanedBlock.includes("expect")) {
      violations.push({
        rule: "EMPTY_ASSERTION",
        line: startLine,
        message: `Line ${startLine}: Test block contains no 'expect()' assertion. This is a false-pass hazard.`
      });
    }
  }

  return violations;
}
```

## Explanation
- **False Positive Defense**: Stripping out comments and string literals is essential. If a developer comments out a buggy `.querySelector` call, our parser ignores it, avoiding false alarms.
- **Syntactic Block Analysis**: Tracking the test boundaries and looking for the `expect` substring catches tests that execute code but fail to assert any results, which are a major source of silent regressions in CI pipelines.

## Time Complexity
- **Analysis Execution**: $O(C)$ where $C$ is the length of the test code string (evaluating regex patterns over the file size).

## Space Complexity
- **Buffer Storage**: $O(L)$ where $L$ is the number of lines to store the split string elements in memory.

---

## Interviewer Follow-ups
1. "How would you extend this to check if user events are awaited correctly? (e.g. `userEvent.click` must be awaited in RTL)."
   (Search for lines containing `userEvent.` that are not prefixed by the `await` keyword: `/^(?!.*await\s+)UserEvent\./`).
2. "Why not just use ESLint standard plugins like `eslint-plugin-testing-library`?"
   (Using existing ESLint plugins is always preferred in production. Writing a custom parser during interviews proves you understand how AST parsers and static code checks operate under the hood).

---

## Senior-Level Discussion
Writing custom code quality checkers demonstrates strong systems engineering skills.
By enforcing testing boundaries at compile-time or lint-time, you protect codebases from scaling degradations, ensuring tests remain reliable, maintainable, and highly resilient to changes.
This design separates the quality checks from execution environments, representing best practices in developer tooling.

---

### Extra Practice: Playwright End-to-End Test
**Task:** Write a pseudo end-to-end user navigation test script validating login and redirect limits:
```javascript
// Simulating E2E testing flows
export async function testLoginNavigation(page) {
  await page.goto("/login");
  await page.fill("#username", "user");
  await page.click("#login-btn");
  const url = await page.url();
  return url === "/dashboard";
}
```
