# Testing Guidelines

## Unit Tests

- Use Jest to test individual functions and React components in isolation.
- Unit tests should use the naming convention `*.test.js` or `*.test.ts`.
- Backend unit tests should be placed in `packages/backend/__tests__/` directory.
- Frontend unit tests should be placed in `packages/frontend/src/__tests__/` directory.
- Name unit test files to match what they're testing (e.g., `app.test.js` for testing `app.js`).

## Integration Tests

- Use Jest + Supertest to test backend API endpoints with real HTTP requests.
- Integration tests should be placed in `packages/backend/__tests__/integration/` directory.
- Integration tests should also use the naming convention `*.test.js` or `*.test.ts`.
- Name integration test files intelligently based on what they test (e.g., `todos-api.test.js` for TODO API endpoints).

## End-to-End (E2E) Tests

- Use Playwright (the required framework) to test complete UI workflows through browser automation.
- E2E tests should be placed in `tests/e2e/` directory.
- E2E tests should use the naming convention `*.spec.js` or `*.spec.ts`.
- Name E2E test files based on the user journey they test (e.g., `todo-workflow.spec.js`).
- Playwright tests must use one browser only.
- Playwright tests must use the Page Object Model (POM) pattern for maintainability.
- Limit E2E tests to 5–8 critical user journeys — focus on happy paths and key edge cases, not exhaustive coverage.

## Port Configuration

Always use environment variables with sensible defaults for port configuration:

- **Backend**: `const PORT = process.env.PORT || 3030;`
- **Frontend**: React's default port is 3000, but can be overridden with the `PORT` environment variable.

This allows CI/CD workflows to dynamically detect ports.

## General Principles

- All tests must be isolated and independent — each test should set up its own data and not rely on other tests.
- Setup and teardown hooks are required — tests must succeed on multiple runs.
- All new features should include appropriate tests.
- Tests should be maintainable and follow best practices.
