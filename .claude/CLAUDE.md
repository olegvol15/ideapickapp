# ideapickapp — Development Rules

## Stack
- **Next.js 16** App Router (TypeScript strict mode)
- **Tailwind CSS v4** + shadcn/ui (Radix UI primitives)
- **Zustand** (client state) + **TanStack React Query** (server state)
- **Supabase** (auth + database)
- **Zod** (schema validation + type inference)
- **pnpm** (package manager)

---

## File & Folder Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `AuthForm.tsx`, `OpportunityCard.tsx` |
| Hooks | `use-` kebab-case | `use-generations.ts` |
| Stores | kebab-case `.store.ts` | `research.store.ts` |
| Services | kebab-case `.service.ts` | `db.service.ts` |
| Types | kebab-case `.types.ts` | `idea.types.ts` |
| Utils/lib | kebab-case | `validate-input.ts`, `api-keys.ts` |
| Pages/layouts | lowercase | `page.tsx`, `layout.tsx`, `route.ts` |
| Constants | camelCase files, `UPPER_CASE` vars | `PRODUCT_TYPE_OPTIONS` |

---

## TypeScript

- Strict mode always — no `any`, no type suppression
- Define types in `types/` and re-export via `types/index.ts`
- Use `z.infer<typeof schema>` for Zod-derived types — don't duplicate
- Use `import type { ... }` for type-only imports
- Prefer `interface` for object shapes, `type` for unions/aliases

---

## Components

- **Named exports only** — no default exports for components
- Add `'use client'` only when the component uses hooks, browser APIs, or event handlers — default to Server Components
- Type props with an `interface` (e.g., `interface CardProps { ... }`)
- Use `cn()` from `@/lib/utils` for conditional Tailwind classes
- Use CVA (`class-variance-authority`) for multi-variant components
- Use `React.forwardRef` + `displayName` for UI primitives
- Colocate sub-components in the same directory with an `index.tsx` barrel

---

## Imports

- Always use the `@/` alias — never relative paths (`../`)
- Import order: external packages → `@/types` → `@/lib` → `@/components`, `@/services`, `@/stores` → type imports
- Use barrel exports where they exist (e.g., `@/types`)

---

## State Management

### Zustand stores (`stores/`)
- Name stores `use*Store` (hook convention)
- Use `persist` middleware with `partialize` to control what's persisted
- Namespace storage keys as `ideapick:<feature>` (e.g., `ideapick:research`)
- Define a separate `*PersistedState` interface for persisted fields

### React Query (`hooks/`)
- Use query key factories from `lib/api-keys.ts` — never hardcode keys
- Always scope keys by `userId` for multi-user correctness
- `staleTime: 0` — treat all queries as stale (set in root `QueryClient`)
- `mutations: { retry: false }` — never auto-retry AI/mutation calls
- Invalidate queries via `queryClient.invalidateQueries` in `onSuccess`

---

## API Routes (`app/api/`)

Every route handler must:
1. Authenticate: `requireAuth()`
2. Rate-limit: `checkRateLimit()`
3. Validate input: `validateGenerateInput()` (or equivalent Zod parse)
4. Delegate business logic to a service in `services/`

- Handler signature: `(req: NextRequest): Promise<Response>`
- Use named exports: `export async function POST(...)`
- Streaming responses use `ReadableStream` with NDJSON (one JSON object per line)
- Return errors using `AppError` factory methods (see below)

---

## Services (`services/`)

- Pure business logic + DB operations — no React, no HTTP context
- Function signature: explicitly typed params object + typed return
- DB reads: return empty array / null on error (silent fallback)
- DB writes: throw `AppError` on failure

---

## Error Handling

Use `AppError` static factories from `@/lib/errors`:

| Factory | Status |
|---------|--------|
| `AppError.validation(msg)` | 400 |
| `AppError.authRequired()` | 401 |
| `AppError.forbidden()` | 403 |
| `AppError.notFound()` | 404 |
| `AppError.rateLimit(ms)` | 429 |
| `AppError.ai(msg)` | 500 |
| `AppError.internal(msg)` | 500 |

Client-side: use Sonner toasts for 5xx/429; inline messages for 400/422; auto-redirect on 401/403.

---

## Styling

- Tailwind v4 — use CSS variables from `globals.css` (e.g., `bg-[var(--bg)]`)
- Dark/light mode via `--dark` class + CSS custom properties — never hardcode colors
- `cn()` for all conditional class merging
- Use existing custom utilities: `bg-page-grid`, `bg-surface-frosted`, `bg-dot-grid`
- Follow the text hierarchy: `--text-1` (primary) → `--text-4` (muted)
- Brand color: `--brand-color: #0077b6`

---

## AI / LLM

- Model: `gpt-4o-mini`
- Store prompt templates in `prompts/` as functions returning message arrays
- Always validate LLM JSON output with Zod; throw `AppError.invalidAiResponse()` on failure
- Temperature: 0.4 for structured/focused output, 0.7 for creative output
- Wrap all JSON parsing in try-catch

---

## Database (Supabase)

- Use SSR Supabase client in server components/middleware
- Use browser client in client components via `@/lib/supabase/client`
- Tables: `generations`, `saved_ideas`, `validations`, `roadmaps`
- Always type DB rows explicitly — no raw `any` from Supabase

---

## Auth

- `requireAuth()` in every protected API route
- `useAuth()` hook for client-side auth state
- Session management handled by middleware — don't manually manage cookies
- Middleware refreshes session on every request automatically

---

## Validation

- All external input (API routes, forms) validated with Zod schemas from `lib/schemas.ts`
- Add new schemas to `lib/schemas.ts` — don't define inline in route handlers
- Enum values validated against `constants/` collections

---

## Logging

- Use Pino logger from `@/lib/logger` — **server-side only**
- Never use `console.log` in production paths
- Logger is `server-only` — do not import in client components

---

## General

- No test framework — rely on TypeScript strict mode for correctness
- No unused variables, imports, or dead code
- Keep components, hooks, and services focused — one responsibility per file
- Don't add comments unless logic is genuinely non-obvious
