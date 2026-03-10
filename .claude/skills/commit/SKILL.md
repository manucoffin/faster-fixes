---
name: commit
description: Create git commits following Commitizen conventions. Use this skill whenever the user wants to commit work, stage changes, write a commit message, or says things like "commit this", "let's commit", "commit my changes", "create a commit", or "/commit". Automatically groups unrelated changes into separate focused commits. Always prefer this skill over ad-hoc committing.
---

# Commit

Analyze the current git diff, group changes by logical concern, and create one focused commit per group.

## Context to gather first

Run these before doing anything else:

```
git status
git diff HEAD
git branch --show-current
git log --oneline -10
```

## Process

### 1. Understand the changes

Read the full diff carefully. For each changed file, ask: what is this change actually doing? Why does it exist?

### 2. Group by concern

Separate changes into groups where each group serves a single purpose:

- **Related** = same feature, same bug fix, same refactor, same chore
- **Unrelated** = different features, different bugs, different purposes

When in doubt, err toward splitting rather than lumping. A focused commit is always better than a mixed one.

### 3. For each group, commit in sequence

**a. Generate 3 candidates** using Commitizen format:

| Prefix | When to use |
|--------|-------------|
| `feat:` | New feature or capability |
| `fix:` | Bug fix |
| `refactor:` | Code change that neither fixes a bug nor adds a feature |
| `docs:` | Documentation only |
| `chore:` | Build process, tooling, dependencies |
| `style:` | Formatting, missing semicolons, etc. (no logic change) |
| `test:` | Adding or fixing tests |
| `perf:` | Performance improvement |

Use scopes when helpful: `feat(auth):`, `fix(api):`, etc.

**b. Pick the best candidate** — the one that most precisely captures the intent. Briefly note why.

**c. Stage only the files for this group:**
```
git add <file1> <file2> ...
```

**d. Commit:**
```
git commit -m "<selected message>"
```

Repeat for each remaining group.

## Constraints

- **Never** add a `Co-Authored-By: Claude` line (or any co-authorship line) to commit messages
- **Never** use `git add .` or `git add -A` when making multiple commits — always stage files selectively
- Keep messages concise: one imperative line, no period at the end
- If all changes are clearly related, a single commit is fine

## Example

Given a diff that touches:
- `src/auth/login.ts` — adds JWT validation
- `src/auth/logout.ts` — adds JWT invalidation
- `CHANGELOG.md` — updates release notes

This splits into two commits:
1. Stage `src/auth/login.ts` + `src/auth/logout.ts` → `feat(auth): add JWT validation and invalidation`
2. Stage `CHANGELOG.md` → `docs: update changelog for JWT auth`
