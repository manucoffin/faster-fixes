---
name: release
description: Prepare an npm release of the @fasterfixes/* packages (core, react, mcp) by writing a changeset. Use when the user asks to release, publish, bump, or version a package, or when finished work under packages/widget-core, packages/widget-react, or packages/mcp needs a changelog entry.
---

Publishing is CI's job: a changeset on `main` becomes a "Version Packages" PR, and merging that PR publishes to npm. No credentials exist on any laptop, so this skill ends at a commit.

## 1. Find what is unreleased

List the publishable changes since the last release: `git diff main...HEAD --stat -- packages/widget-core packages/widget-react packages/mcp`, plus `git status --short` for uncommitted work. Then read every `.changeset/*.md` already present. Done when each touched package is either covered by an existing changeset or on your list to write one for. When nothing is unreleased, say so and stop.

## 2. Pick the bump per package

Judge from the diff, not from commit messages:

- **patch**: fixes, internal refactors, dependency updates, docs.
- **minor**: new public API, new option, deprecation.
- **major**: removed or behaviour-changed public API. Below 1.0 a major is still a major. Confirm a major with the user before writing it.

List only packages whose own source changed. A change in core bumps react on its own through `updateInternalDependencies`.

## 3. Write the changeset

One file per concern at `.changeset/<short-kebab-summary>.md`:

```md
---
"@fasterfixes/core": patch
"@fasterfixes/react": minor
---

Add `projectId` prop to `FeedbackProvider`. `apiKey` still works and is deprecated.
```

The body is the CHANGELOG entry. Write it for the package's users, in the voice of that package's existing `CHANGELOG.md`: what changed and what to do about it, code identifiers in backticks. Done when `pnpm changeset status --verbose` exits 0 and shows the expected packages and bumps.

## 4. Verify and commit

`pnpm check:packages` green, then commit with the `commit` skill as `chore(release): add changeset for <summary>`.

## 5. Report

Give the user the next versions from `pnpm changeset status --verbose`, and the path to npm: merge `dev` into `main`, the release workflow opens the Version PR, merging that PR publishes.
