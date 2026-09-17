# Hello World Next.js App Design

## Purpose

Create a minimal, browser-runnable Next.js application that displays the exact text `Hello world` at the root route.

## Scope

- Create a TypeScript Next.js project using the App Router.
- Provide the standard `dev`, `build`, `start`, and `lint` npm scripts.
- Render a single accessible main heading at `/`.
- Include only the framework configuration and global stylesheet created for this page.

Out of scope: authentication, API routes, databases, component libraries, custom design systems, additional pages, and deployment configuration.

## Architecture

The application uses Next.js's `app/` directory. `app/layout.tsx` supplies the HTML document shell and imports the global stylesheet; `app/page.tsx` is the sole route and renders `Hello world` in an `h1` inside `main`.

No client-side state, external data, or server-side integrations are needed. The route is statically renderable.

## Files

- `package.json`: project metadata, npm scripts, and Next.js/React dependencies.
- `tsconfig.json`, `next.config.ts`, `next-env.d.ts`: TypeScript and framework configuration.
- `app/layout.tsx`: root document layout.
- `app/page.tsx`: root-route content.
- `app/globals.css`: minimal global layout and typography rules.
- `app/page.test.tsx`: behavior test asserting that the root page exposes the `Hello world` heading.

## Testing and Verification

Add a focused unit test that renders the root page and asserts it contains one level-one heading with the text `Hello world`. Run it first to confirm the expected failure before implementing the page. Then run the complete test suite, lint command, and production build.

## Constraints

- Use TypeScript.
- Use the Next.js App Router.
- Keep the page server-rendered and dependency-light.
- The displayed heading text must be exactly `Hello world`.
