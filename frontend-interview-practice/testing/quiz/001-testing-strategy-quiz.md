# Quiz: Testing Strategy & The Testing Pyramid

## Questions

### Question 1 (Easy/Medium - Snapshot Testing Tradeoffs)
A development team implements Jest Snapshot testing across 50 UI components:
```javascript
it("renders correctly", () => {
  const { container } = render(<UserProfile user={mockUser} />);
  expect(container).toMatchSnapshot();
});
```
Every time a developer changes a Tailwind utility class (e.g., changing padding from `p-4` to `p-6`) or corrects a typo in a label, the snapshots break, requiring developers to run `jest -u` to update snapshots.
What are the primary tradeoffs of snapshot tests, and what is a better alternative?

---

### Question 2 (Medium - React Testing Library Query Priorities)
Why does React Testing Library's official documentation recommend using `screen.getByRole` or `screen.getByLabelText` as primary queries, while discouraging direct CSS class queries like `container.querySelector('.submit-btn')`? How does this tie testing to web standards?

---

### Question 3 (Senior - Inside-Out Mocking Hazards)
In an integration test for a parent dashboard workspace, a developer mock-mounts the sub-tab panels:
```javascript
jest.mock("./UserProfileTab", () => () => <div data-testid="mock-profile-tab" />);
jest.mock("./BillingTab", () => () => <div data-testid="mock-billing-tab" />);
```
The test asserts that clicking the "Billing" tab button displays the container holding `data-testid="mock-billing-tab"`. 
Later, a junior developer refactors `BillingTab` to require a new mandatory prop, but introduces a typo causing a runtime exception on load. 
Explain why the integration test continues to **pass** in the CI pipeline, and how to redesign the test boundary to catch this regression.

---

## Answer Key & Explanations

### Question 1: Snapshot Fragility and Warning Fatigue
- **Difficulty:** Easy/Medium
- **Answer:** 
  Snapshot tests are fragile, generate high maintenance overhead, and cause "warning fatigue," leading developers to blindly update snapshots without verifying if real regressions occurred.
- **Explanation:**
  - **The Problem**: Snapshots serialize the entire HTML output of a component. Any minor, non-breaking design tweak (like changing padding or layout classes) changes the string output, breaking the test.
  - **Warning Fatigue**: Because snapshots break constantly for intentional changes, developers get used to running `jest -u` automatically to make tests pass, without checking the diff. This makes snapshots useless for catching real bugs.
- **Better Alternatives**:
  - Test specific, critical user outcomes:
    ```javascript
    // Assert specific user outcomes instead of DOM trees
    expect(screen.getByText("Alice")).toBeInTheDocument();
    ```
  - Limit snapshot testing to highly stable, data-only serialization structures (such as checking JSON API responses or configuration structures).
- **Senior-Level Insight:** Snapshot tests offer a false sense of security. Prioritize explicit assertions on visible text and accessibility states to build a resilient test suite.

---

### Question 2: Testing from the User's Perspective (a11y)
- **Difficulty:** Medium
- **Answer:** 
  Querying by role and label text forces you to test the application from the user's perspective, verifying that the interface is accessible to both visual users and assistive technologies.
- **Explanation:**
  - **The User Perspective**: Users do not identify buttons by searching for CSS classes (like `.submit-btn`). Visual users look for a button containing the text "Submit." Screen reader users navigate using interactive roles (e.g. locate an element with `role="button"` named "Submit").
  - **Query Priorities**: Calling `screen.getByRole("button", { name: /submit/i })` verifies that the DOM contains a semantic button element that is accessible to screen readers.
  - If you use `container.querySelector('.submit-btn')`, the test will pass even if the element is an inaccessible `<div className="submit-btn">` that lacks tab focus and keyboard event handlers.
- **Senior-Level Insight:** Writing tests using accessibility-based queries serves as an automatic accessibility audit for your markup. If a component is hard to test using Testing Library queries, it is usually because the component's HTML markup is inaccessible to users.

---

### Question 3: Mock Leakage and False Confidence
- **Difficulty:** Senior
- **Answer:** 
  The test passes because the mock overrides the real `BillingTab` file, meaning the compiler never loads or evaluates the buggy refactored code during test execution. 
  To catch the bug, remove the mocks, mount the real components, and stub only the network requests using MSW.
- **Explanation:**
  - **The Defect**: Mocking internal components isolates the test environment to the point that it no longer reflects production behavior. The test is merely asserting that clicking a tab button swaps mock divs, which has zero relation to whether the actual tab components render and work.
  - **Redesigned Test Boundary**:
    1.  Remove `jest.mock("./BillingTab")` and let the real files load.
    2.  Register Mock Service Worker (MSW) handlers to mock the network API responses that `BillingTab` requests during mounting.
    3.  Assert user-facing results:
        ```javascript
        await userEvent.click(screen.getByRole("tab", { name: /billing/i }));
        expect(await screen.findByText("Billing History")).toBeInTheDocument();
        ```
    - Now, if the junior developer introduces a typo or breaks a mandatory prop inside `BillingTab`, the test runner will fail during the mounting step, blocking the bad code from reaching production.
- **Senior-Level Insight:** Mock at the boundaries of your system (e.g., network queries and third-party global scripts), never at component boundaries. Testing real component integrations is the only way to build high-confidence test suites.
