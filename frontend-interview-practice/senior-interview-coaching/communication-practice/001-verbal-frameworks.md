# Coaching: Verbal Communication & Thinking Aloud in Interviews

## What the Interviewer Is Really Testing
Technical skills are only half of the senior evaluation. The other half is communication:
- **Thinking Aloud**: Can you narrate your thought process while coding or designing systems? This helps the interviewer follow your logic and offer hints if you get stuck.
- **Handling Unknowns**: How do you react when asked a question you do not know the answer to? Do you guess, freeze, or systematically deduce the answer?
- **Structured Explanations**: Do you start explaining code at the pixel level, or do you zoom out first and explain systems from top to bottom?

---

## The "Thinking Aloud" Protocol
When solving a coding or system design problem, never stay silent for more than 30 seconds. Use this narration structure:

1.  **State the Goal**: "So our goal is to build an intersection observer hook that loads more content when a spinner becomes visible. I'll start by defining the hook signature."
2.  **Highlight Potential Hazards**: "One edge case I'm concerned about here is memory leaks if the observer isn't disconnected when the component unmounts. I'll make sure to return a cleanup function inside my useEffect."
3.  **Explain Your Tradeoffs Inline**: "I could use a standard ref object here, but since the sentinel element might render dynamically after initial mount, I'll use a callback ref instead to ensure the observer binds correctly when the element appears."
4.  **Confirm Alignment**: "Does this approach make sense before I start writing the implementation?"

---

## How to Answer When You Do Not Know Something
Never guess or make up answers. Interviewers will instantly detect bluffing.
Instead, use the **Acknowledge, Deduce, & Follow-up** framework:

1.  **Acknowledge the Gap**: "I haven't had to configure custom Nginx gzip compression headers directly in my recent projects; usually our CDNs (like Cloudflare) manage compression automatically."
2.  **Deduce / Propose a Hypothesis**: "However, based on my understanding of HTTP transport, the server must negotiate gzip compression by checking the `Accept-Encoding: gzip` header on the incoming request, and respond with `Content-Type: gzip`. So in Nginx, I assume we would toggle a `gzip on` flag and specify which mime-types to compress."
3.  **Explain How You Would Investigate**: "To confirm the exact configuration syntax, I would look at the official Nginx compression module docs and test the headers locally using `curl -I`."

*   *Why this is strong*: It shows honesty, demonstrates strong foundational knowledge (deduction), and outlines a realistic engineering resolution path.

---

## Verbal Structural Template: Explaining Systems Top-Down
When asked "How does X work?", always explain **top-down** (from high-level architecture down to line-level detail):

```
Level 1: System Objective (Business value)
   │
   ▼
Level 2: Data Flow (Path from user action to server response)
   │
   ▼
Level 3: Component / Code Details (Specific hooks, state, DOM nodes)
```

*   *Avoid the Bottom-Up Trap*: Starting your explanation with "We write a useEffect hook that call fetch..." makes it hard for the interviewer to understand the overall architecture. Start with the system design first.

---

## Self-Review Checklist
- [ ] Did I narrate my thoughts continuously during coding sessions?
- [ ] Did I explicitly mention edge cases and performance impacts before writing code?
- [ ] Did I handle unknown questions by proposing logical hypotheses based on foundations?
- [ ] Did I explain technical architectures top-down rather than bottom-up?
- [ ] Did I check in with the interviewer to ensure alignment before diving into details?
