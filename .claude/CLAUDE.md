Here is the same version, cleaned up and without any emojis or decorative elements:

---

# ideapickapp — Development Rules

> Competitor report research (local, gitignored): `.claude/competitor-research.md` — reference when discussing validation-report features.
> Report roadmap (local, gitignored): `.claude/report-roadmap.md` — our prioritized plan to beat competitors on evidence depth.

## Core Principle

> If a file becomes hard to read — it’s already wrong.

- One file = one responsibility
- Readability over cleverness
- If logic is hard to follow, refactor immediately
- Avoid “temporary” solutions — they become permanent

---

## Stack

- Next.js 16 (App Router, server-first)
- TypeScript (strict mode)
- Tailwind CSS v4 + shadcn/ui (Radix primitives)
- Zustand (client state)
- TanStack React Query (server state)
- Supabase (auth + database)
- Zod (validation + type inference)
- pnpm

---

## Architecture

Strict separation of concerns:

| Layer      | Responsibility                     |
| ---------- | ---------------------------------- |
| Components | UI only                            |
| Hooks      | orchestration and data preparation |
| Services   | business logic and data access     |
| Utils      | pure helper functions              |

### Forbidden

- Business logic inside components
- API or database calls inside components
- Complex logic inside JSX
- Mixing multiple responsibilities in one file

---

## File & Folder Conventions

| Type          | Convention                      | Example              |
| ------------- | ------------------------------- | -------------------- |
| Components    | PascalCase                      | AuthForm.tsx         |
| Hooks         | use- kebab-case                 | use-generations.ts   |
| Stores        | kebab-case .store.ts            | research.store.ts    |
| Services      | kebab-case .service.ts          | score.service.ts     |
| Types         | kebab-case .types.ts            | idea.types.ts        |
| Utils/lib     | kebab-case                      | validate-input.ts    |
| Pages/layouts | lowercase                       | page.tsx             |
| Constants     | camelCase file, UPPER_CASE vars | PRODUCT_TYPE_OPTIONS |

---

## TypeScript

- Strict mode always — no `any`, no suppression
- Define types in `types/` and re-export via `types/index.ts`
- Use `z.infer<typeof schema>` — do not duplicate types
- Use `import type` for type-only imports
- Prefer:
  - interface for object shapes
  - type for unions and transformations

---

## Components

### Rules

- Named exports only — no default exports
- Add 'use client' only when required
- Props typed with interface
- No business logic inside components
- No nested components inside the same file
- Avoid deeply nested JSX — extract subcomponents

### Structure

- components/ui/ → primitives (Button, Card)
- features/.../components/ → feature-specific UI

### Styling

- Use cn() for class merging
- Use CVA for variants
- Never hardcode colors — use CSS variables

---

## Hooks (STRICT CONTRACT)

Hooks are orchestration layers, NOT state managers.

### Allowed

- useQuery / useMutation
- Composing other hooks
- Pure data transformation

### Forbidden

- useState (for server data)
- useEffect (for fetching or syncing)
- Direct API or database calls
- Side effects

### Side effects rule

Side effects are ONLY allowed inside:

- useMutation (onSuccess, onError)

### Pattern (MANDATORY)

1. Call useQuery / useMutation
2. Return query object
3. Apply only pure transformations

### Example (VALID)

```ts
export const useIdeas = () => {
  const query = useQuery({
    queryKey: apiKeys.ideas.list(),
    queryFn: getIdeas,
  })

  return {
    ...query,
    ideas: query.data ?? [],
  }
}
Example (INVALID)
const [ideas, setIdeas] = useState([])

useEffect(() => {
  fetchIdeas().then(setIdeas)
}, [])

### Rules

- No UI inside hooks
- No direct database access inside hooks
- Keep hooks focused and composable

---

## Services

- Pure business logic and data access
- No React, no UI, no HTTP layer

### Rules

- Explicit input/output types
- One responsibility per service
- No uncontrolled side effects

### Database behavior

- Reads return null or empty array on failure
- Writes throw AppError

---

## State Management

### Zustand

- Store names follow use\*Store convention
- Use persist with partialize
- Storage keys: ideapick:<feature>
- Define explicit persisted state types

---

### React Query

- Use query key factories from lib/api-keys.ts
- Always scope queries by userId
- staleTime: 0
- No automatic retries for mutations
- Invalidate queries on success

---

## API Routes (app/api/)

Each route must:

1. Authenticate using requireAuth()
2. Apply rate limiting using checkRateLimit()
3. Validate input using Zod
4. Delegate logic to a service

### Rules

- No business logic in route handlers
- Signature: (req: NextRequest) => Promise<Response>
- Named exports only
- Use streaming (NDJSON) where needed
- Return errors using AppError

---

## Error Handling

Use AppError factory methods:

| Method       | Status |
| ------------ | ------ |
| validation   | 400    |
| authRequired | 401    |
| forbidden    | 403    |
| notFound     | 404    |
| rateLimit    | 429    |
| ai           | 500    |
| internal     | 500    |

### Client behavior

- 5xx and 429 → toast
- 4xx → inline errors
- 401 and 403 → redirect

---

## Styling

- Tailwind v4 with CSS variables
- Dark/light mode via --dark class
- Never hardcode colors

### Text hierarchy

- --text-1 → primary
- --text-4 → muted

### Brand

- --brand-color: #0077b6

---

## AI / LLM

- Model: gpt-4o-mini
- Prompts stored in prompts/ as functions
- Always validate output with Zod
- Throw AppError.invalidAiResponse() on invalid output

### Rules

- Temperature:
  - 0.4 for structured output
  - 0.7 for creative output

- Wrap parsing in try/catch

---

## Database (Supabase)

- Use SSR client for server
- Use browser client for client
- Always type database responses
- No raw any

Tables:

- generations
- saved_ideas
- validations
- roadmaps

---

## Auth

- requireAuth() in protected routes
- useAuth() for client state
- Middleware handles session refresh
- Do not manually manage cookies

---

## Validation

- All input validated with Zod (lib/schemas.ts)
- No inline schemas in route handlers
- Enums validated against constants

---

## Logging

- Use Pino (server only)
- No console.log in production
- Do not import logger in client code

---

## Code Quality

- No unused code
- No duplicate logic
- No dead components
- Delete anything not used
- Refactor when complexity increases

---

## Anti-Patterns

- Large multi-purpose files
- Business logic in components
- Nested components
- Duplicated logic
- Temporary hacks
- Unused UI components

---

## Final Rule

> Clean code is not written once — it is continuously refined.
