---
name: add-form
description: Use when adding a form that collects structured input — login, registration, settings, "create / edit X", multi-step wizards. Covers Zod schema definition, Nuxt UI `<UForm>` wiring with `<UFormField>`, submit handling via a vue-query mutation, server-error mapping, loading/disabled states, and reset. Do NOT use for single-input search (use `<UInput>` + `watchDebounced`), yes/no confirmations (use `UModal`), or pure file uploads. Triggers: "add a form", "login form", "create user form", "settings form with validation".
---

# Add a Form with Validation

**When to use:** Adding any form that collects structured input — login, registration, settings, "create / edit X", multi-step wizards. Covers client validation (Zod), submit handling, server-error mapping, loading / disabled states, and reset.

**Do not use this skill for:**
- A single search input with instant feedback — use `<UInput v-model="query">` and react via `watchDebounced`.
- A "yes / no" confirmation — use `UModal` + a button handler; no validation needed.
- A file upload with no other fields — use a `UFileInput` + mutation directly.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- **Nuxt UI's `<UForm>`** with Zod support is available (ships with `@nuxt/ui` — no extra install needed).
- **Zod** is installed (`zod`).
- An API composable for the submit action exists (see `add-api-endpoint` skill) — e.g. `useCreateUser`, `useUpdateUser`, `useLogin`.
- The alias `@/` → `src/` is configured.

---

## Steps

Throughout, substitute your real form name.

| Aspect | Example |
|--------|---------|
| Schema file | `src/schemas/createUser.schema.ts` |
| Form component | `CreateUserForm.vue` |
| Form path | `src/components/users/CreateUserForm.vue` |
| Submit handler | `useCreateUser()` composable |

### 1. Define the schema

Path: `src/schemas/createUser.schema.ts`

```typescript
import { z } from "zod";

export const createUserSchema = z.object({
    name: z
        .string({ required_error: "Name is required" })
        .trim()
        .min(2, "At least 2 characters")
        .max(100, "Too long (max 100)"),

    email: z
        .string({ required_error: "Email is required" })
        .trim()
        .toLowerCase()
        .email("Enter a valid email"),

    age: z
        .number({ invalid_type_error: "Age must be a number" })
        .int("Age must be a whole number")
        .positive("Age must be positive")
        .optional(),

    role: z.enum(["user", "admin"], {
        errorMap: () => ({ message: "Pick a role" })
    })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
```

Rules:

- **One schema file per form.** Do not co-locate the schema inside the component file — schemas are shared with API types and tests.
- **Schema is the single source of truth** for the form's shape. Infer the TS type with `z.infer` — do not hand-write a parallel `interface`.
- **Human-friendly messages.** Zod's defaults ("Required", "Invalid email") are fine in dev but terrible in production UI. Override them.
- **`.trim()` and `.toLowerCase()`** belong in the schema, not the component. The schema both validates and normalises.
- **Never reuse the API's request DTO** as the form schema. The form has UI-specific concerns (confirm-password, acceptTerms, captcha) that never hit the wire.

### 2. Build the form component

Path: `src/components/users/CreateUserForm.vue`

```vue
<script setup lang="ts">
import { reactive, ref } from "vue";
import type { FormSubmitEvent, FormErrorEvent } from "@nuxt/ui";
import { createUserSchema, type CreateUserInput } from "@/schemas/createUser.schema";
import { useCreateUser } from "@/composables/useUsers";

const emit = defineEmits<{
    created: [user: { id: number; name: string; email: string }];
    cancel: [];
}>();

const state = reactive<Partial<CreateUserInput>>({
    name: "",
    email: "",
    age: undefined,
    role: undefined
});

const serverError = ref<string | null>(null);
const mutation = useCreateUser();

async function onSubmit(event: FormSubmitEvent<CreateUserInput>): Promise<void> {
    serverError.value = null;
    try {
        const user = await mutation.mutateAsync(event.data);
        emit("created", user);
        resetForm();
    } catch (e) {
        serverError.value = e instanceof Error ? e.message : "Something went wrong";
    }
}

function onError(_event: FormErrorEvent): void {
    // Hook for scroll-to-first-error, analytics, etc.
    // Leave empty by default — Nuxt UI already focuses the first invalid field.
}

function resetForm(): void {
    state.name = "";
    state.email = "";
    state.age = undefined;
    state.role = undefined;
}

const roleOptions = [
    { label: "User", value: "user" },
    { label: "Admin", value: "admin" }
];
</script>

<template>
    <UForm
        :schema="createUserSchema"
        :state="state"
        class="create-user-form"
        @submit="onSubmit"
        @error="onError"
    >
        <UFormField label="Name" name="name" required>
            <UInput v-model="state.name" autocomplete="name" />
        </UFormField>

        <UFormField label="Email" name="email" required>
            <UInput v-model="state.email" type="email" autocomplete="email" />
        </UFormField>

        <UFormField label="Age" name="age" help="Optional">
            <UInput v-model.number="state.age" type="number" min="1" />
        </UFormField>

        <UFormField label="Role" name="role" required>
            <USelect v-model="state.role" :items="roleOptions" placeholder="Select a role" />
        </UFormField>

        <UAlert
            v-if="serverError"
            color="error"
            icon="i-material-symbols:error-outline"
            :title="serverError"
        />

        <div class="create-user-form__actions">
            <UButton
                type="button"
                color="neutral"
                variant="ghost"
                :disabled="mutation.isPending.value"
                @click="emit('cancel')"
            >
                Cancel
            </UButton>
            <UButton
                type="submit"
                :loading="mutation.isPending.value"
                icon="i-material-symbols:check"
            >
                Create user
            </UButton>
        </div>
    </UForm>
</template>

<style scoped lang="scss">
.create-user-form {
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &__actions {
        display: flex;
        justify-content: flex-end;
        gap: 0.75rem;
        margin-top: 0.5rem;
    }
}
</style>
```

Rules:

- **`<UForm :schema="..." :state="...">`** wires Zod validation automatically. Do **not** hand-roll `v-on:input` validators per field.
- **`<UFormField name="fieldName">`** — the `name` MUST match the schema key. Nuxt UI uses it to target the correct error.
- **`state` is `reactive`, not `ref`.** `<UForm>` expects a reactive object, not a `Ref<object>`.
- **Type state as `Partial<FormInput>`.** Required fields start as `""` or `undefined` — they become valid only after the user fills them, and Zod does the checking.
- **Optional numeric fields use `v-model.number`** — otherwise the `<input type="number">` returns a string.
- **Submit handler takes `FormSubmitEvent<T>` and uses `event.data`**, which is the **validated, typed** payload. Do NOT use `state` directly in the submit handler — `state` may be partial / invalid; `event.data` is the clean one.
- **Loading from the mutation, not a separate `ref`.** `mutation.isPending.value` drives the button's loading state and disables Cancel.
- **Server errors go in a single `UAlert` above the actions**, not silently into a toast. The user needs to see *why* the submit failed in the context of the form.
- **Emit on success with the created entity**, not with a boolean. The parent usually needs the new `id` to navigate or update state.
- **Reset on success**, but only after the emit — otherwise you lose the payload.

### 3. Map server-side field errors (when the backend returns them)

If your backend returns structured per-field errors (e.g. `{ errors: { email: "Already in use" } }`), map them back onto the form using a `ref` to the form and `setErrors`:

```vue
<script setup lang="ts">
import type { Form } from "@nuxt/ui";

const form = ref<Form<CreateUserInput> | null>(null);

async function onSubmit(event: FormSubmitEvent<CreateUserInput>): Promise<void> {
    try {
        await mutation.mutateAsync(event.data);
        // ...
    } catch (e) {
        if (isFieldErrorResponse(e)) {
            form.value?.setErrors(
                Object.entries(e.errors).map(([path, message]) => ({ path, message }))
            );
            return;
        }
        serverError.value = e instanceof Error ? e.message : "Something went wrong";
    }
}
</script>

<template>
    <UForm ref="form" ...>
        <!-- ... -->
    </UForm>
</template>
```

Add a type guard `isFieldErrorResponse` next to your API client. Never `as any` the error shape.

### 4. Use the form

```vue
<script setup lang="ts">
import { ref } from "vue";
import CreateUserForm from "@/components/users/CreateUserForm.vue";

const open = ref(false);

function onCreated(user: { id: number; name: string }): void {
    open.value = false;
    // e.g. toast, navigate, refetch — whatever the parent decides
}
</script>

<template>
    <UButton icon="i-material-symbols:add" @click="open = true">New user</UButton>

    <UModal v-model:open="open" title="Create user">
        <template #body>
            <CreateUserForm @created="onCreated" @cancel="open = false" />
        </template>
    </UModal>
</template>
```

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. Open the form in the browser. Confirm:
   - Submitting with empty required fields shows inline errors next to each field.
   - Submitting with invalid data (bad email, negative age) shows the schema's messages.
   - Submitting valid data fires the mutation and shows loading state on the submit button.
   - On success, the form resets and the `created` event fires.
   - On server error, the `<UAlert>` appears with a human-readable message.
3. Tab through the form with the keyboard — every field is reachable, focus order is top-to-bottom, Enter submits the form.
4. Disable the network, submit. Confirm the form does not freeze the UI and shows a sensible error.
5. Submit twice rapidly. Confirm the mutation doesn't fire twice (the button is disabled while `isPending`).

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Schema inside the `.vue` file | Hard to share with API types or tests | Dedicated `src/schemas/{form}.schema.ts` |
| Hand-written `interface CreateUserInput` alongside the schema | Drifts silently | `type X = z.infer<typeof schema>` — single source |
| Using `state` in `onSubmit` instead of `event.data` | You submit the partial, un-normalised object | Always use `event.data` — it's validated and typed |
| `reactive(ref({}))` or `ref({ ... })` for `state` | `<UForm>` requires a reactive object, not a `Ref` | `const state = reactive<Partial<T>>({...})` |
| `UFormField` with no `name` or a `name` that doesn't match the schema key | Errors never attach to the field | `name` MUST match schema keys exactly |
| `v-model="state.age"` for a numeric field | Value arrives as a string; Zod fails mysteriously | `v-model.number="state.age"` |
| Own `loading` ref next to the mutation | Two booleans to keep in sync; they'll drift | Read `mutation.isPending.value` directly |
| Surfacing server errors via `toast` and leaving the form looking submitted | User can't tell what happened | Inline `UAlert` above the actions |
| Closing the modal inside `onSubmit` before the mutation resolves | Submit happens "in the void"; errors have nowhere to show | Close only on `created` emit |
| Disabling the submit but leaving Cancel enabled during submit | User cancels a half-sent request | Disable both while `isPending` |
| Custom per-field watchers calling `schema.parse()` | Duplicates what `<UForm>` already does | Trust the form — react to `@submit` / `@error` only |
| Using `formState` API from vee-validate directly | Nuxt UI abstracts this; mixing the two breaks typing | Stay in `<UForm>` / `<UFormField>`; reach through `form.value?.setErrors(...)` only when needed |
| Resetting state but not clearing server-side errors | Stale alert persists after a successful retry | `serverError.value = null` at the start of every submit |
| Treating `required_error` as "field appears" — it triggers only if the key is missing entirely. For empty strings use `.min(1)` | "Required" error never fires for `""` inputs | Use `.min(1)` / `.min(2)` alongside `required_error` |
