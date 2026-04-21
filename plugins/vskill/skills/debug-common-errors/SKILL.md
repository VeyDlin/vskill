---
name: debug-common-errors
description: Use when the user reports an error in a Vue 3 / Nuxt UI project — TypeScript compile error, ESLint failure, Vite build failure, dev-server runtime error, browser console error, vue-query cache anomaly, reactivity gotcha, component-wiring mismatch, or router misbehaviour. Look up the symptom here BEFORE guessing; each entry pairs the root cause with the single right fix. Never silence with `@ts-ignore`, `eslint-disable`, `--no-verify`, or `as any`. Triggers: "getting this error", "build fails", "TS error X", "data doesn't refresh", "route doesn't navigate".
---

# Debug Common Errors

**When to use:** The user reports an error (TypeScript, ESLint, Vite build, dev-server runtime, browser console, vue-query cache). Look up the symptom here **before** guessing. Each entry says what the error means and the *one* right fix — do not improvise workarounds.

**General rule:** when a check fails, read the message, fix the **root cause**. Never silence with `@ts-ignore`, `eslint-disable`, `--no-verify`, or `as any`. If the fix seems too big for the task, stop and ask the user.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Triage — where is the error coming from?

| Symptom | Most likely source | Jump to |
|---------|-------------------|---------|
| Red squiggle in editor, nothing in terminal | TS language server | [TypeScript errors](#typescript-errors) |
| `vue-tsc --noEmit` fails in CI or pre-commit | TS compiler | [TypeScript errors](#typescript-errors) |
| `npm run lint` fails | ESLint | [ESLint errors](#eslint-errors) |
| `npm run build` fails | Vite + Rollup | [Build errors](#build-errors) |
| Browser console shows an error; app runs but breaks | Runtime | [Runtime errors](#runtime-errors) |
| Data doesn't refresh after a mutation / appears duplicated | vue-query cache | [vue-query cache issues](#vue-query-cache-issues) |
| Ref update doesn't trigger a rerender | Reactivity | [Reactivity gotchas](#reactivity-gotchas) |
| Component shows but props are `undefined` / wrong | Props / model | [Component wiring](#component-wiring) |
| Route navigation doesn't work / wrong component | Router | [Router issues](#router-issues) |

If the error isn't here, do not guess. Search the exact error text, then ask the user.

---

## TypeScript errors

### `Cannot find module "@/..." or its corresponding type declarations`

**Cause:** Path alias not configured on both sides (Vite + TS).

**Fix:** Both files below must agree on the alias. Do not use only one.

`vite.config.ts`:
```typescript
import { fileURLToPath, URL } from "node:url";
resolve: {
    alias: {
        "@": fileURLToPath(new URL("./src", import.meta.url))
    }
}
```

`tsconfig.json`:
```json
{
    "compilerOptions": {
        "baseUrl": ".",
        "paths": {
            "@/*": ["src/*"]
        }
    }
}
```

After editing, **restart the TS server** (`Ctrl+Shift+P → TypeScript: Restart TS Server`). VS Code caches `tsconfig`.

### `Property 'xxx' does not exist on type 'never'` / `'undefined'`

**Cause:** You're reading a property from a value that TS has narrowed to `never` or `undefined`, usually after an optional chain or a check that guarantees the opposite.

**Fix:** Read the branch TS thinks you're in. Add an explicit guard:
```typescript
if (!user) {
    return;
}
user.name; // now safe
```
Never cast away with `as User`.

### `Type 'X | undefined' is not assignable to type 'X'`

**Cause:** A value might be undefined where you need it defined. Typical around `params.id` from `route.params`, destructured defaults, or optional props.

**Fix (pick by context):**
- Provide a default: `const id = props.id ?? 0`.
- Narrow before use: `if (id === undefined) return; …`.
- For route params: use `props: (route) => ({ id: Number(route.params.id) })` in the router (see `add-page` skill).

### `Object is possibly 'null'` after `document.querySelector`

**Cause:** DOM queries may return `null`.

**Fix:** Use a template ref instead (typed, checked):
```vue
<script setup lang="ts">
import { ref, onMounted } from "vue";
const root = ref<HTMLDivElement | null>(null);
onMounted(() => {
    root.value?.focus();
});
</script>
<template>
    <div ref="root" tabindex="-1" />
</template>
```

### `'xxx' refers to a value, but is being used as a type here`

**Cause:** Missing `type` import. With `verbatimModuleSyntax: true` (the project default), value imports and type imports are strict.

**Fix:** Split the import:
```typescript
import { usersApi } from "@/api";
import type { User, CreateUserRequest } from "@/types/api/users";
```

### `No overload matches this call` on a Nuxt UI component

**Cause:** Nuxt UI's props are heavily typed; passing an extra / misspelt prop breaks the overload.

**Fix:** Hover the component name in VS Code → read the actual prop signature, or run `mcp__nuxt-ui-remote__get-component-metadata`. Fix the prop. Never `(UButton as any)`.

---

## ESLint errors

### `Parsing error: Unexpected token` on a `.vue` file

**Cause:** `@antfu/eslint-config` expects `lang="ts"` on `<script>` blocks; plain `<script>` with TS syntax fails the parser.

**Fix:** `<script setup lang="ts">`. Always.

### `'xxx' is assigned a value but never used` (`no-unused-vars`)

**Cause:** Dead code.

**Fix:** Delete it. If it's a destructured param you're forced to accept: name it `_` (the rule's underscore-prefix exemption), but this is rare — usually the variable is genuinely dead.

**Do NOT** silence with `// eslint-disable-next-line`.

### `Prefer const over let` (`prefer-const`)

**Cause:** A `let` that's never reassigned.

**Fix:** Change to `const`. If it *was* meant to be reassigned, add the reassignment or delete the dead code — don't leave a `let` with no reassignment.

### `Expected indentation of X spaces` or `Extra semicolon` — Prettier vs ESLint conflict

**Cause:** Something overrode the antfu stylistic settings, or a rogue `.prettierrc` is fighting `@antfu/eslint-config`.

**Fix:** Both tools must agree:
- `.prettierrc.json` matches the project's stylistic config (tab width 4, double quotes, semi true).
- `eslint.config.ts` keeps the antfu stylistic overrides: `{ indent: 4, quotes: "double", semi: true }`.
- Run `npm run lint -- --fix`. If conflicts persist, open the failing file and check whether two formatters are fighting (VS Code → output panel).

---

## Build errors

### `Rollup failed to resolve import "@xyz"` during `npm run build`

**Cause:** Package is used in code but not in `dependencies`. `dev` worked because Vite's dev server is lenient.

**Fix:**
```bash
npm install xyz
```
Commit the updated `package.json` + `package-lock.json`.

Do **not** add it to `build.rollupOptions.external` — that moves the problem to runtime.

### `[vite]: Rollup failed: Cannot use "import.meta" outside a module`

**Cause:** A `.js` file is not being treated as ESM, usually because it lives outside `src/` and package `type` is `"commonjs"` (or missing).

**Fix:** Add `"type": "module"` to `package.json`, or rename the file to `.mjs`, or move it under `src/` so Vite picks it up.

### `The requested module does not provide an export named 'default'`

**Cause:** Importing a default export from a module that only has named exports, or vice versa.

**Fix:** Read the module's exports. `import { foo } from "pkg"` vs `import foo from "pkg"` are not interchangeable. For CJS interop with `esModuleInterop: true`, `import foo from "pkg"` works; otherwise use `import * as foo from "pkg"`.

### Build succeeds locally, fails in CI with "out of memory"

**Cause:** CI has less RAM than your machine; `vue-tsc` is expensive.

**Fix:** In `package.json`:
```json
"scripts": {
    "build": "vue-tsc --noEmit && vite build",
    "type-check": "vue-tsc --noEmit --composite false"
}
```
If still OOMing, split: run `type-check` in one CI job, `vite build` in another.

Do **not** skip the type check in CI to make it pass.

---

## Runtime errors

### `Uncaught (in promise) TypeError: Cannot read properties of undefined (reading '...')`

**Cause:** Reading a property on data that hasn't arrived yet. Typical in a view that renders `user.name` before `useUser(...)` resolves.

**Fix:** Render a loading state for every async read:
```vue
<template>
    <USkeleton v-if="isLoading" />
    <UAlert v-else-if="isError" color="error" :title="error?.message" />
    <div v-else-if="user">{{ user.name }}</div>
</template>
```
The `v-else-if="user"` guard gives TS and runtime the narrow they need.

### `[Vue warn]: Extraneous non-emits event listeners (foo) were passed to component`

**Cause:** A parent uses `@foo="..."` but the child doesn't declare `foo` in `defineEmits`.

**Fix:** Add the event to the child's `defineEmits<{...}>`, or remove the listener on the parent.

### `[Vue warn]: Missing required prop: "xxx"`

**Cause:** Parent didn't pass the prop. If the prop really is required, the parent has a bug. If it's not, make it optional with `withDefaults`.

### `Toast is not provided` / `useToast is undefined`

**Cause:** Nuxt UI plugin isn't installed, or `<UApp>` doesn't wrap the app.

**Fix:** In `src/App.vue`, wrap everything in `<UApp>`:
```vue
<template>
    <UApp>
        <RouterView />
    </UApp>
</template>
```
And in `src/main.ts`: `app.use(uiPlugin)` from `@nuxt/ui/vue-plugin`.

---

## vue-query cache issues

### Mutation succeeds but the list doesn't refresh

**Cause:** `onSuccess` doesn't invalidate the right query key.

**Fix:** In the composable (see `add-api-endpoint` skill), every mutation pairs with `invalidateQueries({ queryKey: usersKeys.lists() })`. For updates, also invalidate the specific detail:
```typescript
qc.invalidateQueries({ queryKey: usersKeys.lists() });
qc.invalidateQueries({ queryKey: usersKeys.detail(updated.id) });
```

### Invalidation fires but nothing refetches

**Cause:** The invalidated key doesn't match the active query key. Typically the composable was called with different params than the factory expects.

**Fix:** Log both:
```typescript
console.log("invalidating", usersKeys.lists());
console.log("active", qc.getQueryCache().getAll().map(q => q.queryKey));
```
Make sure they share the same prefix. Remove the logs before committing.

### `useQuery` doesn't refetch when a ref changes

**Cause:** The query key is not reactive. Static arrays don't re-evaluate.

**Fix:** Wrap the key in `computed`:
```typescript
useQuery({
    queryKey: computed(() => usersKeys.list(toValue(params))),
    queryFn: () => usersApi.getAll(toValue(params))
});
```

### `data` is `undefined` even though the network call succeeded

**Cause:** Accessing `.data` without `.value` on a `Ref` — or mistaking the initial undefined state for a bug.

**Fix:**
- In `<script>`: `data.value?.name` — `data` is `Ref<T | undefined>`.
- `undefined` on first render is normal; render a loading state.

---

## Reactivity gotchas

### Destructured store / composable loses reactivity

**Cause:** Plain destructuring breaks the proxy.

**Fix:** `storeToRefs` for Pinia state / getters. For composables returning refs, destructure the refs *themselves*, not `.value`:
```typescript
const { data, isLoading } = useUsers();      // both are Refs — fine
const { data: { value } } = useUsers();      // WRONG — you captured a snapshot
```

### Changing an array element doesn't trigger a rerender

**Cause:** Direct index assignment (`arr[0] = x`) doesn't notify dependents on some array shapes in old reactivity; always fine with Vue 3 proxy but surprises in edge cases (e.g. sparse arrays).

**Fix:** Use `splice` or rebuild: `arr.splice(0, 1, x)` or `arr = [x, ...arr.slice(1)]`.

### `reactive` object becomes "unreactive" after reassignment

**Cause:** `state = { ... }` replaces the proxy reference; watchers were bound to the old one.

**Fix:** Mutate properties instead (`state.foo = bar`) or use a `ref<Obj>` and assign `state.value = { ... }`.

---

## Component wiring

### `defineModel` doesn't update the parent

**Cause:** Parent uses `:modelValue` + `@update:modelValue` instead of `v-model`, or the child uses a `ref` bound to `.value` instead of `defineModel`.

**Fix:** Parent: `v-model="foo"`. Child: `const foo = defineModel<string>()` + template binding `v-model="foo"` on the inner input.

### Event handler receives `MouseEvent` instead of the emitted payload

**Cause:** You wrote `@click="handleRemove"` on a component that emits `remove`, but the attribute should be `@remove`.

**Fix:** Parent binds to the *emitted* event name (`@remove="..."`), not DOM events, when the child declares them.

---

## Router issues

### `RouterLink` renders but clicking doesn't navigate

**Cause:** You're inside a component that suppresses navigation (prevents default on click), or the path is outside the app (missing leading `/`).

**Fix:** Always use named routes: `:to="{ name: 'user-detail', params: { id } }"`. Check nothing calls `event.preventDefault()` on the wrapping element.

### `This page doesn't exist` on browser refresh of `/users/42`

**Cause:** The web server doesn't serve `index.html` for unknown paths (SPA fallback). Common in local static previews and some hosts.

**Fix:** Configure SPA fallback:
- Vite dev — works by default.
- Static hosts (Netlify, Vercel) — add a redirect from `/*` to `/index.html` (200).
- Custom nginx — `try_files $uri /index.html;`.

### Guard infinitely redirects

**Cause:** `beforeEach` redirects to `/auth/login`, but `/auth/login` also requires auth.

**Fix:** Check `meta.requiresAuth` explicitly; public routes have no meta:
```typescript
if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: "login", query: { redirect: to.fullPath } };
}
```
The login route does **not** set `requiresAuth: true`.

---

## Last resort — when nothing here matches

1. Copy the full error message (not a paraphrase) into the conversation.
2. List what you tried and what changed.
3. **Stop writing code** and ask the user. Do not silence the error to make the task look done.

Silencing (`@ts-ignore`, `eslint-disable`, `catch {}`, `--no-verify`) always makes the bug land in production. The pre-commit hook exists to catch this. Respect it.
