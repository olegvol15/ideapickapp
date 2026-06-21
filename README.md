# IdeaPick

IdeaPick turns a founder's skills, interests, or problem statement into researched product opportunities. It combines AI generation with live market discovery, evidence-based validation, editable roadmaps, and a workspace for execution.

## What the app does

- **Brainstorm opportunities** — research the competitive landscape and generate three grounded product ideas.
- **Validate an idea** — search public discussions for real complaints, pain themes, customer language, and competitor evidence.
- **Refine and save ideas** — keep promising concepts and revisit previous brainstorms and validations.
- **Build a roadmap** — generate and expand an interactive implementation graph.
- **Execute in a workspace** — manage tasks, draft launch or validation content, and maintain the roadmap for an idea.
- **Onboard new users** — collect interests and constraints, propose ideas, and run a lightweight initial validation.

For the runtime design, data flow, API inventory, and persistence model, see [docs/architecture.md](docs/architecture.md).

## Technology

- Next.js 16 App Router, React 19, and TypeScript
- Tailwind CSS 4, Radix UI, and Framer Motion
- Zustand for client state and TanStack Query for server state
- Supabase Auth and Postgres with row-level security
- OpenAI for generation and analysis
- Tavily for web and competitor discovery
- Upstash Redis for API rate limiting
- Zod for boundary validation and Vitest for unit tests

## Local development

### Prerequisites

- Node.js 20 or newer
- [pnpm](https://pnpm.io/)
- A Supabase project
- OpenAI and Upstash credentials
- A Tavily key for web-backed competitor and evidence discovery

### 1. Install dependencies

```bash
pnpm install
```

### 2. Configure the environment

Copy the example file and replace its placeholders:

```bash
cp .env.example .env.local
```

| Variable | Required | Purpose |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Supabase project URL used by browser, server, and middleware clients. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Yes | Public Supabase key; database access is constrained by RLS. |
| `OPENAI_API_KEY` | Yes | Server-side credential for AI generation and analysis. |
| `UPSTASH_REDIS_REST_URL` | Yes | Upstash Redis endpoint used by every AI route's limiter. |
| `UPSTASH_REDIS_REST_TOKEN` | Yes | Upstash Redis REST credential. |
| `TAVILY_API_KEY` | Recommended | Enables web discovery. Some discovery paths degrade to empty evidence when omitted. |
| `NEXT_PUBLIC_API_URL` | No | API base URL. Leave empty to use the app's same-origin `/api` routes. |
| `SUPABASE_SERVICE_ROLE_KEY` | No | Reserved for the server-only admin client; current application flows do not call it. |

Never expose `OPENAI_API_KEY`, the Upstash token, or the Supabase service-role key in client code or commit them to the repository.

### 3. Apply the database migrations

The SQL migrations in `supabase/migrations/` create the application tables, indexes, and row-level security policies. Apply them in numeric order with the Supabase CLI:

```bash
pnpm exec supabase link --project-ref <project-ref>
pnpm exec supabase db push
```

Alternatively, run each migration in the Supabase SQL editor. The resulting tables are `generations`, `saved_ideas`, `roadmaps`, `validations`, and `workspaces`.

If Google sign-in is needed, enable the Google provider in Supabase Auth and add the app's `/auth/callback` URL to the allowed redirect URLs. Email/password authentication works through the same Supabase project.

### 4. Start the app

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The current middleware requires an authenticated Supabase session for application API routes, including idea generation.

## Commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the Next.js development server. |
| `pnpm build` | Create a production build. |
| `pnpm start` | Serve the production build. |
| `pnpm test` | Run the Vitest suite once. |
| `pnpm lint` | Run ESLint across the repository. |

## Repository structure

```text
app/                  Pages, layouts, middleware-facing routes, and API handlers
components/           Feature UI and shared primitives
context/              Authentication and long-running validation providers
hooks/                React Query and workflow orchestration
services/             AI workflows, browser API clients, and database access
stores/               Zustand client state
lib/                  Supabase, discovery, evidence, validation, and shared utilities
prompts/              OpenAI prompt builders
types/                Shared TypeScript contracts
supabase/migrations/  Database schema and RLS policies
```

The intended dependency direction is UI → hooks/context → services → external systems. API handlers authenticate, rate-limit, validate input, and delegate reusable work to services.

## Development notes

- AI endpoints validate both incoming requests and structured model output.
- `/api/generate` and `/api/validate` return newline-delimited JSON so the UI can show progress before the final result arrives.
- Browser database operations use the Supabase anonymous client plus the authenticated session; RLS restricts rows to their owner.
- Guest-oriented local state exists in parts of the UI, but middleware currently blocks unauthenticated API calls. Treat authenticated use as the supported development path.
- Do not commit generated credentials or `.env.local`.
