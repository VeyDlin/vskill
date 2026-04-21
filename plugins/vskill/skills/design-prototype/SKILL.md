---
name: design-prototype
description: Use when the user gives a short design/product brief and expects a runnable Vue 3 + Nuxt UI prototype without hand-holding. Autonomously scaffolds the project (via `init-frontend-project`), chains the recipe skills (`add-api-endpoint`, `add-store`, `add-form`, `add-component`, `add-page`) to build features, launches the dev server, drives `chrome-devtools` MCP to screenshot the running app, self-critiques the screenshots against a polish checklist, and iterates until the result is presentable — all without per-step confirmation. Triggers: "build me a prototype of X", "make a Vue app that does Y", "autonomous design", "prototype this idea".
---

# Autonomous Design Prototype

Build a runnable Vue 3 + Nuxt UI prototype from a short brief, then review it visually and iterate — without the user managing each step.

## Priority rule

The `CLAUDE.md` file at the target project root **outranks this skill and every other skill in this plugin**. If the project doc contradicts this skill, follow the project doc and announce the conflict.

## Prerequisites

- `chrome-devtools` MCP connected (this is the seeing-eye for self-critique). If absent, fall back to non-visual iteration and state that limitation up front.
- Node.js ≥ 20.19 or ≥ 22.12.
- A target directory path (ask the user once if they haven't given one).

## Autonomy contract

This skill runs **autonomous** — after the initial brief-to-plan confirmation, do not ask again until you are **done** or **stuck**. "Stuck" means: three consecutive iterations fail to improve the same defect, a skill chain hits an ambiguous fork, or a dependency install needs explicit approval. Everything else is your call.

Do **not** narrate every file write. Give one progress update per phase (scaffold done / feature built / review pass N / done).

## Steps

### 1. Parse the brief into a skill chain

Read the brief once. Produce **one** block of output in this exact shape, then wait for a **single** go/no-go from the user:

```
Brief:        [one-line paraphrase of the user's ask]
Entities:     [e.g. User, Task, Invoice — the nouns the UI handles]
Client state: [auth, theme, etc. — feeds add-store; empty is fine]
Mock API:     [yes/no — see step 3]
Screens:      [list of views with rough purpose]
Skill chain:  init-frontend-project → add-api-endpoint(...) → add-store(...) → add-component(...) → add-page(...) → ...
Visual bar:   [what "good enough" looks like for the first pass — e.g. "clean list + detail, no layout breaks, Nuxt UI defaults polished"]
```

Do not propose A/B options here. Pick one plan; the user either says "go" or redirects. This is the only mandatory stop before code.

### 2. Scaffold (once)

Invoke the `init-frontend-project` skill at the target path. That skill installs the stack, lays down the `src/` tree, and places `CLAUDE.md` at the project root (the stack architecture itself lives in the separate `stack-reference` skill, not as a file in the project). Skip this step if the project already exists and already has `CLAUDE.md`.

### 3. Resolve the data strategy

Prototypes don't need a real backend. Pick one of:

- **In-memory mock** — a plain TS module under `src/api/__mock__/{feature}.mock.ts` that `users.api.ts` imports from instead of calling `apiClient`. Fastest; no extra dependency. Default choice.
- **MSW (Mock Service Worker)** — only if the user asks for a realistic network tab or wants to demo loading/error states with latency. Install with explicit user approval.
- **Real backend** — if the user already has one and gave you the base URL.

State the pick in a one-liner and move on.

### 4. Build the features, skill by skill

Run the chain from step 1 in order. For each feature:

1. `add-api-endpoint` → types, API class, vue-query composables.
2. `add-store` → only if there is actual client state (skip for pure read-only prototypes).
3. `add-component` → feature components before the view that uses them.
4. `add-form` → only for features with structured input.
5. `add-page` → last; ties the rest together.

Follow each skill's SKILL.md verbatim. Do not improvise file layout or naming. Do not batch multiple skills into one file — each skill produces its own files.

### 5. Launch the dev server

```bash
npm run dev
```

Run in the background. Capture the URL Vite prints (usually `http://localhost:5173`). Wait for "ready in Xms" before moving on.

### 6. Visual review loop

For each route in the plan, repeat until either the route passes the polish checklist or you've iterated three times without measurable improvement:

1. `mcp__chrome-devtools__new_page` (first time) / `navigate_page` → open the route.
2. `mcp__chrome-devtools__take_screenshot` at desktop width.
3. `mcp__chrome-devtools__resize_page` to 375×812, screenshot again (mobile).
4. `mcp__chrome-devtools__list_console_messages` → note any errors; they are automatic defects.
5. Score the screenshots against the polish checklist below.
6. If defects exist, open the source files and fix them directly (no extra skill needed for tweaks that fit in a single file). For structural changes — new component, new composable, new page — re-enter the appropriate recipe skill.
7. Wait for Vite HMR to reload; repeat from step 2.

### Polish checklist (each route must pass all)

- **No console errors.** Warnings are tolerable; errors aren't.
- **All four data states rendered** — loading (via skeleton), error (UAlert), empty (UEmptyState), populated. A prototype with a blank page while data loads is a failure.
- **Uses Nuxt UI tokens** — `var(--ui-text)`, `var(--ui-border)`, etc. No raw hex or `rgb(...)`. Run `grep -rE "#[0-9a-fA-F]{3,8}|rgb\(" src/` — must be empty.
- **No layout break at 375px.** Content does not overflow; primary action stays visible.
- **Spacing scale is consistent.** Gaps are `0.25rem | 0.5rem | 0.75rem | 1rem | 1.5rem | 2rem` — not random pixel values.
- **One clear primary action per view.** Secondary actions use `variant="ghost"` or `variant="outline"`.
- **Typography hierarchy visible.** h1/h2/body are distinct — if every line looks the same, fix it.
- **Icons match.** Every `<UButton icon="...">` uses `i-material-symbols:*`. No mixed icon packs.

### 7. Hand-off

When every route passes the checklist:

1. Stop the dev server.
2. Run `npm run typecheck` and `npm run lint` — both must exit 0.
3. Make one commit: `git add . && git commit -m "Prototype: <brief one-liner>"`. The husky pre-commit hook must pass; do not bypass.
4. Report back:

```
Project:   [path]
Routes:    [list, each with the URL]
Screens:   [attach the final screenshot paths from chrome-devtools]
Stack:     Vue 3 + Vite + Nuxt UI standalone + Pinia + vue-query (+ MSW if used)
Next:      [one line — what the user would plausibly do next, e.g. "swap the mock for a real API", "tighten empty-state copy"]
```

## Failure modes — stop and ask

- **Three iterations on the same defect without improvement.** You're stuck. Describe the defect plus what you tried and ask.
- **A skill chain branch is genuinely ambiguous** (e.g. "settings page" could be a form or a list + detail — you can't tell from the brief). Ask one question, pick the answer, proceed.
- **A dependency needs explicit approval.** Never `npm install` a package outside what `init-frontend-project` already installed without the Package Installation block from the project's `CLAUDE.md`.
- **`chrome-devtools` MCP is not connected.** Warn the user, build blind (skip step 6), and state clearly in the hand-off that the prototype was not visually reviewed.

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Narrating every file write | Buries progress; wastes the user's attention | One update per phase, not per file |
| Skipping `init-frontend-project` and scaffolding by hand | The asset docs don't land, stack drifts | Always go through the init skill |
| Writing a mega-view instead of running the component → page skills | Ends up as a 500-line `.vue` file AI can't maintain | Follow the skill chain in step 4 |
| Pinning package versions from memory | Bits rot, installs fail | The init skill installs by name; do not edit versions |
| Static `<img>` placeholder instead of a skeleton | Layout shifts on load; looks unfinished | Render `<USkeleton>` until `isLoading` resolves |
| Hardcoded copy in English only, then asking the user "should this be i18n'd?" | Premature — prototypes don't need i18n | Ship English; if the brief mentions multi-language, install `vue-i18n` in step 3 |
| Committing with `--no-verify` because the hook failed | Hides real TS/lint errors | Fix the error; re-stage; recommit |
| Reviewing only the happy path | Empty/error states never get caught | The checklist requires all four data states per view |
