---
name: init-frontend-project
description: Entry point for starting new Vue 3 + Nuxt UI frontend work. Classifies the user's intent into one of three branches and dispatches — (1) a sketch brief ("набросай экраны", "sketch me a layout", "like Figma in code") is delegated to `screen-sketch` for static HTML artboards with no build step; (2) a feature brief ("build me a goose shop", "make a dashboard with X, Y, Z") is delegated to `design-prototype` for the full scaffold → recipes → review loop; (3) a bare-scaffold request ("init Vue project", "just the skeleton") runs the 15-step bootstrap here (Vite + Vue 3 + TypeScript strict + Nuxt UI standalone + Pinia + vue-query + vee-validate/Zod + VueUse + radash + SCSS + Vitest + Playwright + ESLint + Prettier + Husky) and drops `CLAUDE.md` at the project root. Stack architecture itself lives in the separate `stack-reference` skill. Invoke on "new project", "start a frontend", "scaffold Vue app", "init frontend", "build me a frontend for X", "create a Vue app that does Y", "sketch me screens", "набросай макеты".
---

# Initialise a Vue 3 + Nuxt UI Frontend Project

This is the **entry point** for all new-frontend work. It first classifies the user's intent across three branches, then either hands off to `screen-sketch` (static HTML artboards), hands off to `design-prototype` (working Vue app from a brief), or runs the bare-scaffold steps itself.

## When to use

On the very first turn of a new frontend request, or when the user asks to start/bootstrap/sketch anything. Do **not** invoke the scaffold path inside an existing Vue project — it will clobber `package.json`. The sketch path is safe anywhere because it only writes into `sketches/`.

## Dispatch — classify the user's intent first

Before running any setup, read the request and classify:

**Sketch brief** — the user wants **static visual drafts** of screens with no functionality (like Figma artboards, just rendered as HTML). The giveaway words: *набросай*, *sketch*, *mockup*, *wireframe*, *покажи как могло бы выглядеть*, *just the layout*, *like in Figma*, *artboard*, *quick mock-up*, *без логики*. Examples:

- *"набросай 3 экрана для лавки гусей"*
- *"sketch me what a settings screen could look like"*
- *"quick mockup of a dashboard, no functionality"*
- *"like in Figma, but in code — just the screens"*

→ Announce: **"Sketch brief detected. Delegating to `screen-sketch` — pure HTML artboards, no build, no state."**
→ Invoke the `screen-sketch` skill with the brief.
→ **Do NOT proceed with Steps 1–15 below.** Screen sketches don't need a Vue project; `screen-sketch` produces standalone `.html` files that open by double-click.

**Feature brief** — the user describes a product/UI they want **built and working** (entities, screens, interactive behaviour, real data flow). Examples:

- *"build me a goose shop with cool effects"*
- *"make a dashboard with user list + detail + settings"*
- *"prototype a kanban board"*

→ Announce: **"Feature brief detected. Delegating to `design-prototype` for the full brief → scaffold → recipes → review loop."**
→ Invoke the `design-prototype` skill with the brief.
→ **Do NOT proceed with Steps 1–15 below.** `design-prototype` will call back into this skill for the scaffold part (see re-entry exception).

**Bare scaffold** — the user wants a configured but empty project they will fill in manually. Examples:

- *"init a Vue project"*
- *"scaffold a new frontend"*
- *"just give me the skeleton, I'll build from there"*

→ Proceed with Steps 1–15 below.

**Ambiguous** — single-question check, pick the most likely branch from the wording and ask: *"Sketch-only visual drafts, working prototype, or empty scaffold?"* Then branch.

Tie-breaker between sketch and feature briefs: if the answer to *"does any button actually need to do something?"* is **no**, route to `screen-sketch`; otherwise `design-prototype`.

### Re-entry exception

When this skill is invoked **by `design-prototype`** (coming back for the scaffold part), skip the dispatch classification entirely and go straight to Step 1. Recognise re-entry by the caller context: `design-prototype` explicitly announces *"invoking init-frontend-project in scaffold-only mode"* when it calls this skill.

## Priority rule

The `CLAUDE.md` asset this skill copies into the user's project root **outranks every other skill in this plugin**. The stack itself is documented in the separate `stack-reference` skill (not shipped as a file) — that skill is the default reference for architecture, naming, and conventions, and is overridden in turn by the project's `CLAUDE.md` if they disagree. Announce any conflict before acting.

## What this skill produces

A runnable project at the user's chosen directory with:

- Vite + Vue 3 + TypeScript strict
- Nuxt UI in **standalone** mode (no Nuxt framework — just `@nuxt/ui/vite` + `@nuxt/ui/vue-plugin`)
- Pinia + `pinia-plugin-persistedstate`, `@tanstack/vue-query`, Zod + `vee-validate`, VueUse, radash, ofetch
- SCSS, `@iconify-json/material-symbols`
- Vitest + `@vue/test-utils`, Playwright
- `@antfu/eslint-config`, Prettier, `.editorconfig`
- Husky + lint-staged with `vue-tsc --noEmit` on pre-commit
- `App.code-workspace` (VS Code workspace), `.vscode/` intentionally absent
- `CLAUDE.md` at the project root (from `assets/`) — the behavioural contract
- Full `src/` skeleton per the `stack-reference` skill (§Project Structure)

## Prerequisites

- Node.js ≥ 20.19 or ≥ 22.12 (Vite 7 requirement)
- `npm` available
- Empty target directory (or one containing only documents the user wants to preserve)

Ask the user for the project **name** and **target path** before starting. If either is unclear, stop and ask.

## Scaffold Steps

Run these only under the **Bare scaffold** path or when re-entered from `design-prototype` in scaffold-only mode. Under the Feature brief path, `design-prototype` orchestrates and will invoke these steps for you at the right moment.

Follow every step. Do not skip, do not reorder, do not combine. Every step either runs a command or creates a file — never both in the same step.

### 1. Scaffold the Vite project

```bash
npm create vite@latest <project-name> -- --template vue-ts
cd <project-name>
```

Then clear Vite's demo code — delete everything in `src/` except `main.ts` and `vite-env.d.ts`; delete `public/vite.svg` and the CSS import from `main.ts`.

### 2. Install runtime dependencies

Install the latest version of each package by name (no pinned versions — the user's project should get current releases):

```bash
npm install vue-router pinia pinia-plugin-persistedstate \
    @tanstack/vue-query \
    @nuxt/ui \
    zod vee-validate @vee-validate/zod \
    @vueuse/core radash \
    ofetch \
    @iconify-json/material-symbols
```

### 3. Install dev dependencies

```bash
npm install -D \
    typescript vue-tsc \
    sass \
    @antfu/eslint-config eslint \
    prettier \
    vitest @vue/test-utils jsdom \
    @playwright/test \
    husky lint-staged \
    rimraf
```

Then run `npx playwright install` to fetch browsers.

### 4. Configure Vite for Nuxt UI standalone + `@/` alias

Replace `vite.config.ts` with:

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import ui from "@nuxt/ui/vite";
import { fileURLToPath, URL } from "node:url";

export default defineConfig({
    plugins: [
        vue(),
        ui({
            ui: {
                colors: {
                    primary: "blue",
                    neutral: "slate",
                },
            },
        }),
    ],
    resolve: {
        alias: {
            "@": fileURLToPath(new URL("./src", import.meta.url)),
        },
    },
});
```

### 5. Wire the entry point

Replace `src/main.ts` with:

```typescript
import { createApp } from "vue";
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { VueQueryPlugin } from "@tanstack/vue-query";
import ui from "@nuxt/ui/vue-plugin";

import App from "@/App.vue";
import router from "@/router";

import "@/assets/scss/main.scss";

const app = createApp(App);

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.use(router);
app.use(VueQueryPlugin);
app.use(ui);

app.mount("#app");
```

### 6. Create the `src/` skeleton

Create these directories and files (empty `.gitkeep` where noted):

```
src/
├── assets/scss/
│   ├── _variables.scss       (empty)
│   └── main.scss              (@use "./variables";)
├── api/
│   ├── client.ts              (from stack-reference §API Layer > Base Client)
│   └── index.ts               (empty export {})
├── components/
│   ├── common/.gitkeep
│   └── .gitkeep
├── composables/.gitkeep
├── layouts/
│   └── DefaultLayout.vue      (<template><RouterView /></template>)
├── plugins/.gitkeep
├── router/
│   └── index.ts               (createRouter with WebHistory, empty routes array plus a Home redirect)
├── schemas/.gitkeep
├── stores/.gitkeep
├── types/
│   ├── models/.gitkeep
│   └── api/.gitkeep
├── utils/.gitkeep
├── views/
│   └── HomeView.vue           (minimal Nuxt UI UCard placeholder)
├── App.vue                    (<template><DefaultLayout /></template>)
└── main.ts                    (already written in step 5)
```

Copy the `apiClient` function verbatim from the `stack-reference` skill §API Layer > Base Client.

Minimal `src/router/index.ts`:

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";
import HomeView from "@/views/HomeView.vue";

const routes: RouteRecordRaw[] = [
    { path: "/", name: "home", component: HomeView },
];

export default createRouter({
    history: createWebHistory(),
    routes,
});
```

### 7. Configure TypeScript paths

Edit `tsconfig.app.json` (Vite 7 scaffold splits tsconfig). Add under `compilerOptions`:

```jsonc
{
    "compilerOptions": {
        "strict": true,
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"]
        }
    }
}
```

### 8. ESLint config

Create `eslint.config.ts`:

```typescript
import antfu from "@antfu/eslint-config";

export default antfu({
    stylistic: {
        indent: 4,
        quotes: "double",
        semi: true,
    },
    vue: true,
    typescript: true,
});
```

### 9. Prettier + editorconfig

Create `.prettierrc.json`:

```json
{
    "useTabs": false,
    "tabWidth": 4,
    "printWidth": 120,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "all"
}
```

Create `.editorconfig`:

```ini
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
charset = utf-8
```

### 10. Husky + lint-staged

```bash
npx husky init
```

Overwrite `.husky/pre-commit` with:

```bash
npx lint-staged
npx vue-tsc --noEmit
```

Add to `package.json` (merge, don't overwrite existing fields):

```jsonc
{
    "scripts": {
        "prepare": "husky",
        "dev": "vite",
        "build": "vue-tsc --noEmit && vite build",
        "preview": "vite preview",
        "typecheck": "vue-tsc --noEmit",
        "lint": "eslint .",
        "lint:fix": "eslint . --fix",
        "test": "vitest run",
        "test:watch": "vitest",
        "e2e": "playwright test"
    },
    "lint-staged": {
        "*.{ts,js,vue,json,jsonc}": ["eslint --fix", "prettier --write"],
        "*.{scss,md,html}": ["prettier --write"]
    }
}
```

### 11. Copy the behavioural contract

Copy the single asset file from this skill into the project root:

- `assets/CLAUDE.md` → `<project>/CLAUDE.md`

This is **not optional** — every subsequent session in this project reads `CLAUDE.md` first. Do not edit it during scaffold.

The stack architecture itself is NOT shipped as a file — it lives in the separate `stack-reference` skill. Claude consults it on demand when a recipe references it or when the user asks architectural questions. This keeps the project root clean and lets stack updates roll out through the plugin without touching each cloned project.

### 12. Create the VS Code workspace

Create `App.code-workspace` in the project root, copying the JSON block from the `stack-reference` skill §VS Code Workspace verbatim.

Tell the user to open the project via **File → Open Workspace from File → App.code-workspace** — not the folder.

### 13. Extend `.gitignore` with vskill convention directories

Vite's generated `.gitignore` covers `node_modules`, `dist`, and friends but not the vskill-specific `.review/` directory (where `design-prototype` and visual-review skills drop screenshots). Append these lines to `.gitignore`:

```gitignore

# vskill conventions
.review/
```

Do **not** add `.husky/` here — husky hook scripts are intentionally committed (they only work if present after `git clone`). `.husky/` is hidden from the VS Code explorer via `files.exclude` in `App.code-workspace` instead.

### 14. Smoke test

```bash
npm run dev
```

Wait for Vite's "ready in Xms" line. The user should see the `HomeView` placeholder at the printed URL. Then Ctrl-C.

Run:

```bash
npm run typecheck
npm run lint
```

Both must pass with zero errors before handing off.

### 15. Initial commit

```bash
git init
git add .
git commit -m "Initial scaffold: Vue 3 + Nuxt UI standalone + vskill stack"
```

The pre-commit hook will run — if it fails, **do not** use `--no-verify`. Fix the error and retry.

## Verification

- `npm run dev` serves without console errors
- `npm run typecheck` passes
- `npm run lint` passes
- `CLAUDE.md` exists at the project root
- `src/` matches the tree in the `stack-reference` skill §Project Structure
- Nuxt UI components (e.g. `<UButton />`) render without registration — the plugin auto-registers them

## Common pitfalls

- **Using `nuxt` CLI instead of Vite** — Nuxt UI standalone does NOT use the Nuxt framework. Only the component library plus its Vite + Vue plugins.
- **Pinning package versions** — install by name, let npm resolve latest. The user's project should not inherit stale versions frozen into a skill.
- **Forgetting the `@` alias in both Vite *and* tsconfig** — Vite needs it for the dev server, TypeScript needs it for type-checking. Both must be set.
- **Skipping the asset doc copy** — without `CLAUDE.md` at the project root, every subsequent session will default to generic Claude behaviour instead of the project contract.
- **Shipping `FRONTEND-STARTER.md` into the project root** — no longer done. The stack lives in the `stack-reference` skill, so every cloned project inherits updates as the plugin evolves. Don't recreate it as a project-root file.
- **Creating a `.vscode/` directory** — we use `App.code-workspace` only. No `.vscode/`.
- **Bypassing the pre-commit hook** — if step 14's commit fails, fix the underlying error. The hook is a feature, not a nuisance.
