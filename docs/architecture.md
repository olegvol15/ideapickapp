# IdeaPick Architecture

This document describes the current implementation. It is intended to help contributors locate responsibilities, follow data through the system, and understand the boundaries enforced at runtime.

## System overview

IdeaPick is a single Next.js application. React pages and route handlers are deployed together; Supabase provides authentication and persistent user data, OpenAI performs structured generation, Tavily supplies web discovery, and Upstash Redis enforces rate limits.

```text
Browser
  ├─ Next.js pages and components
  ├─ Zustand stores (workflow and local state)
  ├─ TanStack Query (remote state and mutations)
  └─ Supabase browser client ───────────────┐
                                            │
Next.js middleware                          │
  ├─ refreshes the Supabase session         │
  ├─ protects application API routes        │
  ├─ caps API request bodies at 100 KiB     │
  └─ attaches a per-request CSP nonce       │
                                            │
Next.js route handlers                      │
  ├─ authenticate and rate-limit            │
  ├─ validate input                         │
  └─ call services                          │
       ├─ OpenAI                            │
       └─ Tavily                            │
                                            │
Supabase Auth + Postgres <──────────────────┘
  └─ row-level security scopes data by user
```

## Application layers

| Layer | Responsibility |
| --- | --- |
| `app/` | Route composition, layouts, page entry points, and HTTP handlers. |
| `components/` | UI rendering and user interaction. Feature components are grouped by domain. |
| `hooks/` and `context/` | Workflow orchestration, React Query operations, and long-running process state. |
| `services/` | AI workflows, API clients, persistence adapters, and database access. |
| `stores/` | Zustand state for brainstorm, validation, onboarding, roadmap, and workspace experiences. |
| `lib/` | Shared infrastructure: Supabase clients, schemas, discovery, evidence processing, errors, logging, and rate limiting. |
| `prompts/` | OpenAI message construction, kept separate from transport and UI code. |
| `types/` | Shared application and wire-level TypeScript contracts. |

The root provider tree supplies TanStack Query, Supabase authentication, theme state, the background validation runner, error handling, and toasts. `AppShell` adds the main navigation around product pages.

## Core workflows

### Opportunity generation

1. The home form collects a prompt, optional product type, and difficulty.
2. `useResearch` starts a TanStack Query mutation through `generate.service.ts`.
3. `POST /api/generate` checks the session and rate limits, then validates the request.
4. OpenAI creates focused search queries.
5. The product-type discovery router searches for competitors through Tavily-backed strategies.
6. The route emits a `competitors` NDJSON event immediately.
7. OpenAI analyzes the landscape and produces market context, gaps, and three ideas. Zod validates the structured output.
8. The route emits `done` or `error`; the client updates Zustand and saves successful signed-in generations to Supabase.

Although the route contains an IP-based guest limiter, middleware currently rejects all unauthenticated application API requests before the handler runs. Authenticated generation is therefore the effective runtime behavior.

### Evidence validation

1. The validation form collects an idea description, product type, and optional audience and problem statement.
2. `ValidationRunnerProvider` owns the request so navigation within the app does not discard an active run.
3. `POST /api/validate` authenticates, rate-limits, and validates the request.
4. The evidence service searches public sources, builds a quote pool, scores evidence, and asks OpenAI to produce the validated report shape.
5. The route streams `sources` followed by `done` or `error` NDJSON events.
6. The client stores the active report in Zustand and persists validation history to Supabase for signed-in users.

### Roadmaps and workspaces

- `POST /api/roadmap` creates a structured graph for an idea; `POST /api/roadmap/expand` generates children for a selected node.
- Roadmap graph edits are cached in `sessionStorage` and synchronized to the `roadmaps` table for signed-in users.
- Moving an idea into a workspace creates a task board, generated content collection, and embedded roadmap.
- Workspace state is persisted locally by Zustand and synchronized to the `workspaces` table.
- `POST /api/content` creates tweet or Reddit drafts using the idea and optional roadmap-step context.

### Onboarding

Onboarding is an authenticated multi-phase flow. It gathers intent, interests, and constraints; calls `explore-ideas` for candidates; optionally calls `quick-validate`; and stores completion in Supabase user metadata. Middleware redirects completed users away from `/onboarding`.

## API routes

All application API routes accept `POST` requests. Middleware currently requires a valid Supabase session for every route under `/api/` except paths under `/api/auth/`. Individual handlers generally repeat authentication so their authorization boundary remains explicit.

| Route | Response | Purpose |
| --- | --- | --- |
| `/api/generate` | NDJSON stream | Discover competitors and generate grounded opportunities. |
| `/api/validate` | NDJSON stream | Gather pain evidence and produce a validation report. |
| `/api/refine` | JSON | Rewrite an existing idea from a user instruction. |
| `/api/roadmap` | JSON | Generate an initial roadmap graph. |
| `/api/roadmap/expand` | JSON | Expand one roadmap node. |
| `/api/content` | JSON | Generate a tweet or Reddit draft for a workspace. |
| `/api/explore-ideas` | JSON | Produce onboarding ideas from interests and constraints. |
| `/api/quick-validate` | JSON | Produce a lightweight onboarding validation. |

Request validation uses Zod schemas or the bounded validators in `lib/validate-input.ts`. Structured OpenAI responses are parsed as JSON and validated before being returned. Expected failures use the `AppError` model; streamed endpoints serialize failures as terminal `error` events because HTTP headers have already been sent.

Upstash sliding-window limits are scoped by user ID. Generation and full validation have both hourly and daily limits; other operations have per-hour limits.

## State and persistence

IdeaPick uses different stores for different lifetimes:

| State | Storage | Notes |
| --- | --- | --- |
| Active UI and workflow state | Zustand memory | Includes active brainstorm and transient progress phases. |
| Guest validation history | Zustand persist / `localStorage` | Stored under `ideapick:validations`. |
| Workspace tasks, content, titles, and ideas | Zustand persist / `localStorage` | Provides immediate local hydration and guest workspace state. |
| Selected plan and roadmap graph cache | `sessionStorage` | Keyed by an idea-title slug and cleared with the browser session. |
| Signed-in histories and workspaces | Supabase Postgres | Loaded and mutated through TanStack Query hooks and DB services. |

TanStack Query owns asynchronous server state. Queries are keyed by both resource and user ID; mutations do not automatically retry expensive AI operations.

## Database model

The migrations in `supabase/migrations/` define five user-owned tables:

| Table | Contents | Important relationship |
| --- | --- | --- |
| `generations` | Prompt, filters, and complete generated result. | Owned by `auth.users`; may be referenced by saved ideas. |
| `saved_ideas` | A saved idea JSON document. | Optional `generation_id` uses `ON DELETE SET NULL`. |
| `validations` | Input description, result, and evidence-source JSON. | Owned by `auth.users`. |
| `roadmaps` | Idea JSON and editable graph JSON keyed by slug. | Unique per `(user_id, slug)`. |
| `workspaces` | Idea, title, tasks, and content JSON keyed by idea slug. | Unique per `(user_id, idea_slug)`. |

Every table enables row-level security. Policies compare `auth.uid()` with `user_id`, and the workspace policy explicitly applies the same condition to inserted and updated rows. Browser-side data access therefore uses the public anonymous key without granting cross-user access.

## Authentication and security

- Supabase SSR clients share auth cookies between middleware, Server Components, route handlers, and the browser.
- Middleware refreshes the authenticated user on each matched request.
- `/ideas` and `/onboarding` have page-level redirects; API authentication is broader and applies to all application API routes.
- API requests declaring a body larger than 100 KiB receive `413` before reaching a handler.
- Each response receives a Content Security Policy with a fresh nonce. The policy restricts scripts, frames, objects, connections, and form submissions.
- The OpenAI key, Upstash token, Tavily key, and optional Supabase service-role key are server-side credentials. Only variables prefixed with `NEXT_PUBLIC_` may be included in the browser bundle.
- Database authorization is enforced by Supabase RLS in addition to client-side user scoping.

## Adding or changing a feature

Keep transport, orchestration, and rendering separate:

1. Define or update shared types and Zod boundary schemas.
2. Put reusable external calls and business logic in `services/` or the appropriate `lib/` domain.
3. Keep route handlers focused on authentication, rate limiting, validation, and response formatting.
4. Use hooks or context to coordinate the service with TanStack Query and Zustand.
5. Render the resulting state in feature components.
6. Add unit coverage for deterministic prompt formatters, evidence processing, schemas, stores, and other pure logic.

Run `pnpm test`, `pnpm lint`, and `pnpm build` before merging. At the time of this documentation update, the test suite passes, while the repository has pre-existing ESLint findings that should be resolved separately.
