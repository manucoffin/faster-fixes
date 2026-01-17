# Claude Rules Index

This file indexes all available rules in the `.claude/rules/` directory to help the main agent determine when to apply specific rules.

## Rules by Category

### 00-architecture/

- **page-folder-structure.mdc**: Next.js page organization and folder structure

### 01-standards/

- **crud-naming-conventions.mdc**: CRUD function and file naming conventions

### 02-programming-languages/

- **typescript-guidelines.mdc**: TypeScript type definition and inference standards

### 03-frameworks-and-libraries/

- **react-client-components.mdc**: React client component creation and browser API usage
- **react-component-creation.mdc**: React component export and props patterns
- **tailwind-css-conventions.mdc**: TailwindCSS styling conventions and theme variables
- **tanstack-query-status-matching.mdc**: TanStack Query status handling patterns
- **zod-schema-conventions.mdc**: Zod schema naming, type extraction, and Prisma integration

### 04-tools-and-configurations/

_Empty - No rules defined yet_

### 05-workflows-and-processes/

_Empty - No rules defined yet_

### 06-templates-and-models/

_Empty - No rules defined yet_

### 07-quality-assurance/

_Empty - No rules defined yet_

### 08-domain-specific-rules/

_Empty - No rules defined yet_

### 09-other/

_Empty - No rules defined yet_

## Special Rules

- **meta-generator.mdc**: Template for creating new rules

## When to Use Each Rule

| Rule                            | Apply When                              | Key Triggers                                     |
| ------------------------------- | --------------------------------------- | ------------------------------------------------ |
| `page-folder-structure`         | Creating or organizing page directories | New pages, folder structure decisions            |
| `crud-naming-conventions`       | Creating functions, methods, or files   | get/create/update/delete operations, file naming |
| `react-client-components`       | Creating interactive React components   | 'use client', useState, browser APIs, hydration |
| `react-component-creation`      | Creating React components               | .tsx files, component functions                  |
| `tailwind-css-conventions`      | Writing TailwindCSS styles              | CSS classes, styling, theme variables           |
| `tanstack-query-status-matching`| Using TanStack Query in components      | Query status handling, client components         |
| `typescript-guidelines`         | Writing TypeScript code                 | .ts/.tsx files, type definitions, inference     |
| `zod-schema-conventions`        | Creating Zod validation schemas         | z.object, schema definitions, type validation   |
| `meta-generator`                | Creating new rules                      | Rule generation requests                         |
