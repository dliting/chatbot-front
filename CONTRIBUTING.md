# Contributing to AI Chatbot Frontend

## Setup

```bash
npm install
```

## Development

```bash
npm run dev              # Start dev server (floating mode)
npm run dev:iframe       # Start dev server (iframe mode)
```

## Testing

### Unit Tests

```bash
npm run test:run         # Run all unit tests
npm run test             # Run tests in watch mode
npm run test:coverage    # Run with coverage report
```

**Coverage target**: >90% lines, functions, branches, statements.

Tests use **Vitest** with `happy-dom` environment. Test files go in `tests/` with `.spec.ts` suffix.

The root test suite covers the component library only. The `examples/chatapp` sub-projects (frontend, backend-mock, backend-real) have their own dependencies and tests — install and run them inside each sub-project directory.

### E2E Tests

```bash
npm run test:e2e         # Run all Playwright E2E tests
npm run test:e2e:lib     # Run library E2E tests
npm run test:e2e:chatapp # Run chatapp integration tests
```

### Integration Testing with Backend

Test with both backend modes:

```bash
start-chatapp.bat mock   # Mock backend (port 3001, no LLM needed)
start-chatapp.bat real   # Real backend (port 3000, needs Ollama)
stop-chatapp.bat         # Stop all services
```

Both modes must pass. If Ollama times out, the test fails.

## Code Quality

### Linting & Formatting

```bash
npm run lint             # ESLint with auto-fix
npm run lint:check       # ESLint check only
npm run format           # Prettier format src/
npm run format:check     # Prettier check
npm run type-check       # TypeScript type checking
```

### Style Conventions

- **Prettier**: no semicolons, single quotes, 100 char print width, 2-space indent, trailing commas (es5)
- **Vue**: Vue 3 Composition API with `<script setup lang="ts">`
- **Naming**: PascalCase components, camelCase composables/functions, UPPER_SNAKE constants
- **No `any`**: Use `@typescript-eslint/no-explicit-any: warn` — prefer proper types
- **Unused vars**: Prefix with `_` to suppress lint errors for intentionally unused parameters

## Architecture

### Inject-Primary Pattern

Internal component communication uses `provide`/`inject` via Symbol keys. Component `emit` events are reserved only for external-facing UI notifications.

- **Internal actions** (data operations) → inject via `chatStateKey`, `chatActionsKey`, `topicActionsKey`, `uiActionsKey`
- **External events** (UI notifications) → component `emit`

Do NOT add emit for operations that are already handled via inject. See `docs/design/component-communication-architecture.md`.

### State Management

- `useChatbotState` — Factory that creates sub-composables + coordinator
- `useChatbotCoordinator` — Watch-based sync between `useTopicsState` and `useMessagesState`
- Sub-composables: `useUIState`, `useMessagesState`, `useTopicsState`, `useInteractionState`

### Component Hierarchy

```
AIChatbot (root — provides state + actions)
├── FloatingChatPanel     (floating mode)
├── EmbeddedChatPanel     (extended/sidebar mode)
└── ChatPanel             (window management wrapper)
    └── EmbeddedChatPanel
```

## Making Changes

### Before You Start

1. Check existing code for similar patterns before introducing new ones
2. Consider if the change affects other components or state flows
3. Think about the root cause, not just the symptom

### During Development

1. **Write tests first** — unit tests for logic, component tests for Vue components
2. **Follow existing patterns** — naming, file structure, communication patterns
3. **Keep it simple** — no over-engineering, no premature abstractions
4. **No hardcoded config** — use constants or config files, not magic values
5. **Offline-compatible** — no CDN dependencies, download assets locally

### Component Testing with Inject

Components that use `inject` must have their injection keys provided in tests:

```typescript
import { chatActionsKey, topicActionsKey, uiActionsKey } from '@/symbols'

const wrapper = mount(MyComponent, {
  global: {
    provide: {
      [chatActionsKey]: mockChatActions,
      [topicActionsKey]: mockTopicActions,
      [uiActionsKey]: mockUIActions,
    },
  },
})
```

### After Changes

1. Run `npm run test:run` — all unit tests must pass
2. Run `npm run lint:check` — no lint errors
3. Run `npm run type-check` — no TypeScript errors
4. Test UI changes in browser via dev server
5. Update `docs/` if the change affects API, architecture, or behavior
6. Update `tests/UI_TEST_GUIDE.md` if the change affects UI interaction

## Commit Guidelines

- ESLint must pass before committing
- All tests must pass before committing
- UI changes must be verified in Playwright browser
- Follow the project's "循环完善" process: verify → review → refine → repeat until clean review

## Project Structure

```
src/
├── components/     # Vue components
├── composables/    # Composition API hooks
├── utils/          # Utility modules
├── types/          # TypeScript type definitions
├── styles/         # SCSS + CSS
├── constants/      # Centralized config constants
├── symbols.ts      # Injection key definitions
└── index.ts        # Library entry point

tests/
├── components/     # Component tests
├── composables/    # Composable tests
├── utils/          # Utility tests
├── types/          # Type tests
├── e2e/            # Playwright E2E tests
└── setup.ts        # Test setup

docs/
├── API.md          # API documentation
├── design/         # Design documents
└── plans/          # Implementation plans
```
