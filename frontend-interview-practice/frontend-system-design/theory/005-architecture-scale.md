# System Design: Large-Scale Architecture & Monorepos

## Problem Statement & Context
A technology corporation has 4 distinct product lines managed by separate engineering teams. Currently, teams duplicate shared UI code, dependencies are out of sync, and deploying updates requires coordinated release windows. 

You must design a frontend system architecture that scale organizationally and technically. The solution must allow teams to compile and deploy their code independently, share UI primitives with strict version controls, and keep client bundle sizes low.

---

## 1. Requirements

### Functional Requirements
- **Unified Portal**: A host container shell that loads different sub-applications dynamically based on the active path.
- **Shared UI Package**: A single shared component library consumed by all sub-applications.
- **Independent Deployments**: Deploying a change in Product A must not require rebuilds or redeployments of Products B, C, or the container shell.

### Non-Functional Requirements
- **Fast Build Times**: Implement caching strategies to ensure CI build times do not scale linearly with repository size.
- **Runtime Dependency Sharing**: Prevent client browsers from downloading duplicate copies of shared libraries (e.g. React, Lodash) when loading different sub-apps.
- **Type Safety**: Cross-application imports must remain fully typed.

---

## 2. Monorepo Architecture (Build-Time Scaling)
A Monorepo co-locates multiple applications and libraries inside a single workspace.

```
/my-monorepo
  ├── apps/
  │     ├── shell-container/   (Host application)
  │     ├── checkout-app/      (Micro-application A)
  │     └── dashboard-app/     (Micro-application B)
  ├── packages/
  │     ├── design-system/     (Shared UI components)
  │     └── utils-config/      (Shared TS/ESLint configs)
  ├── package.json
  └── turbo.json               (Turborepo build cache config)
```

### Key Tools & Optimization
*   **Workspace Managers (npm/yarn/pnpm workspaces)**: Link packages locally. Changes in `packages/design-system` are instantly reflected in `apps/checkout-app` without needing to publish to npm.
*   **Build Cache (Turborepo/Nx)**: Computes hashes of file contents. If files in `dashboard-app` haven't changed, Turborepo skips compiling it during CI runs, retrieving the build from a remote or local cache. This keeps compile times constant.

---

## 3. Micro-Frontend Architecture (Runtime Scaling)
To scale deployments independently, transition from a compile-time monorepo structure to a runtime **Micro-Frontend** architecture using **Webpack 5 Module Federation**:

```
Container Host (Shell) ── (Loads runtime bundle) ──> CDN: checkout-app/remoteEntry.js
   │
   ├── Share Runtime ──> [ React / React-DOM Shared as Singletons ]
   │
   └── Router Sync ──> Synchronizes route updates across host and sub-applications
```

### Module Federation Mechanics
Module Federation allows a JavaScript application to load code dynamically from another application compiled and hosted on a separate URL:
*   **Host (Container)**: Exposes a routing shell. It imports components from remotes dynamically using dynamic imports.
*   **Remote (Sub-app)**: Compiles its code and exposes a lightweight entry file `remoteEntry.js` containing metadata and module paths.
*   **Shared Dependencies**: Both Host and Remotes declare shared libraries in their configurations. When the host loads a remote, the browser checks if React is already loaded; if yes, it reuses the host's React instance instead of downloading a duplicate copy.

---

## 4. Webpack Module Federation Configuration
Example of remote configuration:

```javascript
// apps/checkout-app/webpack.config.js
const ModuleFederationPlugin = require("webpack/lib/container/ModuleFederationPlugin");

module.exports = {
  plugins: [
    new ModuleFederationPlugin({
      name: "checkout",
      filename: "remoteEntry.js",
      exposes: {
        "./CheckoutPage": "./src/CheckoutPage.jsx" // Expose component
      },
      shared: {
        react: { singleton: true, requiredVersion: "^18.0.0" },
        "react-dom": { singleton: true, requiredVersion: "^18.0.0" }
      }
    })
  ]
};
```

---

## 5. Architectural Tradeoffs & Senior-Level Discussion

### Tradeoff: Monolithic App vs. Monorepo vs. Micro-Frontends
*   *Monolithic Application*: Easiest to develop, simple deployments. However, it fails at scale—teams block each other on releases, and test runners slow down CI checks.
*   *Monorepo (Compile-Time)*: Unifies code and dependencies, but requires a full application build and deployment to ship updates, which limits deployment autonomy.
*   *Micro-Frontends (Runtime)*: Absolute deployment autonomy. Teams deploy sub-apps to production independently at any time. However, it introduces runtime version mismatch bugs, complicates testing, and increases initial setup complexity.

### Senior-Level Talking Points
"When scaling frontend architectures, we must distinguish between build-time coordination and runtime execution. We use a Monorepos structure (via pnpm workspaces and Turborepo) to share design tokens and configurations with type safety. If the organization scales to multiple independent teams, we introduce Micro-frontends via Module Federation. This allows teams to deploy changes independently without rebuild loops, using singleton dependency configurations to prevent duplicate library loads on the client."

---

## Micro-frontends, White-labeling, & Offline-first frontend
- **Micro-frontends**: Modular decoupling where applications load sub-packages at runtime via Webpack Module Federation or ESM import maps.
- **White-labeling**: Scaling frontend configs by extracting runtime themes into CSS custom variables loaded from tenant JSON configuration payloads.
- **Offline-first design**: Storing updates in IndexedDB queues, utilizing Service Workers, and resolving data synchronization conflict errors using CRDTs.
