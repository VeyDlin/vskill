---
name: add-page
description: Use when adding a new route — a URL the user can navigate to that renders a top-level view (e.g. `/users`, `/users/:id`, `/settings/profile`, `/auth/login`). Covers view file placement, route registration with lazy imports, layout wiring via `meta.layout`, global auth guards, and named-route linking. Do NOT use for embedded UI fragments (use `add-component`), modals (use `UModal`), or tab panes (use `UTabs`). Triggers: "add a page", "new route", "/users detail page", "login page".
---

# Add a Page (Route)

**When to use:** Adding a new route — a URL the user can navigate to that renders a top-level view. Typical examples: `/users`, `/users/:id`, `/settings/profile`, `/auth/login`.

**Do not use this skill for:**
- A reusable chunk of UI embedded inside another page — see `add-component` skill.
- A route-less modal or drawer — use `UModal` / `USlideover` inside the parent view.
- Dynamic panes controlled by tab state — use `UTabs` inside a single view instead of multiple routes.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- `vue-router` is installed and the router is created in `src/router/index.ts` and registered in `src/main.ts` via `app.use(router)`.
- `src/views/` and `src/layouts/` exist.
- The alias `@/` → `src/` is configured.
- For auth-gated pages: an auth store / token source exists (see `add-store` skill).

---

## Steps

Throughout, substitute your real page name. Keep the casing:

| Aspect | Example (list) | Example (detail) |
|--------|----------------|------------------|
| Route path | `/users` | `/users/:id` |
| Route name | `"users"` | `"user-detail"` |
| View name | `UsersView` (always `*View`, PascalCase) | `UserDetailView` |
| File name | `UsersView.vue` | `UserDetailView.vue` |
| Folder | `src/views/users/` | `src/views/users/` |

### 1. Decide: does this page need a new feature folder?

- If this is the **first** page of a new feature (e.g. first `users` page), create `src/views/users/` *and* `src/components/users/` (the feature's component folder, even if empty initially).
- If the feature already has views, add the new view file alongside the existing ones.

Do **not** dump every view into `src/views/` flat — group by feature. A flat `views/` folder becomes unreadable around 8+ pages.

### 2. Write the view

Path: `src/views/users/UsersView.vue`

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useUsers, useDeleteUser } from "@/composables/useUsers";
import UserCard from "@/components/users/UserCard.vue";

const search = ref("");
const { data: users, isLoading, isError, error } = useUsers(() => ({
    search: search.value
}));
const deleteMutation = useDeleteUser();

function handleRemove(id: number): void {
    deleteMutation.mutate(id);
}
</script>

<template>
    <div class="users-view">
        <header class="users-view__header">
            <h1 class="users-view__title">Users</h1>
            <UInput
                v-model="search"
                icon="i-material-symbols:search"
                placeholder="Search users"
            />
        </header>

        <div v-if="isLoading" class="users-view__state">
            <USkeleton v-for="n in 6" :key="n" class="h-20" />
        </div>

        <UAlert
            v-else-if="isError"
            color="error"
            :title="error?.message ?? 'Failed to load users'"
            icon="i-material-symbols:error-outline"
        />

        <UEmptyState
            v-else-if="!users?.length"
            icon="i-material-symbols:group-off-outline"
            title="No users"
            description="Nothing matches your search."
        />

        <div v-else class="users-view__grid">
            <UserCard
                v-for="user in users"
                :key="user.id"
                :user="user"
                @remove="handleRemove"
            />
        </div>
    </div>
</template>

<style scoped lang="scss">
.users-view {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
    padding: 2rem;

    &__header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 1rem;
    }

    &__title {
        font-size: 1.5rem;
        font-weight: 700;
        color: var(--ui-text);
    }

    &__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }

    &__state {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
        gap: 1rem;
    }
}
</style>
```

Rules:

- **Every view file is named `*View.vue`** to distinguish at a glance from reusable components.
- **Views use composables for data** (`useUsers(...)`) — never call `apiClient` directly from a view.
- **Four render branches are mandatory** for any view that loads data: loading, error, empty, populated. Missing any one leaves the user staring at a blank screen in production.
- **State is local** unless it must survive route navigation. `search` here is a plain `ref` — it resets on leaving the page, which is usually correct. If it must persist, lift to a Pinia store (`add-store` skill) or a query param.
- **Layout is composed around the view, not inside it** — see step 4. A view's template does not render `<AppHeader>`, `<AppSidebar>`, etc.

### 3. Register the route

Path: `src/router/index.ts`

Add the route to the `routes` array. Use **lazy imports** (`() => import(...)`) for every page except the landing page — this enables Vite to split the bundle per route.

```typescript
import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
    {
        path: "/",
        name: "home",
        component: () => import("@/views/HomeView.vue"),
        meta: { layout: "default" }
    },
    {
        path: "/users",
        name: "users",
        component: () => import("@/views/users/UsersView.vue"),
        meta: { layout: "default", requiresAuth: true }
    },
    {
        path: "/users/:id(\\d+)",
        name: "user-detail",
        component: () => import("@/views/users/UserDetailView.vue"),
        meta: { layout: "default", requiresAuth: true },
        props: (route) => ({ id: Number(route.params.id) })
    },
    {
        path: "/auth/login",
        name: "login",
        component: () => import("@/views/auth/LoginView.vue"),
        meta: { layout: "auth" }
    },
    {
        path: "/:pathMatch(.*)*",
        name: "not-found",
        component: () => import("@/views/NotFoundView.vue"),
        meta: { layout: "default" }
    }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

export default router;
```

Rules:

- **Every route has a `name`.** Programmatic navigation always uses `router.push({ name: "user-detail", params: { id: 42 } })`, never `router.push("/users/42")`. Paths can change; names shouldn't.
- **Dynamic params have a regex** (`:id(\\d+)`) when the shape is known. Prevents `/users/foo` from matching a numeric route and blowing up downstream.
- **Dynamic params are passed as props** (`props: (route) => ({ id: Number(route.params.id) })`) so the view receives a typed number, not a string from the URL.
- **`meta.layout`** names the layout to wrap the view — see step 4.
- **`meta.requiresAuth: true`** is the guard flag — see step 5.
- **Catch-all `/:pathMatch(.*)*` is last** and renders a 404 view. Without it, unknown URLs render the last-matched route silently.

### 4. Wrap with a layout

Layouts are thin components in `src/layouts/` that render page chrome (header, sidebar, footer) with a `<slot />` where the view goes.

Path: `src/App.vue`

```vue
<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import DefaultLayout from "@/layouts/DefaultLayout.vue";
import AuthLayout from "@/layouts/AuthLayout.vue";

const route = useRoute();

const layout = computed(() => {
    switch (route.meta.layout) {
        case "auth":
            return AuthLayout;
        default:
            return DefaultLayout;
    }
});
</script>

<template>
    <component :is="layout">
        <RouterView />
    </component>
</template>
```

Path: `src/layouts/DefaultLayout.vue`

```vue
<script setup lang="ts">
import AppHeader from "@/components/common/AppHeader.vue";
import AppFooter from "@/components/common/AppFooter.vue";
</script>

<template>
    <div class="default-layout">
        <AppHeader />
        <main class="default-layout__main">
            <slot />
        </main>
        <AppFooter />
    </div>
</template>

<style scoped lang="scss">
.default-layout {
    display: grid;
    grid-template-rows: auto 1fr auto;
    min-height: 100vh;

    &__main {
        min-width: 0;
    }
}
</style>
```

Rules:

- **Layouts are switched by `meta.layout`**, not by nested routes. Nested routes work too, but add complexity you rarely need.
- **Layouts contain no data fetching.** They are pure chrome. If `AppHeader` needs the current user, it reads a composable itself — the layout does not pass data through.
- **Exactly one `<slot />`** in a layout (or named slots if you really need multiple regions, but default-slot-only is the norm).

### 5. Add auth / role guards (if needed)

If any route sets `meta.requiresAuth: true`, install a **single global guard** in `src/router/index.ts`:

```typescript
import { useAuthStore } from "@/stores/auth.store";

router.beforeEach((to) => {
    const auth = useAuthStore();
    if (to.meta.requiresAuth && !auth.isAuthenticated) {
        return { name: "login", query: { redirect: to.fullPath } };
    }
});
```

Rules:

- **One guard, not many.** Route-local `beforeEnter` hooks scatter the logic and make "can this user reach this page?" impossible to answer.
- **Redirect to login with `redirect` query param.** The login view reads it and bounces the user back after success.
- **Guard the store's hydration.** If `isAuthenticated` depends on state persisted in localStorage, make sure the auth store hydrates **before** the guard runs. With `pinia-plugin-persistedstate`, this happens automatically.

### 6. Link to the page

From other views / components, link with `<RouterLink>` using the route **name**, never a hardcoded path:

```vue
<template>
    <RouterLink :to="{ name: 'user-detail', params: { id: user.id } }">
        View details
    </RouterLink>
</template>
```

For Nuxt UI components with a `to` prop (`UButton`, `UChip`, etc.), pass the same named-route object — Nuxt UI renders a `<RouterLink>` automatically:

```vue
<UButton :to="{ name: 'users' }" icon="i-material-symbols:group-outline">
    Users
</UButton>
```

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. Navigate to the new route in the browser. Confirm:
   - The URL matches the registered path.
   - The correct layout wraps the view (header / sidebar visible where expected).
   - All four render states work: loading (throttle network in DevTools), error (break the endpoint), empty (filter with no matches), populated.
3. Refresh the page — confirm it still loads (catches SPA fallback misconfigurations).
4. For auth-gated routes: log out, try to navigate. Confirm the guard redirects to `/auth/login?redirect=...`.
5. Hit an unknown URL (e.g. `/nonsense`). Confirm the 404 catch-all renders, not a blank page.
6. Open DevTools → Network. Confirm the view's bundle is loaded lazily as a separate chunk (you'll see a JS file whose name matches the view).

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Hardcoding paths in `router.push("/users/42")` | Refactors break every call site | `router.push({ name: "user-detail", params: { id: 42 } })` |
| Eager imports (`import UsersView from "..."` at the top) | Ships every view in the initial bundle | `component: () => import("@/views/users/UsersView.vue")` |
| Missing loading / error / empty branches | Users see blank screens on slow networks or errors | Always render all four states |
| No 404 catch-all route | Unknown URLs silently render the last match | Add `/:pathMatch(.*)*` last in the routes array |
| `:id` without a regex constraint | Non-numeric URLs crash the detail view | `:id(\\d+)` (or appropriate pattern) |
| Extracting `route.params.id` inside every view | Duplicated coercion; easy to forget `Number(...)` | Use `props: (route) => ({ id: Number(route.params.id) })` and a typed prop |
| Route-local `beforeEnter` guards for auth | Scatters auth rules; hard to audit | One global `beforeEach` reading `meta.requiresAuth` |
| Using `meta.layout` **and** nested-route layouts | Two competing systems; confusing output | Pick one — `meta.layout` is simpler |
| View imports `AppHeader` / `AppSidebar` directly | Duplicates chrome on every page; inconsistent | Layout renders chrome; view renders content |
| Pinia store used for pagination state of a single view | Overkill; pollutes global store space | Local `ref` in the view, or sync to `route.query` |
| `window.location.href = ...` to navigate | Full page reload; loses app state | `router.push(...)` |
| `<RouterView />` used twice in the app | Two views render for the same route | Exactly one `<RouterView />` at the top level |
