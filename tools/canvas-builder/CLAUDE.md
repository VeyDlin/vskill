# Project Instructions — CLAUDE.md

This file is the **behavioural contract** for AI assistants working in this project. Read it at the start of every session.

The technical stack and architecture are not stored in this project — they live in the `stack-reference` skill of the `vskill` Claude Code plugin. Consult that skill whenever you need to know what to build with (packages, folder layout, API client shape, Pinia vs vue-query, scoped SCSS + Nuxt UI tokens, naming, lint/prettier/husky baseline, shared VS Code workspace). The skill is the default — this project's rules below override it where they disagree.

---

## User Mode

```
User: VIBE-CODER
```

Change to `DEVELOPER` if the user is a professional software developer. **Default is `VIBE-CODER`** — safer default due to asymmetric risk: a vibe-coder treated as a developer leads to silent architectural damage; a developer treated as a vibe-coder only wastes a bit of time.

### DEVELOPER mode

- Terse. One-sentence rationale for non-trivial choices only.
- Propose a concrete implementation, not A/B options.
- Skip beginner framing. Assume Vue 3 / TS strict / Pinia / vue-query / Vite / Nuxt UI knowledge.
- Trust the user to read a diff.

### VIBE-CODER mode

- **Explain before code.** For any non-trivial change (new component, new store, refactor, new dependency), describe the approach in 2–3 plain sentences and wait for confirmation.
- **Translate jargon on first use.** Example: "A Pinia store is a shared place where data lives across pages."
- **Offer A / B options** for architectural decisions. Never silently decide file layout, data shape, or approach.
- **Never write 200 lines on a vague request.** Ask what changed, what was expected, what the failing case looks like.
- **After every task, summarise in 3–5 plain bullets** and add one line on how to verify in the browser.

---

## Safety Floor — ALWAYS, regardless of mode

These rules never bend.

### Pre-code Protocol

Before writing any code, announce:

```
Reusing:             [Nuxt UI component / existing composable / nothing]
Writing new because: [one-sentence reason]
Approach:            [one-sentence summary]
Files to touch:      [list]
```

Search order before writing new code:

1. **Nuxt UI MCP** (`mcp__nuxt-ui-remote__*`) — component, composable, theme token
2. `/composables/` in this project
3. **VueUse**
4. **TanStack** (vue-query, vue-table, vue-virtual)
5. Only then — custom code, with a one-sentence justification for why nothing above fits

In VIBE-CODER mode, wait for the user to confirm before proceeding.

### Never

- `any`, `as any`, `as unknown as X`, `@ts-ignore`, `@ts-expect-error` without a tracked issue link
- `console.log`, `debugger`, or untracked `TODO` in a commit
- Install a new npm package without explicit user approval
- Add features, abstractions, or "just in case" error handlers beyond what was asked
- Leave dead code, commented-out blocks, or unused exports "for later" — delete them
- Write `fetch` calls directly in components or stores — always go through `api/` classes
- Store server state in Pinia — that's vue-query's job (Pinia holds client-only state)
- Hardcoded colours (`#fff`, `rgb(...)`) — use Nuxt UI design tokens (`var(--ui-text-muted)`, etc.)
- Global styles outside `assets/scss/main.scss`
- BEM notation — no `__`, no `--` in class names. Write plain `.header`, `.body`, `.title`; Vue's scoped styles already isolate. Nest SCSS to mirror the template; state via chained selectors (`&.collapsed`, `&.is-active`), not modifier suffixes.
- `_` prefix on any identifier

### Always

- Strict typing. For unknown shapes, use `unknown` + a type guard or a Zod schema.
- K&R braces, 4-space indent, semicolons, double quotes — matches Prettier + `@antfu/eslint-config` stylistic overrides.
- Kebab-case directories, PascalCase components, `useXxx.ts` composables, `xxx.store.ts`, `xxx.api.ts`, `xxx.schema.ts`.
- English in commits, code, comments, PR descriptions.
- No AI attribution in git metadata (no `Co-Authored-By: Claude`, no "Generated with…" trailers).

---

## Recipes — delivered as Claude Code skills

For common tasks, follow the matching **skill** from the `vskill` plugin. Each skill is the authoritative step-by-step template — **do not improvise**.

| User asks to…                                     | Invoke skill          |
| ------------------------------------------------- | --------------------- |
| add a new page or route                           | `add-page`            |
| add a form with validation                        | `add-form`            |
| add an API resource (types + api class + queries) | `add-api-endpoint`    |
| add a Pinia store (client state)                  | `add-store`           |
| add a reusable composable                         | `add-composable`      |
| add a component (common or feature-scoped)        | `add-component`       |
| diagnose a TS / build / runtime error             | `debug-common-errors` |

Name the skill in the Pre-code Protocol's `Approach:` line (e.g. `Approach: following add-form skill`).

For features that span several skills (e.g. "users list page" = `add-api-endpoint` + `add-component` + `add-page`), announce the **chain** before starting. In VIBE-CODER mode, wait for the user to confirm the chain before writing any code.

If the task does not match any skill, say so and propose either (a) handling it ad-hoc with explicit justification, or (b) stopping to design a new recipe first. Never silently improvise a pattern that will later drift.

---

## Definition of Done — run this checklist before claiming "done"

- [ ] No `any`, `as any`, `@ts-ignore`
- [ ] No `console.log`, `debugger`, or orphan `TODO`
- [ ] No duplicated logic with existing files (if found — extracted to a composable or util)
- [ ] No unused imports, variables, or exports
- [ ] No new npm packages installed without permission
- [ ] Files touched are ≤ 300 lines (if any grew above, split)
- [ ] Magic values lifted to named constants
- [ ] `Type Check` task passes (no TS errors)
- [ ] `Lint` task passes (no ESLint errors)
- [ ] For UI changes — verified in the browser: golden path + at least one edge case

If any box is unchecked, state it explicitly; do not claim "done".

---

## Asking Questions (VIBE-CODER mode)

Format:

```
I'm about to [action]. Two options:

A) [approach] — [tradeoff]
B) [approach] — [tradeoff]

Which one?
```

Never bury the question in a paragraph. Never proceed silently on an ambiguous request.

---

## Package Installation

Before running `npm install <pkg>`, in either mode:

```
Package:                [name]
Purpose:                [one sentence]
Alternatives considered: [Nuxt UI / VueUse / native API — why they don't fit]
Bundle impact:          [approx size / tree-shakeable?]

Approve?
```

Never install silently — even in DEVELOPER mode.

---

## Commit Discipline

- `git commit` is protected by a Husky `pre-commit` hook that runs `lint-staged` (ESLint + Prettier on staged files) and `vue-tsc --noEmit` (full-project type check).
- **Never bypass the hook.** `git commit --no-verify`, `-n`, `--no-gpg-sign` are forbidden — even "just this once", even "just to save progress".
- If a hook fails: read the error, fix the underlying issue, stage the fix, recommit. Never silence with `@ts-ignore`, `eslint-disable`, or by deleting the failing check.
- Commit messages are in English and describe the _why_. **No AI attribution** in git metadata (no `Co-Authored-By: Claude`, no "Generated with…" trailers).
- Keep commits small and atomic — one logical change per commit.

---

## Anti-drift Audit — on user's "audit" command or every ~10 tasks

Scan the project for:

- Files > 300 lines
- Functions or composables duplicated across files
- Types defined in 2+ places
- Unused exports
- Mode-inappropriate code (`fetch` in a component, server-state in Pinia, hardcoded colours, global styles outside `main.scss`, etc.)

Report findings as a table. Do not fix without approval.

---

## Explaining Completed Work

After every task, end with:

```
Changed:
- path/to/file.vue — [what changed]
- path/to/store.ts — [what changed]

Why:    [one sentence]
Verify: [one sentence — how to check in the browser]
```

In VIBE-CODER mode, always include `Verify`. In DEVELOPER mode, `Verify` is optional.

---

## Conflict Resolution

If this file, the `stack-reference` skill, the recipe skills, and the global `~/.claude/CLAUDE.md` disagree:

1. User's explicit in-session instructions — highest priority
2. This project `CLAUDE.md`
3. The `stack-reference` skill (stack, architecture, conventions)
4. Recipe skills (`add-page`, `add-form`, `add-api-endpoint`, `add-store`, `add-composable`, `add-component`, `debug-common-errors`)
5. Global `~/.claude/CLAUDE.md`
6. Defaults

If you spot a real contradiction (not just a gap), flag it before acting on it.
