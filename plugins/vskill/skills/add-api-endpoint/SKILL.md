---
name: add-api-endpoint
description: Use when adding a REST resource to the Vue app — something with a URL path, request/response types, and one or more CRUD operations. Creates domain types (`types/api/{feature}.ts`), an API class (`api/{feature}.api.ts`), and vue-query composables (`composables/use{Feature}.ts`) with a query-key factory. Do NOT use for one-off side calls (e.g. `/health`) or streaming endpoints. Triggers: "add API for users", "wire up the posts endpoint", "I need CRUD for X".
---

# Add an API Endpoint (Resource)

**When to use:** Adding a REST resource — something with a URL path, request/response types, and one or more CRUD operations, which the UI will read and/or mutate.

**Do not use:**
- For a one-off side call that doesn't represent a resource (e.g. `/health`, `/analytics/track`) — call `apiClient` inline at the call site with a one-line justification.
- For WebSocket / SSE / streaming endpoints — those need a different pattern; stop and ask the user.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- `api/client.ts` exists and exports `apiClient<T>(url, options?)` wrapping `ofetch`
- `src/composables/` exists
- `types/api/` exists
- `@tanstack/vue-query` is installed and `VueQueryPlugin` is wired up in `src/main.ts`

If any of these is missing, stop and set it up first — see the `stack-reference` skill §API Layer.

---

## Steps

Throughout, substitute your real resource name. Keep the casing:

| Aspect | Example |
|--------|---------|
| URL path | `/users` (plural, kebab-case) |
| Domain type | `User` (singular, PascalCase) |
| Request DTOs | `CreateUserRequest`, `UpdateUserRequest` |
| API object | `usersApi` (plural, camelCase, `.api` suffix file) |
| Composable file | `useUsers.ts` |
| Query-key factory | `usersKeys` |

### 1. Define types

Path: `src/types/api/users.ts`

```typescript
// Domain model — the resource as the server returns it.
export interface User {
    id: number;
    name: string;
    email: string;
    createdAt: string;      // ISO-8601; parse at the point of use.
}

// Request DTOs — never reuse the domain model for input.
export interface CreateUserRequest {
    name: string;
    email: string;
}

export interface UpdateUserRequest {
    name?: string;
    email?: string;
}

// Query-parameter shape, if the endpoint supports filtering / pagination.
export interface UsersListParams {
    page?: number;
    pageSize?: number;
    search?: string;
}
```

Rules:

- One file per resource. Never a mega-file of "all types".
- Request and response types are **distinct** from the domain model — the server and the client have different constraints.
- Dates and IDs stay as primitives. Do not introduce class wrappers.

### 2. (Optional) Add a Zod schema

Only add a schema when the response needs runtime validation at the boundary — typical triggers: third-party API, webhook payload, data that crosses a trust boundary. Skip for internal, controlled APIs.

Path: `src/schemas/user.schema.ts`

```typescript
import { z } from "zod";

export const userSchema = z.object({
    id: z.number().int().positive(),
    name: z.string().min(1),
    email: z.string().email(),
    createdAt: z.string().datetime()
});

export type User = z.infer<typeof userSchema>;
```

If the schema is used, **delete** the manual `interface User` from `src/types/api/users.ts` and re-export the inferred type — never maintain both in parallel.

### 3. Create the API class

Path: `src/api/users.api.ts`

```typescript
import { apiClient } from "./client";
import type {
    User,
    CreateUserRequest,
    UpdateUserRequest,
    UsersListParams
} from "@/types/api/users";

export const usersApi = {
    getAll(params?: UsersListParams): Promise<User[]> {
        return apiClient<User[]>("/users", {
            query: params
        });
    },

    getById(id: number): Promise<User> {
        return apiClient<User>(`/users/${id}`);
    },

    create(data: CreateUserRequest): Promise<User> {
        return apiClient<User>("/users", {
            method: "POST",
            body: data
        });
    },

    update(id: number, data: UpdateUserRequest): Promise<User> {
        return apiClient<User>(`/users/${id}`, {
            method: "PATCH",
            body: data
        });
    },

    delete(id: number): Promise<void> {
        return apiClient<void>(`/users/${id}`, {
            method: "DELETE"
        });
    }
};
```

Rules:

- One const object per resource. No classes, no `new`.
- Every method returns `Promise<T>`. Never `Promise<any>`.
- Transport concerns (auth header, retries, base URL, 401 handling) live **only** in `api/client.ts`. Do not duplicate them here.
- No business logic here — shape the request, pass the response through, nothing else.

### 4. Re-export from the API index

Path: `src/api/index.ts`

```typescript
export { usersApi } from "./users.api";
// ... other resources
```

Consumers always import from `@/api`, never from `@/api/users.api` directly.

### 5. Create the composable

Path: `src/composables/useUsers.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/vue-query";
import { computed, toValue, type MaybeRefOrGetter } from "vue";
import { usersApi } from "@/api";
import type {
    CreateUserRequest,
    UpdateUserRequest,
    UsersListParams
} from "@/types/api/users";

// Query-key factory — the single source of truth for every cache key
// under this resource. Prevents typo-driven cache misses.
export const usersKeys = {
    all: ["users"] as const,
    lists: () => [...usersKeys.all, "list"] as const,
    list: (params: UsersListParams | undefined) =>
        [...usersKeys.lists(), params ?? {}] as const,
    details: () => [...usersKeys.all, "detail"] as const,
    detail: (id: number) => [...usersKeys.details(), id] as const
};

// Read: list
export function useUsers(params?: MaybeRefOrGetter<UsersListParams>) {
    return useQuery({
        queryKey: computed(() => usersKeys.list(toValue(params))),
        queryFn: () => usersApi.getAll(toValue(params))
    });
}

// Read: single
export function useUser(id: MaybeRefOrGetter<number>) {
    return useQuery({
        queryKey: computed(() => usersKeys.detail(toValue(id))),
        queryFn: () => usersApi.getById(toValue(id)),
        enabled: computed(() => toValue(id) > 0)
    });
}

// Write: create
export function useCreateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (data: CreateUserRequest) => usersApi.create(data),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: usersKeys.lists() });
        }
    });
}

// Write: update
export function useUpdateUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (vars: { id: number; data: UpdateUserRequest }) =>
            usersApi.update(vars.id, vars.data),
        onSuccess: (updated) => {
            qc.invalidateQueries({ queryKey: usersKeys.lists() });
            qc.invalidateQueries({ queryKey: usersKeys.detail(updated.id) });
        }
    });
}

// Write: delete
export function useDeleteUser() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (id: number) => usersApi.delete(id),
        onSuccess: (_, id) => {
            qc.invalidateQueries({ queryKey: usersKeys.lists() });
            qc.removeQueries({ queryKey: usersKeys.detail(id) });
        }
    });
}
```

Rules:

- One composable file per resource, exporting one hook per operation.
- Query-key factory at the top. **Never** write `queryKey: ["users", ...]` inline — always reference `usersKeys.xxx()`.
- Parameters accept `MaybeRefOrGetter<T>` so views can pass refs / computeds / getters. Unwrap inside with `toValue()`.
- After every mutation, invalidate the **right** keys:
  - `create` and `delete` → invalidate the list
  - `update` → invalidate the list **and** the specific detail
  - `delete` → also `removeQueries` for the detail (dead cache entry otherwise)
- The composable does not do error handling beyond what vue-query already provides (`error`, `isError`). UI decides how to render errors.

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. In a view that consumes the composable, open DevTools → Network. Confirm:
   - One GET to the expected URL (`/users`, `/users/42`) per query, cached afterwards.
   - Mutations use the correct method (`POST`, `PATCH`, `DELETE`) with the expected body.
3. Trigger a mutation. Confirm the list query automatically refetches (second request to `/users` visible in Network).
4. For `update`, confirm **both** the list and the specific detail refetch.
5. Install `@tanstack/vue-query-devtools` if not present, and confirm cache entries use the structured keys (`["users", "list", {…}]`, not a flat `["users"]`).

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| `fetch()` or `ofetch()` called from a component or store | Bypasses the auth interceptor, retries, base URL, 401 handling | Go through `src/api/{feature}.api.ts` → composable |
| `queryKey: ["users"]` hard-coded inline | Typos silently create cache-miss bugs that never surface until prod | Use the `usersKeys` factory; a typo becomes a TS error |
| Same queryKey for list and detail | `invalidateQueries({ queryKey: ["users"] })` blows away unrelated caches | Hierarchical keys: `["users", "list", …]` vs `["users", "detail", id]` |
| Domain model reused as a request DTO | Over-posts server-managed fields (`id`, `createdAt`, `updatedAt`) | Define `CreateXxxRequest` and `UpdateXxxRequest` explicitly |
| Mutation without `onSuccess` / invalidation | UI stays stale until the next full refresh | Pair every `useMutation` with `invalidateQueries` for the affected keys |
| Zod schema **and** hand-written `interface` coexist | They drift silently | Pick one. If using Zod, infer the type with `z.infer` and delete the interface |
| Auth token fetched inside each API method | Duplicated, inconsistent, easy to forget in a new method | Put it once in `api/client.ts`'s `onRequest` |
| Server state mirrored into Pinia | Two sources of truth, no invalidation coupling | Leave it in vue-query; Pinia is for *client* state only |
| `apiClient<any>(...)` or untyped return | Loses type safety at the most important boundary | Always parameterise: `apiClient<User[]>(...)` |
| Storing `data.value` into a component `ref` | Desyncs from the cache; updates stop flowing | Consume the `data` ref from the composable directly |
| Composable declared in a view file | Can't be reused; rebuilt on every view mount | Live in `src/composables/useXxx.ts` |
| Passing plain values where the view has a `ref` | Query doesn't refetch when the value changes | Accept `MaybeRefOrGetter<T>`, unwrap with `toValue()` inside |
