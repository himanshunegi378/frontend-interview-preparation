# Coaching: Senior Behavioral Interview Guide (STAR Format)

## What the Interviewer Is Really Testing
At the senior (L6/L7) level, behavioral interviews are not just about checking if you are easy to work with. The interviewer is assessing:
- **Scope & Leadership**: Do you lead projects, coordinate multiple teams, and set technical directions?
- **Conflict Resolution**: How do you handle disagreements with engineering or product partners? Do you look for consensus based on metrics and tradeoffs, or do you become combative?
- **Mentorship & Sponsorship**: Do you actively grow the engineers around you, delegate tasks to help them grow, and sponsor their promotions?
- **Ownership & Failure**: When a production bug occurs, do you take responsibility, lead the post-mortem, and establish systems to prevent it, or do you blame others?

---

## The Senior STAR Answer Framework
When structuring your behavioral stories, follow the **STAR** method, but skew the weight toward the **Result** and **Learnings**:

1.  **Situation (~15% of time)**: Briefly describe the context, scale of the project, and the business impact. Keep it under 1 minute.
2.  **Task (~15% of time)**: Define the specific challenge or conflict. What was the risk to the business or timeline?
3.  **Action (~50% of time)**: Detail *your* specific actions. Focus on leadership: how you analyzed options, influenced stakeholders, mentored others, and coordinated delivery. Use "I", not "we."
4.  **Result (~20% of time)**: Output quantitative metrics (e.g. "reduced TBT by 40%", "shipped 3 weeks ahead of schedule") and qualitative outcomes (team morale, alignment).
5.  **Senior Learning (Bonus)**: Reflect on what you would do differently, proving you have growth-mindset and self-awareness.

---

## Example Scenario: Resolving Conflict with Product Management

### Question
> "Tell me about a time you disagreed with a Product Manager regarding a technical decision."

### Weak Answer (Junior/Mid-level)
> "The PM wanted us to ship a feature by Friday, but I told them it was impossible because the code was messy and we needed to refactor it first. They insisted, so we had an argument. Eventually, I stayed up late and did the refactor anyway, and we shipped it on Monday. The code was cleaner, and the PM was happy."
*   *Why it's weak*: Focuses on individual effort, lacks metrics, sounds combative, and bypasses organizational alignment.

### Strong Answer (Senior/L6+)
*   **Situation**: "During my time at Company X, we were launching a new checkout experience. The Product Manager wanted to add a dynamic analytics tracker to capture user interactions in the checkout path. 
*   **Task**: I reviewed the analytics script and noticed it injected heavy third-party tracking loops synchronously, which would increase TBT by 200ms and degrade our INP scores. I knew this would cause checkout stutters on low-end devices, directly hurting conversion rates.
*   **Action**: Instead of simply saying 'no', I gathered metrics. I recorded a local performance trace showing the thread block, and estimated the conversion rate drop using our analytics telemetry database. I presented this to the PM, not as a technical complaint, but as a business risk (estimating a potential 1% drop in checkout conversions). 
    I proposed a compromise: we would write a deferred wrapper that loaded the tracker inside the browser's idle periods (`requestIdleCallback`) and batched exfiltrations. I mentored a junior developer on the team to implement this custom beacon wrapper.
*   **Result**: We shipped the tracking feature on schedule. The analytics data gathered was 100% accurate, but our TBT metrics remained unchanged, preserving our checkout INP under the 100ms threshold.
*   **Learning**: This taught me that technical arguments must always be translated into business metrics (like conversion or latency budgets) to align product and engineering priorities."

---

## Self-Review Checklist
- [ ] Did I use "I" instead of "we" to detail my specific contributions?
- [ ] Did I include concrete metrics in the Result section?
- [ ] Did I align technical decisions with business impact?
- [ ] Did I demonstrate empathy and collaboration during conflict stories?
- [ ] Did I include a reflective "Senior Learning" step at the end?
