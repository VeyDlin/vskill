---
name: add-store
description: Use when adding a Pinia store for client-only state — UI state, session flags, user preferences, anything that lives in the browser and is NOT a server resource (e.g. current user after login, theme, sidebar collapsed state, in-progress wizard). Covers state/getters/actions in Composition-API style, optional `pinia-plugin-persistedstate` with `pick` allow-list, and safe consumption via `storeToRefs`. Do NOT use for server data (use vue-query via `add-api-endpoint`), view-local state (use `ref`), or derived server data (use `computed`). Triggers: "add a store", "Pinia store for auth", "theme store".
---

# Add a Pinia Store (Client State)

**When to use:** Adding a Pinia store for **client-only state** — UI state, session flags, user preferences, anything that lives in the browser and is *not* a server resource. Typical examples: the current user after login, theme preference, sidebar collapsed state, an in-progress wizard.

**Do not use:**
- For **server data** (lists, detail objects, anything that comes from an API) — that belongs in a vue-query composable. See `add-api-endpoint` skill. Mirroring server data into a Pinia store creates two sources of truth and is the single most common architectural mistake AI makes.
- For state that is local to one view or one component — use `ref` / `reactive` inside `<script setup>`.
- For cross-component state that is **derived** from server data — use `computed` on top of a vue-query result, not a store.

If in doubt, ask: *"Does this state come from the server?"* If yes → vue-query, not Pinia.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- `pinia` is installed and registered in `src/main.ts` via `app.use(createPinia())`.
- `pinia-plugin-persistedstate` is installed and registered **only if** this store needs to persist across reloads.
- The alias `@/` → `src/` is configured in `vite.config.ts` and `tsconfig.json`.

If any of these is missing, stop and set it up first — see the `stack-reference` skill §State Management — Pinia.

---

## Steps

Throughout, substitute your real store name. Keep the casing:

| Aspect | Example |
|--------|---------|
| Store id | `"auth"` (singular, camelCase) |
| File name | `auth.store.ts` |
| Composable name | `useAuthStore` (Pinia convention, always `use*Store`) |
| File path | `src/stores/auth.store.ts` |

### 1. Decide what lives in the store

Before writing anything, list the state you intend to put in the store and mark each item:

- **C** — pure client state (session flags, UI state, preferences) → **goes in the store**
- **S** — server data (user profile, lists, etc.) → **does NOT go in the store; use a vue-query composable**
- **D** — derived from C or S → **`computed` in the store (if from C) or in the view (if from S)**

Only the **C** and **D(from C)** items belong in the store. If you're left with only S items, you do not need a store — delete this skill from your plan and use vue-query directly.

### 2. Create the store

Path: `src/stores/auth.store.ts`

Use the **Composition API style** (`defineStore("id", () => { ... })`). Never use the options-API style (`defineStore("id", { state, getters, actions })`) — the two styles don't mix well and the Composition API is the project convention.

```typescript
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { authApi } from "@/api";
import type { LoginRequest } from "@/types/api/auth";

export const useAuthStore = defineStore("auth", () => {
    // --- State (refs) ---
    // Keep it minimal. Only *client* state — no server lists, no caches that vue-query already owns.
    const accessToken = ref<string | null>(localStorage.getItem("access_token"));
    const currentUserId = ref<number | null>(null);

    // --- Getters (computed) ---
    const isAuthenticated = computed(() => accessToken.value !== null);

    // --- Actions (functions) ---
    async function login(credentials: LoginRequest): Promise<void> {
        const response = await authApi.login(credentials);
        accessToken.value = response.token;
        currentUserId.value = response.userId;
        localStorage.setItem("access_token", response.token);
    }

    function logout(): void {
        accessToken.value = null;
        currentUserId.value = null;
        localStorage.removeItem("access_token");
    }

    return {
        // State
        accessToken,
        currentUserId,
        // Getters
        isAuthenticated,
        // Actions
        login,
        logout
    };
});
```

Rules:

- The store id (`"auth"`) is globally unique across the whole project. Conflicts = silent store-sharing bugs.
- Export one hook per file, named `use{Name}Store`. Never export more than one store from the same file.
- Return **every** piece of state, every getter, and every action you want callers to use. Anything not returned is unreachable from outside.
- No API calls directly inside `ref` initialisers. Initial values come from `localStorage`, constants, or `null`.
- Actions can call API classes (`authApi.login(...)`), but the store itself is not a place to cache server data returned by those calls — persist only what is strictly client state (e.g. the token, not the full user object, unless the user object is genuinely client-only).

### 3. (Optional) Enable persistence

Only add persistence when the state genuinely needs to survive a page reload — typical triggers: auth token, theme, language, dismissed-once UI banners. Skip for ephemeral wizard state.

Ensure `pinia-plugin-persistedstate` is registered in `src/main.ts`:

```typescript
import { createPinia } from "pinia";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);
app.use(pinia);
```

Then opt the store in, and explicitly whitelist which keys persist — **never persist the entire store**:

```typescript
export const useAuthStore = defineStore("auth", () => {
    // ... state, getters, actions as before
}, {
    persist: {
        key: "auth",
        storage: localStorage,
        pick: ["accessToken", "currentUserId"]
    }
});
```

Rules:

- Use `pick` (an allow-list) rather than `omit` (a deny-list). When a new field is added later, a deny-list would silently leak it; an allow-list fails closed.
- Never persist computed properties — they'll be recomputed on load anyway, and persisted values would go stale.
- Never persist tokens you could fetch from a cookie or the server on demand. If you already have a secure cookie, don't duplicate it into localStorage.

### 4. Consume in a component

```vue
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useAuthStore } from "@/stores/auth.store";

const authStore = useAuthStore();

// Unwrap reactive state/getters with `storeToRefs`.
// Actions stay on the store instance — do NOT destructure them through storeToRefs.
const { isAuthenticated, currentUserId } = storeToRefs(authStore);
const { login, logout } = authStore;
</script>

<template>
    <div v-if="isAuthenticated">
        User #{{ currentUserId }}
        <UButton icon="i-material-symbols:logout" @click="logout">Log out</UButton>
    </div>
</template>
```

Rules:

- Always use `storeToRefs` to destructure **state and getters**. Plain destructuring breaks reactivity.
- Actions are plain functions — destructure them directly from the store instance, NOT through `storeToRefs`.
- Never write `authStore.accessToken.value = ...` from a component. Mutate state **only through actions**, so the store stays the single place where state transitions live.

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. Install `@vue/devtools` (or use the browser extension) and confirm the store appears in the Pinia tab with the expected state shape.
3. Dispatch an action from a view and confirm the store updates in devtools.
4. If persistence is enabled: trigger the action, reload the page, confirm the picked keys are restored and non-picked keys are reset.
5. In devtools, confirm there is **no duplication** between what's in the store and what's in vue-query's cache. If you see the same user list in both places, remove it from the store.

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Caching server data (user lists, posts, etc.) in the store | Two sources of truth; mutations in one don't invalidate the other | Use a vue-query composable (`add-api-endpoint` skill); keep Pinia for client state only |
| Destructuring state without `storeToRefs` | Loses reactivity — templates stop updating | `const { foo } = storeToRefs(store)` for state/getters |
| Destructuring actions *through* `storeToRefs` | `this` binding breaks for some store shapes | Destructure actions directly from the store instance |
| Using the options-API style (`{ state, getters, actions }`) | Mixes with the project's Composition-API style inconsistently | Always `defineStore("id", () => { ... })` |
| Mutating state from a component (`store.x = 1`) | State transitions are now scattered; debugging gets much harder | Add an action; mutate inside the action only |
| Calling `useAuthStore()` at module top-level (outside setup/composable) | Pinia may not be installed yet → runtime crash | Call it inside `<script setup>`, a composable, or an action |
| Persisting the whole store (`persist: true`) | Future fields silently leak to localStorage | Explicit `pick: [...]` allow-list |
| Reading `ref.value` inside a getter | Getters auto-unwrap — doing `.value.value` throws | Inside `computed()`: use `ref.value`. Consumers get the unwrapped value. |
| Same store id used twice (`"auth"` in two files) | Pinia silently merges them — bugs surface only in production | Store id is globally unique; grep for duplicates before committing |
| Initialising state with `await authApi.me()` | Module-eval errors; blocks app startup | Initial state is synchronous; hydrate via an action called from a route guard or `App.vue` `onMounted` |
| Creating a store "just in case" with empty state | Dead code that future AI will fill with server data | Delete it. Add the store only when there is actual client state to hold. |
