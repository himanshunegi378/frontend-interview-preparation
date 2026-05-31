# Coaching: Senior Architecture & System Migrations

## What the Interviewer Is Really Testing
When discussing frontend architecture, the interviewer evaluates:
- **Pragmatism & Cost Management**: Do you suggest rewriting everything from scratch when the code gets messy, or do you design gradual migration strategies that minimize business disruption?
- **Risk Mitigation**: How do you test and roll out large migrations safely without introducing major bugs into production?
- **System Standardization**: Can you design systems that enforce architectural boundaries, keeping codebases clean as development teams scale?

---

## Technical Migration Framework (The Strangler Fig Pattern)
Never suggest a complete "big bang" rewrite of a large application. A rewrite stops feature delivery for months, introduces new bugs, and often fails.
Instead, advocate for the **Strangler Fig Pattern** (incremental migration):

```
Step 1: Container Integration       Step 2: Incremental Replacement    Step 3: Complete Stranglement
┌───────────────────────────────┐   ┌───────────────────────────────┐   ┌───────────────────────────────┐
│ Host Shell (New Router)       │   │ Host Shell                    │   │ Host Shell                    │
│ ├── Legacy App (Iframe/Sub)   │   │ ├── Legacy (Restricted)       │   │ ├── [ Retired ]               │
│ └── [ New Home Page ]         │   │ └── [ New Home, New Billing ] │   │ └── [ All Migrated ESM ]      │
└───────────────────────────────┘   └───────────────────────────────┘   └───────────────────────────────┘
```

1.  **Introduce a Host Shell**: Wrap the legacy application in a routing container.
2.  **Incremental Replacement**: Rebuild and deploy specific sub-routes (such as the billing page) inside the new architecture. Route traffic to the new components using feature flags or reverse proxy rewrites, while leaving the rest of the application running in the legacy framework.
3.  **Deprecation**: As more sub-routes are migrated, the legacy codebase shrinks. Once all pages are migrated, retired files are safely deleted, and the old server routes are shut down.

---

## Monorepo vs. Polyrepo Architectural Evaluation
When asked how to organize multiple frontend projects, structure the tradeoffs objectively:

### Monorepo (Turborepo, pnpm workspaces)
*   *DX Benefits*: Unified dependency versions, easy refactoring across libraries, shared UI primitives, and type safety.
*   *Tooling Overhead*: Requires build caching to prevent long CI checks, and requires strict ownership rules (CODEOWNERS) to prevent developers from modifying other teams' codes arbitrarily.

### Polyrepo (Independent Git Repositories)
*   *DX Benefits*: Absolute team boundaries. Teams control their own git flows, release lifecycles, and configurations.
*   *Integration Pain*: Code duplication, version drift (Product A runs Design System v1, Product B runs v3), and complex multi-repo update cycles.

---

## Senior Architectural Talking Points
"When migrating legacy codebases, our primary concern is maintaining business continuity. We use the Strangler Pattern to replace pages incrementally. We host the legacy app inside a shell, migrate routes one-by-one, and use feature flags (like launchdarkly) or proxy redirects to route traffic. Additionally, we enforce design boundaries inside monorepos by using package-boundary linters (like dependency cruisers) to prevent illegal circular imports between workspaces."
---

## Self-Review Checklist
- [ ] Did I oppose "big bang" rewrites in favor of incremental migrations?
- [ ] Did I outline concrete rollout risks (CORS, cookies, state syncing)?
- [ ] Did I evaluate monorepos based on build speeds and team organization?
- [ ] Did I mention strict boundaries tools (eslint, dep-cruiser) to protect code?
- [ ] Did I translate architectural benefits into business outcomes (maintenance cost, release speed)?
