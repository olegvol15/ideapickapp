---
name: project-patterns
description: Recurring patterns, conventions, and known anti-patterns observed in the ideapickapp codebase across reviews
metadata:
  type: project
---

## Validated Patterns

- `validateValidateInput()` in `lib/validate-input.ts` is the canonical input validation function for the validate API route — not Zod directly in the route. This is an intentional split: Zod lives in `lib/schemas.ts` for AI output parsing, manual checks for HTTP input.
- `normName()` helper (lowercase, strip non-alphanumeric) appears as an inline closure inside `services/validate-mobile.service.ts` and is used in two separate scopes within the same file. It's a module-level candidate for extraction.
- `useValidateWorkflow` hook calls `useMutation` correctly; side effects (save, update, scroll, toast) are all inside `onSuccess`/`onError` — architecture is clean.
- Pages in `app/` use `export default` — this is required by Next.js App Router and is intentional, not an architecture violation.
- Hardcoded Tailwind semantic colors (`text-emerald-*`, `text-amber-*`, `text-rose-*`) appear widely in the validate feature area. This is a recurring pattern across many validate components and appears to be an accepted deviation from the CSS variable rule for signal colors.

## Recurring Issues to Watch

- `differentiation` field was added to Mobile validation but NOT to the SaaS validation path (`runSaasValidation` in `app/api/validate/route.ts`). Feature parity gap introduced during incremental rollout — watch future SaaS-path changes.
- `previousResult` prop exists on `ValidationReport` interface but is accepted and ignored (destructured away in the change). Dead prop that should be removed.
- `version` and `prevResult` from `useValidateStore()` are destructured in `ValidateForm` but `version` is never read after the RefinePanel was removed. Dead destructuring.
- Inline `normName` closure defined at line 101 and re-used at line 281 in the same file — should be hoisted to module scope.
- `useSearchParams()` used in `ValidateForm` without `<Suspense>` boundary in the parent page (`app/validate/page.tsx`). This can cause hydration issues or incomplete static rendering in Next.js App Router.
- NicheBlock defines its own local `NicheBlockProps` inline rather than using `z.infer<>` from the schema. Duplicate type contract risk.

**Why:** These notes support consistent review across the validate feature area.
**How to apply:** Flag these patterns if they recur in future validate-area changes.
