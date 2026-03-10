# Coding Guidelines

## General Formatting

Consistent formatting across the codebase improves readability and reduces noise in code reviews. All JavaScript and TypeScript files should use 2-space indentation. Lines should be kept to a reasonable length (120 characters maximum) to avoid horizontal scrolling. Use single quotes for strings unless the string itself contains a single quote. Always end statements with semicolons. Trailing whitespace and extra blank lines should be avoided.

## Import Organization

Imports should be grouped and ordered as follows:

1. **Node.js built-in modules** (e.g., `path`, `fs`)
2. **Third-party dependencies** (e.g., `express`, `react`)
3. **Internal modules** (relative imports within the project)

Each group should be separated by a blank line. Within each group, imports should be sorted alphabetically. Unused imports must be removed.

## Linter Usage

ESLint is the required linter for this project and must be run before committing code. All linting errors must be resolved — warnings should be treated as errors in CI. Do not use `eslint-disable` comments unless absolutely necessary, and always include a comment explaining why the rule is being disabled. The ESLint configuration is defined at the project root and should not be overridden at the file level without a strong justification.

## Naming Conventions

- **Variables and functions**: `camelCase` (e.g., `getUserById`, `taskList`)
- **React components**: `PascalCase` (e.g., `TaskCard`, `DueDatePicker`)
- **Constants**: `UPPER_SNAKE_CASE` for true constants (e.g., `MAX_RETRIES`)
- **Files**: `camelCase` for utility/helper files; `PascalCase` for React component files
- **CSS classes**: `kebab-case` (e.g., `task-card`, `due-date-label`)

Names should be descriptive and self-documenting. Avoid abbreviations unless they are universally understood (e.g., `id`, `url`).

## DRY Principle

Do not Repeat Yourself. If the same logic appears in more than one place, extract it into a shared utility function or component. Duplicated code makes maintenance harder and increases the risk of inconsistent behavior. Before writing new logic, check whether a suitable helper already exists in the codebase.

## Functions and Components

Functions should do one thing and do it well. Keep functions small and focused — if a function is growing large, consider breaking it into smaller, composable pieces. React components should follow the single-responsibility principle: each component should represent one piece of UI or encapsulate one concern. Avoid deeply nested callbacks; use `async/await` for asynchronous logic.

## Error Handling

All asynchronous operations must include proper error handling. In Express route handlers, pass errors to the `next` middleware rather than swallowing them. In React, use error boundaries for unexpected rendering errors. Never expose internal error details (e.g., stack traces) to the end user.

## Code Reviews and Quality

All code changes must go through a pull request and receive at least one approval before merging. Code should be self-explanatory; add comments only where the intent is not obvious from the code itself. Avoid commented-out code — delete it instead and rely on version control history if it is needed later.
