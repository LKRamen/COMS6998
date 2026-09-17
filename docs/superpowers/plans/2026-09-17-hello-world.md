# Hello World Next.js App Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a minimal TypeScript Next.js App Router application whose root route displays `Hello world`.

**Architecture:** Next.js serves a single server-rendered route from `app/page.tsx`. The root layout supplies the document shell and imports a small global stylesheet. Vitest and Testing Library render the page component to verify the observable heading.

**Tech Stack:** Next.js 16.3.5, React 19.3.0, TypeScript 6.0.3, Vitest 5.0.1, React Testing Library 16.3.3.

**Spec:** `docs/superpowers/specs/2026-09-17-hello-world-design.md`

## Global Constraints

- Use TypeScript and the Next.js App Router.
- Display exactly `Hello world` in a level-one heading on `/`.
- Keep the root page server-rendered and avoid nonessential dependencies and routes.
- Run the focused test, full test suite, lint, production build, and visual browser checks before handoff.

---

### Task 1: Project setup and root-page behavior

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `next.config.ts`
- Create: `next-env.d.ts`
- Create: `vitest.config.ts`
- Create: `tests/setup.ts`
- Create: `app/page.test.tsx`
- Create: `app/page.tsx`
- Create: `app/layout.tsx`
- Create: `app/globals.css`

**Interfaces:**
- Consumes: the Next.js App Router request for `/`.
- Produces: a default-exported `Home(): JSX.Element` component whose accessible output contains one level-one heading, `Hello world`.

- [ ] **Step 1: Add package and test-runner configuration**

Create `package.json` with these scripts and dependencies:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint .",
    "test": "vitest run"
  },
  "dependencies": {
    "next": "16.3.5",
    "react": "19.3.0",
    "react-dom": "19.3.0"
  },
  "devDependencies": {
    "@testing-library/jest-dom": "7.0.1",
    "@testing-library/react": "16.3.3",
    "@types/node": "26.6.1",
    "@types/react": "19.3.0",
    "@types/react-dom": "19.3.0",
    "@vitejs/plugin-react": "6.1.1",
    "eslint": "9.39.5",
    "eslint-config-next": "16.3.5",
    "jsdom": "30.1.0",
    "typescript": "6.0.3",
    "vitest": "5.0.1"
  }
}
```

Configure Vitest for jsdom and load `@testing-library/jest-dom/vitest` from `tests/setup.ts`.

- [ ] **Step 2: Install dependencies**

Run: `npm.cmd install`

Expected: dependencies install without an npm error.

- [ ] **Step 3: Write the failing root-page test**

Create `app/page.test.tsx`:

```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Home from "./page";

describe("Home", () => {
  it("renders Hello world as the root page heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Hello world" }),
    ).toBeInTheDocument();
  });
});
```

This test catches a missing heading, a heading with an incorrect text value, or an incorrect heading level.

- [ ] **Step 4: Run the focused test to verify it fails**

Run: `npm.cmd test -- app/page.test.tsx`

Expected: FAIL because `./page` has not been created.

- [ ] **Step 5: Implement the smallest App Router page**

Create `app/page.tsx`:

```tsx
export default function Home() {
  return (
    <main>
      <h1>Hello world</h1>
    </main>
  );
}
```

Create `app/layout.tsx` to supply the required `html` and `body` elements and import `./globals.css`. Create `app/globals.css` with only a readable system font, zero body margin, and a centered page padding rule.

- [ ] **Step 6: Run the focused test and complete test suite**

Run: `npm.cmd test -- app/page.test.tsx`

Expected: PASS with one test passed.

Run: `npm.cmd test`

Expected: PASS with no failed tests.

- [ ] **Step 7: Lint and build the project**

Run: `npm.cmd run lint`

Expected: exit code 0 with no lint errors.

Run: `npm.cmd run build`

Expected: exit code 0 and a generated production build.

- [ ] **Step 8: Inspect the rendered page**

Run: `npm.cmd run dev` on a temporary local port, then use the browser to inspect `/` at desktop and narrow widths.

Expected: both views show a readable, unclipped `Hello world` heading with no blank screen or runtime error.

- [ ] **Step 9: Commit if the repository has been initialized**

Run: `git status --short`

Expected: inspect created files. If the project is a Git repository, commit the focused implementation. If it remains outside Git, leave files uncommitted and report that fact.
