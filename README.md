# vskill — Design Skills for Claude Code

[![MIT License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Design-focused skills for [Claude Code](https://claude.com/claude-code). Skills that let Claude **make** a UI, **build it** out of a canonical Vue 3 + Nuxt UI stack, and **see** the result it produced — multimodal feedback (screenshots, DOM, console) via the `chrome-devtools` MCP.

One plugin. 19 skills — design-focused, plus a meta-skill for authoring specialist subagents.

## Quick Start

```bash
/plugin marketplace add VeyDlin/vskill
/plugin install vskill@vskill
```

The `chrome-devtools` MCP and `nuxt-ui-remote` MCP should be connected separately — the visual-feedback skills use `chrome-devtools` for screenshots and console reads; the recipe skills use `nuxt-ui-remote` to look up existing Nuxt UI components before writing wrappers.

## The plugin: `vskill`

Four layers of skills that compose into a full design-and-build workflow.

### Entry point / Scaffold (1 skill)

| Skill | What it does |
|-------|-------------|
| `init-frontend-project` | **Single entry point** for starting new frontend work. Classifies intent: a *feature brief* ("build me a goose shop") is delegated to `design-prototype` for the full brief → scaffold → recipes → review loop; a *bare scaffold* request ("init a Vue project") runs the 15-step bootstrap here — Vite + Vue 3 + TS strict + Nuxt UI + Pinia + vue-query + Zod + ESLint + Prettier + Husky — and drops `CLAUDE.md` at the project root |

### Reference (1 skill)

Not a recipe — a knowledge skill that every other skill consults for stack architecture, folder layout, API/store/composable patterns, naming, tooling, and the VS Code workspace.

| Skill | What it does |
|-------|-------------|
| `stack-reference` | Canonical Vue 3 + Nuxt UI stack definition — packages, folder layout, API client shape, Pinia vs vue-query rules, SCSS + Nuxt UI tokens, lint/prettier/husky baseline, `App.code-workspace`. Consulted on demand; overridden by project `CLAUDE.md` where they disagree |

### Recipes (7 skills)

Each recipe is a standalone skill that produces a specific kind of file inside a scaffolded project. They cross-reference each other but never batch multiple produce-types into one step.

| Skill | What it does |
|-------|-------------|
| `add-api-endpoint` | Types + API class + vue-query composables for a feature |
| `add-store` | Pinia store (Composition API, persisted-state `pick` allow-list) |
| `add-composable` | Reusable `useXxx` composable (VueUse-first check, `MaybeRefOrGetter` inputs) |
| `add-component` | Reusable Vue component (common or feature-scoped), scoped SCSS, Nuxt UI tokens |
| `add-form` | `<UForm :schema :state>` with Zod + vee-validate |
| `add-page` | Route-level view wired through the router |
| `debug-common-errors` | Diagnose and fix frequent Vue + Nuxt UI + Pinia + vue-query pitfalls |

### Design (9 skills)

Higher-level skills that drive the recipes, review UI visually, or extract/audit UX.

| Skill | What it does |
|-------|-------------|
| `screen-sketch` | Autonomous orchestrator reached via `init-frontend-project`'s dispatcher when a **sketch** brief is detected. Produces Figma-style static HTML artboards — one `.html` file per screen, all CDN-loaded (Tailwind Play + Vue global + Iconify web component + Inter Variable + picsum.photos), opened via `file://` with no build step. Drives `chrome-devtools` to screenshot each sketch and iterates on layout/hierarchy. No state, no router, no adaptivity — locked to one chosen viewport per sketch |
| `design-prototype` | Autonomous orchestrator reached via `init-frontend-project`'s dispatcher when a **feature** brief is detected. Parses the brief → calls `init-frontend-project` in scaffold-only mode → chains recipes → launches dev server → screenshots via `chrome-devtools` → self-critiques against a polish checklist → iterates until presentable. Can also be invoked directly on an existing vskill project for the review-and-improve loop |
| `design-review` | Visual design quality review with screenshots — layout, typography, spacing, colour, hierarchy, polish |
| `design-system` | Extract a design system (colours, type, spacing) from a live site or screenshot into `docs/DESIGN.md` |
| `ux-audit` | Exhaustive UX audit with 8-scenario battery and ranked findings |
| `ux-extract` | Extract a reusable UX pattern library from a reference app |
| `ux-compare` | Compare UX patterns across multiple reference apps |
| `responsiveness-check` | Resize through breakpoints, screenshot each, detect layout breaks |
| `onboarding-ux` | Audit onboarding gaps and generate in-app guidance (`UEmptyState`, `WelcomeBanner`, checklist store, dismissible hints) |

### Authoring (1 skill)

Meta-skill that produces a `.claude/agents/<name>.md` specialist subagent file. Not design-specific — lives in this plugin so it ships alongside the rest of the tooling.

| Skill | What it does |
|-------|-------------|
| `writing-specialist-agent` | Scaffold a project-local specialist subagent (review, audit, debug, security, performance, architect roles) — calibrated persona, ordered methodology, anti-sycophancy guards, severity-tagged output, tool allowlist tuned to the archetype |

## Priority contract

Every skill announces the same rule: if the target project has `CLAUDE.md` at its root, **that file outranks the skill**. The skills are defaults — the project's own instructions override them.

`init-frontend-project` is what places `CLAUDE.md` in a new project. The stack architecture itself lives in the `stack-reference` skill — not as a file in the project — so stack updates roll out through the plugin without needing to touch each cloned project.

## Dispatch pattern

`init-frontend-project` is the **single entry point** — users invoke it whether they want a bare scaffold, a sketch, or a full brief-driven prototype. The skill classifies intent across three branches:

- **Sketch brief** ("набросай экраны", "sketch me a layout", "like Figma in code") → delegates to `screen-sketch`, which produces standalone HTML artboards that open via `file://` with no build step, screenshots them through `chrome-devtools`, and iterates on layout.
- **Feature brief** ("build me a goose shop", "make a dashboard with X") → delegates to `design-prototype`, which re-enters `init-frontend-project` in *scaffold-only mode* (dispatcher is skipped on re-entry), then runs the recipes and the screenshot-and-critique loop.
- **Bare scaffold** ("init a Vue project", "just the skeleton") → runs the 15-step bootstrap in `init-frontend-project` directly.

Tie-breaker between sketch and feature: if the answer to *"does any button actually need to do something?"* is **no**, go to `screen-sketch`; otherwise `design-prototype`.

Both `design-prototype` and `screen-sketch` are also callable directly inside an existing project to extend or review without re-scaffolding.

## How the visual-feedback loop works

Skills that need to *see* the design (`design-prototype`, `design-review`, `design-system`, `ux-audit`, `ux-extract`, `responsiveness-check`, `onboarding-ux`) drive the `chrome-devtools` MCP:

- `take_screenshot` — Claude receives the image and reviews it multimodally
- `take_snapshot` — DOM structure for element inspection
- `list_console_messages` — read console errors/warnings
- `resize_page` — trigger responsive layouts
- `evaluate_script` — inspect computed styles / runtime state

Without the MCP connected, these skills fall back to their non-visual paths where possible; `design-prototype` flags the limitation up front.

## Philosophy

**Every skill must produce something.** No knowledge dumps — only workflow recipes that create files or visible output.

**Teach patterns, not ship scripts.** Skills describe what to do; Claude generates code adapted to the project. Packages are installed by name without pinning (versions rot). The project-level behavioural contract (`CLAUDE.md`) is shipped as an asset inside `init-frontend-project`; the stack architecture lives in the `stack-reference` skill rather than as a project-root file, so updates propagate through the plugin instead of decaying inside dozens of cloned projects.

**Inline everything critical.** SKILL.md is what the agent sees — reference files are for variant-specific or optional material only.

## Credits

Forked from [jezweb/claude-skills](https://github.com/jezweb/claude-skills) (MIT) by Jeremy Dawes. This fork narrows the scope to design-only skills, merges the separate `frontend` and `dev-tools` plugins into a single `vskill` plugin, adds the Vue 3 + Nuxt UI recipe chain, updates author attribution, and removes publishing infrastructure specific to the original author. Original copyright preserved in [LICENSE](LICENSE).

## License

MIT — see [LICENSE](LICENSE).
