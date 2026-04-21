---
name: stack-reference
description: "Canonical reference for the Vue 3 + Vite + Nuxt UI standalone stack used across vskill projects. Invoke when you need to know WHAT to build with — which packages, how the `src/` tree is laid out, how the API client is shaped (ofetch + `api/` classes), how Pinia stores and vue-query composables fit together, form + Zod integration, scoped SCSS + Nuxt UI tokens, animation ladder, conditional libraries, naming conventions, lint/prettier/husky baseline, and the shared VS Code workspace. Read at the start of any session inside a vskill-scaffolded project, and any time a recipe skill says \"follow stack-reference § X\". Triggers: 'what stack', 'project architecture', 'how do I set up the API layer', 'Pinia vs vue-query', 'where do schemas live', 'stack reference', 'FRONTEND-STARTER'."
---

# Stack Reference — Vue 3 + Nuxt UI Standalone

The canonical *what to build with* for any project scaffolded by `init-frontend-project`.

- **This skill** — *what* to build with: stack, architecture, file layout, conventions.
- **Recipe skills** (`add-page`, `add-form`, `add-api-endpoint`, `add-store`, `add-composable`, `add-component`, `debug-common-errors`) — *how* to build specific file types. Follow them verbatim; don't improvise.
- **Project `CLAUDE.md`** (dropped at the project root by `init-frontend-project`) — *how* to collaborate: behavioural contract, mode switching (DEVELOPER / VIBE-CODER), hard rules, Definition of Done.

Read the project's `CLAUDE.md` at the start of every session. Consult this skill on demand, or whenever a recipe references it.

## Priority rule

If the target project has a `CLAUDE.md` at its root, that file **outranks this skill**. When project-level rules conflict with the defaults here (stack swap, renamed folder, different conventions), honour the project and flag the contradiction. This skill is the default — the project is the source of truth.

---

## Core Stack

| Package | Purpose |
|---------|---------|
| **Vue 3** + **Vite** | UI layer, Composition API + `<script setup>`, build tool |
| **vue-router** | Routing (required peer dependency for Nuxt UI) |
| **Nuxt UI** (`@nuxt/ui`) | Component library — **standalone mode, WITHOUT Nuxt framework**. Uses `@nuxt/ui/vite` plugin + `@nuxt/ui/vue-plugin` |
| **TypeScript (strict)** | No `any`, no `as any`, no `@ts-ignore`. Use `unknown` for unknown types |
| **Pinia** | State management |
| **pinia-plugin-persistedstate** | Persistent state (localStorage/sessionStorage) when needed |
| **Zod** | Schema validation (forms, API responses, env vars) |
| **@tanstack/vue-query** | Server state — caching, optimistic mutations, offline queue, retry |
| **VueUse** | Composables collection |
| **radash** | Utility functions (modern tree-shakeable lodash replacement) |
| **SCSS** | Styles (scoped per component) |
| **@iconify-json/material-symbols** | Icons |
| **@antfu/eslint-config** | Linting |
| **Vitest** | Unit tests |
| **@vue/test-utils** | Component testing |
| **Playwright** | E2E tests |

> **IMPORTANT:** We do NOT use the Nuxt framework (`nuxi`, `nuxt.config.ts`, SSR/SSG/Nitro). We use **Nuxt UI as a standalone Vue 3 component library** with plain Vite. See [official docs](https://ui.nuxt.com/getting-started/installation/vue) for the standalone Vue setup.


---


## Icons — Naming Convention

Package: `@iconify-json/material-symbols`

In Nuxt UI components use the `icon` prop:

```vue
<UButton icon="i-material-symbols:home" />
<UButton icon="i-material-symbols:settings-outline" />
<UButton icon="i-material-symbols:arrow-back-rounded" />
```

Pattern: `i-material-symbols:{icon-name}`

Suffixes: `-outline`, `-rounded`, `-sharp` (default is filled).

Browse available icons: https://icones.js.org/collection/material-symbols


---


## Solution Priority

When solving a task, **do NOT write code yourself** if a ready-made solution exists. Search in this order:

1. **Nuxt UI** — component, composable, or theme token
2. **VueUse** — composable
3. **TanStack** (vue-query, vue-table, vue-virtual, etc.)
4. **Search for a library** — propose to the user before installing

Only write custom code when none of the above cover the need.


---


## MCP Setup

Nuxt UI MCP server — provides component lookup, props, slots, tokens:

```bash
claude mcp add --transport http nuxt-ui-remote https://ui.nuxt.com/mcp
```

Before creating any UI component — **always check Nuxt UI MCP first** for existing analogs.


---


## Project Structure

All application code lives under `src/`. The path alias **`@/` → `src/`** is the single source of truth — never use `~/`, `../../`, or any other alias for application code.

```
project/
├── src/
│   ├── assets/
│   │   └── scss/
│   │       ├── _variables.scss
│   │       └── main.scss
│   ├── api/                      # API client classes
│   │   ├── client.ts             # Base fetch instance with interceptors
│   │   ├── users.api.ts
│   │   ├── auth.api.ts
│   │   └── index.ts              # Aggregated API object
│   ├── components/
│   │   ├── common/               # Shared components (AppHeader, AppFooter, etc.)
│   │   └── {feature}/            # Feature-scoped components
│   ├── composables/
│   │   └── use{Feature}.ts
│   ├── layouts/
│   │   ├── DefaultLayout.vue
│   │   └── AuthLayout.vue
│   ├── plugins/                  # Vue plugins
│   ├── router/
│   │   └── index.ts              # vue-router setup
│   ├── schemas/                  # Zod schemas
│   │   └── {feature}.schema.ts
│   ├── stores/                   # Pinia stores
│   │   └── {feature}.store.ts
│   ├── types/                    # Shared TypeScript types
│   │   ├── models/               # Domain models
│   │   └── api/                  # API request/response types
│   ├── utils/                    # Utility functions
│   ├── views/                    # Route-level components (pages)
│   │   └── {feature}/
│   ├── App.vue
│   └── main.ts                   # Entry point: Vue app + Nuxt UI plugin + router
├── tests/
│   ├── unit/
│   ├── components/
│   └── e2e/
├── .review/                      # Screenshots / DOM dumps from design-prototype & review skills (gitignored, hidden in VS Code)
├── .husky/                       # Git hook scripts (committed; hidden in VS Code)
├── index.html
├── vite.config.ts
├── eslint.config.ts
└── tsconfig.json
```

Every import from application code uses the `@/` alias: `import { usersApi } from "@/api"`, `import type { User } from "@/types/api/users"`. Relative imports (`./`, `../`) are allowed only for sibling files inside the same folder.


---


## API Layer

API requests live in dedicated classes — **never write `fetch` calls directly in components or stores**.

### Base Client

```typescript
// src/api/client.ts
import { ofetch } from "ofetch";
import type { FetchOptions } from "ofetch";
import router from "@/router";

const API_BASE = import.meta.env.VITE_API_BASE ?? "";

export function apiClient<T>(url: string, options?: FetchOptions): Promise<T> {
    return ofetch<T>(url, {
        baseURL: API_BASE,
        headers: {
            "Content-Type": "application/json",
        },
        onRequest({ options: opts }) {
            const token = localStorage.getItem("access_token");
            if (token) {
                opts.headers = {
                    ...opts.headers,
                    Authorization: `Bearer ${token}`,
                };
            }
        },
        onResponseError({ response }) {
            if (response.status === 401) {
                router.push("/auth/login");
            }
        },
        ...options,
    });
}
```

### API Class

```typescript
// src/api/users.api.ts
import { apiClient } from "./client";
import type { User, CreateUserRequest } from "@/types/api/users";

export const usersApi = {
    getAll(): Promise<User[]> {
        return apiClient<User[]>("/users");
    },

    getById(id: number): Promise<User> {
        return apiClient<User>(`/users/${id}`);
    },

    create(data: CreateUserRequest): Promise<User> {
        return apiClient<User>("/users", {
            method: "POST",
            body: data,
        });
    },

    delete(id: number): Promise<void> {
        return apiClient<void>(`/users/${id}`, {
            method: "DELETE",
        });
    },
};
```

### Aggregated Export

```typescript
// src/api/index.ts
export { usersApi } from "./users.api";
export { authApi } from "./auth.api";
```

### Usage with TanStack Query

```typescript
// src/composables/useUsers.ts
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { usersApi } from "@/api";

export function useUsers() {
    return useQuery({
        queryKey: ["users"],
        queryFn: () => usersApi.getAll(),
    });
}

export function useCreateUser() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (data: CreateUserRequest) => usersApi.create(data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["users"] });
        },
    });
}
```

Flow: **Component -> composable (vue-query) -> api class -> ofetch**


---


## Forms & Validation

**vee-validate** + Zod adapter for Nuxt UI form integration.

```typescript
// src/schemas/user.schema.ts
import { z } from "zod";

export const createUserSchema = z.object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    age: z.number().int().positive().optional(),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Nuxt UI `<UForm>` works with Zod schemas directly via `:schema` prop. See [Nuxt UI Form docs](https://ui.nuxt.com/components/form) for details.


---


## Styling Rules

- **No hardcoded colors** — never write `#fff`, `rgb(...)`, hardcoded color values
- **Use Nuxt UI design tokens** — `var(--ui-text-muted)`, `var(--ui-border)`, `var(--ui-bg)`, etc.
- **Customize via Nuxt UI theme** (`app.config.ts`) — do not override with custom CSS if theme config suffices
- **SCSS scoped** — every component uses `<style scoped lang="scss">`
- **No global styles except** `assets/scss/main.scss` for resets and token overrides
- **No BEM** — no `__`, no `--`. Write plain class names (`.header`, `.body`, `.title`). Vue's `<style scoped>` already appends `[data-v-hash]` to every selector, so isolation is free and block prefixes are just noise.
- **Nest SCSS to mirror the template** — stylesheet structure should follow the DOM tree. Short classes, predictable inspector output, one place to scan per component.
- **State via chained selectors** — `&.collapsed`, `&.is-active`, `&:hover`. No modifier suffixes like `--collapsed`.

```vue
<template>
    <div class="card">
        <div class="header">...</div>
        <div class="body" :class="{ collapsed }">...</div>
    </div>
</template>

<style scoped lang="scss">
    .card {
        .header {
            display: flex;
            gap: 0.75rem;
        }
        .body {
            &.collapsed {
                display: none;
            }
        }
    }
</style>
```


---


## State Management — Pinia

```typescript
// src/stores/auth.store.ts
import { defineStore } from "pinia";
import { ref, computed } from "vue";
import router from "@/router";

export const useAuthStore = defineStore("auth", () => {
    const user = ref<User | null>(null);
    const isAuthenticated = computed(() => user.value !== null);

    async function login(credentials: LoginInput): Promise<void> {
        const response = await authApi.login(credentials);
        user.value = response.user;
    }

    function logout(): void {
        user.value = null;
        router.push("/auth/login");
    }

    return { user, isAuthenticated, login, logout };
});
```

- Use **Composition API style** (`setup` function) for stores
- Add `pinia-plugin-persistedstate` for stores that need to survive page reload
- **Server state (API data) lives in vue-query, NOT in Pinia** — Pinia is for client state only (auth, UI preferences, etc.)


---


## Animation Escalation

Choose the lightest tool that solves the task:

1. **CSS transitions / Vue `<Transition>`** — simple show/hide, hover, route transitions
2. **VueUse `useMotion`** — spring-based, declarative animations
3. **GSAP** — complex timelines, scroll-driven, staggered sequences (heavy artillery, not first step)


---


## Conditional Libraries

Install **only when needed**, not upfront:

| Need | Library | Notes |
|------|---------|-------|
| I18n | `vue-i18n` | When multi-language is required |
| Date formatting | `dayjs` | Lightweight. Use `date-fns` if need tree-shaking or functional style |
| Image gallery / lightbox | `photoswipe` | When user needs to open/zoom images |
| File upload | `filepond` | Simple uploads. Use `uppy` for multipart, S3, resumable |
| 3D | `@pmndrs/vanilla` (drei-vanilla) | Three.js helpers. [GitHub](https://github.com/pmndrs/drei-vanilla) |
| SEO / Meta | `@unhead/vue` | `useHead` / `useSeoMeta` for SPA meta management |
| Image optimization | `vite-plugin-image-optimizer` | Lazy loading, responsive sizes |
| PWA | `vite-plugin-pwa` | Service worker, offline support |
| Toasts / Notifications | Nuxt UI toast | Built-in to Nuxt UI, no extra package |
| Tables (complex) | `@tanstack/vue-table` | Sorting, filtering, pagination, virtual scroll |
| Virtual scroll | `@tanstack/vue-virtual` | Large lists |


---


## Code Style

### SFC Order

```vue
<template>
    ...
</template>

<script setup lang="ts">
    ...
</script>

<style scoped lang="scss">
    ...
</style>
```

### TypeScript

- `interface` for object shapes, `type` for unions and intersections
- **strict mode** — `"strict": true` in tsconfig
- No `any`, no `as any`, no `@ts-ignore`, no `// @ts-expect-error` without justification
- Use `unknown` for truly unknown types, then narrow with type guards or Zod

### Formatting

- **4 spaces** indentation
- **K&R braces** — `{` on the same line
- Braces required for all control structures, even single-line
- Long lines — break with closing symbol on its own line:

```typescript
const result = someFunction(
    firstArg,
    secondArg,
    thirdArg
);
```

### Naming

| Entity | Convention | Example |
|--------|-----------|---------|
| Components | PascalCase | `UserCard.vue` |
| Composables | camelCase with `use` prefix | `useAuth.ts` |
| Views (pages) | PascalCase | `HomeView.vue` |
| Stores | camelCase with `.store` suffix | `auth.store.ts` |
| API classes | camelCase with `.api` suffix | `users.api.ts` |
| Schemas | camelCase with `.schema` suffix | `user.schema.ts` |
| Types/Interfaces | PascalCase | `User`, `CreateUserRequest` |
| CSS classes | kebab-case | `.user-card` |
| Constants | UPPER_SNAKE_CASE | `MAX_RETRY_COUNT` |
| Directories | kebab-case | `user-profile/` |


---


## Testing

| Tool | Scope |
|------|-------|
| **Vitest** | Unit tests — utils, composables, stores, API classes |
| **@vue/test-utils** | Component tests — rendering, events, slots |
| **Playwright** | E2E tests — full user flows in the browser |

Tests live in `tests/` mirroring the source structure.


---


## Linting & Formatting

Two tools with a clear division of labour:

- **Prettier** — formatting (indent, quotes, semicolons, line breaks, trailing commas). Runs via `editor.formatOnSave` in VS Code and via `lint-staged` on every commit.
- **ESLint** (`@antfu/eslint-config`) — code-quality rules (unused vars, forbidden patterns, type safety, Vue best practices). Runs via `codeActionsOnSave` in VS Code and via `lint-staged` on every commit.

Both tools have opinions on stylistic rules. Configure them to agree, not fight:

```typescript
// eslint.config.ts
import antfu from "@antfu/eslint-config";

export default antfu({
    stylistic: {
        indent: 4,
        quotes: "double",
        semi: true
    },
    vue: true,
    typescript: true
});
```

Companion configs at the project root:

```json
// .prettierrc.json
{
    "useTabs": false,
    "tabWidth": 4,
    "printWidth": 120,
    "semi": true,
    "singleQuote": false,
    "trailingComma": "all"
}
```

```ini
# .editorconfig
root = true

[*]
indent_style = space
indent_size = 4
end_of_line = lf
insert_final_newline = true
trim_trailing_whitespace = true
charset = utf-8
```

Run manually:

```bash
npx eslint . --fix
npx prettier . --write
```


---


## Git Hooks

Every project uses **Husky** + **lint-staged** to block bad commits at the git level. The `pre-commit` hook runs automatically on every `git commit`. Bypassing with `--no-verify` is **forbidden** (enforced in `CLAUDE.md`).

### Setup

```bash
npm install -D husky lint-staged vue-tsc
npx husky init
```

Replace `.husky/pre-commit` with:

```bash
npx lint-staged
npx vue-tsc --noEmit
```

Add to `package.json`:

```jsonc
{
    "scripts": {
        "prepare": "husky"
    },
    "lint-staged": {
        "*.{ts,js,vue,json,jsonc}": ["eslint --fix", "prettier --write"],
        "*.{scss,md,html}": ["prettier --write"]
    }
}
```

### What runs on commit

| Step | Scope | Why |
|------|-------|-----|
| `lint-staged` → `eslint --fix` + `prettier --write` | staged files only | Scales with commit size, not project size. Autofixes trivially fixable issues; fails on the rest. |
| `vue-tsc --noEmit` | whole project | TS types are global — a change in `api/users.api.ts` can break a component not in this commit. Filtering by staged files would miss real breakage. |

### Deliberately NOT on pre-commit

- **Unit tests** (`vitest`) — variable speed. Run via the `Test` VS Code task on demand.
- **E2E tests** (`playwright`) — slow. Run via the `E2E` task on demand.
- **commit-msg / commitlint** — adds friction for solo / small-team work without clear benefit.

### When a hook fails

Read the error. Fix the underlying issue. Stage the fix. Recommit.

**Do not** use `--no-verify`, `@ts-ignore`, `eslint-disable`, or deletion of the failing check to make the hook pass. These all hide the problem instead of fixing it.


---


## VS Code Workspace

Every project ships with a single `App.code-workspace` file. Open it via **File → Open Workspace from File** — never open the project folder directly. All editor configuration — recommended extensions, settings, tasks, file nesting — lives inside this one file. We do **not** use a `.vscode/` directory, so the project root stays clean.

Companion files that must sit next to the workspace:

| File | Purpose |
|------|---------|
| `.editorconfig` | Cross-editor baseline (indent, EOL, trailing whitespace). Locks formatting even if someone opens the project outside VS Code. |
| `.prettierrc.json` | Prettier config (`"useTabs": false, "tabWidth": 4, "printWidth": 120, "semi": true, "singleQuote": false, "trailingComma": "all"`). Must align with `editor.tabSize` below and with `@antfu/eslint-config` stylistic overrides. |
| `eslint.config.ts` | Flat ESLint config using `@antfu/eslint-config` with stylistic overrides to match Prettier (`indent: 4, quotes: 'double', semi: true`). |

### What the workspace gives you out of the box

- **Format-on-save** via Prettier + **ESLint auto-fix on save** — zero manual formatting
- **Error Lens** — inline errors/warnings next to the code (no hovering needed)
- **Pretty TS Errors** — readable type errors instead of walls of `InferGeneric<...>`
- **Iconify inline preview** — when you type `i-material-symbols:home`, the icon renders in the gutter
- **Tailwind autocomplete** — Nuxt UI uses Tailwind tokens under the hood, so class suggestions work
- **Vitest + Playwright explorers** — click to run tests from the sidebar
- **Task bar** (`actboy168.tasks`) — Dev / Build / Lint / Test one-click in the status bar
- **Rich file nesting** — all configs (`package.json`, `vite.config.ts`, `tsconfig.json`, `.env`, `eslint.config.ts`, etc.) collapse under `index.html`
- **Sane file hygiene** — LF line endings, trimmed trailing whitespace, final newline, no preview tabs

```jsonc
{
    "folders": [
        {
            "name": "App",
            "path": "."
        }
    ],
    "settings": {
        // Explorer / search visibility
        "files.exclude": {
            ".vscode": true,
            "**/.git": true,
            "**/.husky": true,
            "**/.review": true,
            "**/node_modules": true,
            "**/dist": true,
            "**/dist-ssr": true,
            "**/coverage": true,
            "**/.vite": true,
            "**/.cache": true,
            "**/playwright-report": true,
            "**/test-results": true,
            "**/package-lock.json": true
        },
        "search.exclude": {
            "**/.husky": true,
            "**/.review": true,
            "**/node_modules": true,
            "**/dist": true,
            "**/dist-ssr": true,
            "**/coverage": true,
            "**/playwright-report": true,
            "**/test-results": true,
            "**/package-lock.json": true,
            "**/*.min.*": true
        },

        // File nesting — collapse configs under index.html
        "explorer.fileNesting.enabled": true,
        "explorer.fileNesting.expand": false,
        "explorer.fileNesting.patterns": {
            "index.html": "package.json, package-lock.json, vite.config.*, vitest.config.*, playwright.config.*, tsconfig.json, tsconfig.*.json, .npmrc, .nvmrc, eslint.config.*, .prettierrc*, .prettierignore, .editorconfig, .gitignore, .gitattributes, .env, .env.*, env.d.ts, vite-env.d.ts, auto-imports.d.ts, components.d.ts, app.config.*, *.code-workspace, .husky, Dockerfile*, .dockerignore, README.md, LICENSE*, CHANGELOG*",
            "package.json": "package-lock.json, yarn.lock, pnpm-lock.yaml, bun.lockb",
            "App.vue": "main.ts, main.js"
        },

        // Editor behaviour — 4 spaces, format + autofix on save
        "editor.detectIndentation": false,
        "editor.insertSpaces": true,
        "editor.tabSize": 4,
        "editor.formatOnSave": true,
        "editor.codeActionsOnSave": {
            "source.fixAll.eslint": "explicit"
        },
        "editor.rulers": [120],
        "editor.bracketPairColorization.enabled": true,
        "editor.guides.bracketPairs": "active",
        "editor.stickyScroll.enabled": true,
        "editor.linkedEditing": true,
        "editor.inlineSuggest.enabled": true,

        // File handling
        "files.eol": "\n",
        "files.trimTrailingWhitespace": true,
        "files.insertFinalNewline": true,
        "files.trimFinalNewlines": true,
        "files.associations": {
            ".env*": "dotenv",
            "*.code-workspace": "jsonc"
        },

        // Default formatter: Prettier for everything, ESLint runs in codeActionsOnSave
        "editor.defaultFormatter": "esbenp.prettier-vscode",
        "[vue]":      { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[typescript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[javascript]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[json]":     { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[jsonc]":    { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[scss]":     { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[html]":     { "editor.defaultFormatter": "esbenp.prettier-vscode" },
        "[markdown]": { "editor.defaultFormatter": "esbenp.prettier-vscode" },

        // ESLint
        "eslint.validate": ["javascript", "typescript", "vue", "json", "jsonc"],
        "eslint.useFlatConfig": true,
        "eslint.format.enable": false,
        "eslint.run": "onType",

        // TypeScript
        "typescript.tsserver.maxTsServerMemory": 8192,
        "typescript.preferences.importModuleSpecifier": "non-relative",
        "typescript.updateImportsOnFileMove.enabled": "always",
        "typescript.suggest.autoImports": true,
        "typescript.inlayHints.parameterNames.enabled": "literals",
        "typescript.inlayHints.propertyDeclarationTypes.enabled": true,
        "javascript.updateImportsOnFileMove.enabled": "always",

        // Vue / Volar
        "vue.complete.casing.tags": "pascal",
        "vue.complete.casing.props": "camel",
        "vue.inlayHints.missingProps": true,

        // Explorer / terminal / workbench
        "explorer.confirmDragAndDrop": false,
        "explorer.compactFolders": false,
        "terminal.integrated.scrollback": 10000,
        "workbench.editor.enablePreview": false,
        "workbench.editorAssociations": {
            "*.md": "vscode.markdown.preview.editor"
        },

        // Error Lens — inline diagnostics
        "errorLens.enabledDiagnosticLevels": ["error", "warning"],
        "errorLens.excludeBySource": ["cSpell"]
    },

    "extensions": {
        "recommendations": [
            // Core — Vue / TS / lint / format
            "Vue.volar",
            "dbaeumer.vscode-eslint",
            "esbenp.prettier-vscode",
            "EditorConfig.EditorConfig",

            // Quality-of-life for AI-assisted development
            "usernamehw.errorlens",
            "yoavbls.pretty-ts-errors",
            "actboy168.tasks",

            // Nuxt UI / Tailwind / icons
            "antfu.iconify",
            "bradlc.vscode-tailwindcss",

            // Project plumbing
            "mikestead.dotenv",
            "christian-kohler.path-intellisense",
            "formulahendry.auto-rename-tag",

            // Testing
            "vitest.explorer",
            "ms-playwright.playwright",

            // Git
            "eamodio.gitlens"
        ],
        "unwantedRecommendations": [
            "octref.vetur",
            "hookyqr.beautify"
        ]
    },

    "tasks": {
        "version": "2.0.0",
        "tasks": [
            {
                "label": "Dev",
                "detail": "Start Vite dev server with HMR",
                "type": "shell",
                "command": "npm run dev",
                "isBackground": true,
                "presentation": { "panel": "dedicated", "reveal": "always" },
                "problemMatcher": []
            },
            {
                "label": "Preview",
                "detail": "Serve the production build locally",
                "type": "shell",
                "command": "npm run preview",
                "isBackground": true,
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Build",
                "detail": "Build for production",
                "type": "shell",
                "command": "npm run build",
                "group": "build",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Type Check",
                "detail": "Run vue-tsc in no-emit mode",
                "type": "shell",
                "command": "npx vue-tsc --noEmit",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": ["$tsc"]
            },
            {
                "label": "Lint",
                "detail": "Run ESLint on all source files",
                "type": "shell",
                "command": "npx eslint .",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": ["$eslint-stylish"]
            },
            {
                "label": "Lint: Fix",
                "detail": "Run ESLint with autofix",
                "type": "shell",
                "command": "npx eslint . --fix",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Test",
                "detail": "Run Vitest once",
                "type": "shell",
                "command": "npx vitest run",
                "group": "test",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Test: Watch",
                "detail": "Run Vitest in watch mode",
                "type": "shell",
                "command": "npx vitest",
                "isBackground": true,
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Test: UI",
                "detail": "Open Vitest interactive UI",
                "type": "shell",
                "command": "npx vitest --ui",
                "isBackground": true,
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "E2E",
                "detail": "Run Playwright end-to-end tests",
                "type": "shell",
                "command": "npx playwright test",
                "group": "test",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "E2E: UI",
                "detail": "Open Playwright UI mode",
                "type": "shell",
                "command": "npx playwright test --ui",
                "isBackground": true,
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Install",
                "detail": "Install dependencies",
                "type": "shell",
                "command": "npm install",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            },
            {
                "label": "Clean",
                "detail": "Remove node_modules, dist, coverage, caches",
                "type": "shell",
                "command": "npx rimraf node_modules dist coverage .vite playwright-report test-results",
                "presentation": { "panel": "dedicated" },
                "problemMatcher": []
            }
        ]
    }
}
```

### Extensions — why each one is here

| Extension | Why it matters for AI-assisted coding |
|-----------|----------------------------------------|
| `Vue.volar` | Official Vue 3 language support (TS in SFCs, refactors, go-to-definition) |
| `dbaeumer.vscode-eslint` | Runs ESLint as you type; powers auto-fix-on-save |
| `esbenp.prettier-vscode` | Formatter. Works together with ESLint via `codeActionsOnSave` |
| `EditorConfig.EditorConfig` | Enforces `.editorconfig` across any editor, even if settings drift |
| `usernamehw.errorlens` | **Critical** — inlines errors/warnings next to the code. No need to hover; the user sees the problem immediately |
| `yoavbls.pretty-ts-errors` | Turns TS's cryptic error dumps into readable messages. Non-negotiable for non-programmers |
| `actboy168.tasks` | Shows workspace tasks in the status bar — one click to run Dev / Lint / Test |
| `antfu.iconify` | Renders Iconify icon names (`i-material-symbols:home`) inline. Matches our icon stack |
| `bradlc.vscode-tailwindcss` | Nuxt UI uses Tailwind tokens under the hood — autocomplete for utility classes |
| `mikestead.dotenv` | Syntax highlighting for `.env` files |
| `christian-kohler.path-intellisense` | Autocomplete for file paths in imports |
| `formulahendry.auto-rename-tag` | Renames paired HTML/Vue tags in sync |
| `vitest.explorer` | Run unit tests from a sidebar tree; see pass/fail visually |
| `ms-playwright.playwright` | Run E2E tests with the same UX |
| `eamodio.gitlens` | Inline git blame and history — helpful when reviewing AI-generated changes |
