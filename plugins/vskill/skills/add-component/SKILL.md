---
name: add-component
description: Use when adding a reusable Vue component — either a common one (used across features like `AppHeader`, `ConfirmDialog`) or a feature-scoped one (e.g. `UserCard`, `InvoiceRow`). Covers folder placement, Nuxt UI-first check, `<script setup lang="ts">` with typed `defineProps` / `defineEmits` / `defineModel`, scoped SCSS with Nuxt UI design tokens (no hardcoded colours), and deliberate in/out shape. Do NOT use for pages (use `add-page`), thin wrappers around single Nuxt UI components, or logic-only helpers (use `add-composable`). Triggers: "add a component", "make a UserCard", "new reusable component".
---

# Add a Component

**When to use:** Adding a reusable Vue component — either a **common** one (used across features: `AppHeader`, `ConfirmDialog`, `EmptyState`) or a **feature-scoped** one (used only inside one feature: `UserCard`, `InvoiceRow`, `ChatMessage`).

**Do not use this skill for:**
- **Route-level components (pages/views)** — see `add-page` skill. Pages live in `src/views/`, components in `src/components/`.
- **A wrapper around a single Nuxt UI component that adds nothing** — for example, `MyButton.vue` that just forwards props to `UButton`. Delete it; use `UButton` directly.
- **Logic-only helpers** with no template — see `add-composable` skill.

Before writing anything, **check Nuxt UI MCP first** (`mcp__nuxt-ui-remote__*`) — the component you want may already exist as `UCard`, `UModal`, `UAlert`, `UEmptyState`, etc.

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- `src/components/common/` and `src/components/{feature}/` exist (create the feature folder on first component for that feature).
- The alias `@/` → `src/` is configured.
- Nuxt UI is wired up in `src/main.ts` via `createApp(...).use(uiPlugin)`.

---

## Steps

Throughout, substitute your real component name. Keep the casing:

| Aspect | Example (common) | Example (feature) |
|--------|------------------|-------------------|
| Component name | `ConfirmDialog` (PascalCase) | `UserCard` |
| File name | `ConfirmDialog.vue` | `UserCard.vue` |
| Folder | `src/components/common/` | `src/components/users/` |

### 1. Decide: common or feature-scoped?

- **Common** (`src/components/common/`) — reused across features; depends only on Nuxt UI, generic utils, generic types. A `UserCard` that imports `@/types/api/users` is **not** common — it belongs to the users feature.
- **Feature-scoped** (`src/components/{feature}/`) — tied to one feature; free to import from that feature's types, composables, API.

Rule of thumb: if the component imports from `@/types/api/{feature}` or `@/composables/use{Feature}`, it is feature-scoped. Never import **across** features — if `UserCard` needs `@/types/api/invoices`, something is wrong with the decomposition; either lift the shared type or split the component.

### 2. Check Nuxt UI first

For every new component, search Nuxt UI MCP (or [ui.nuxt.com](https://ui.nuxt.com/components)) for existing primitives. You are almost always building *on top of* Nuxt UI, never beside it:

- Dialog / modal → `UModal`
- Dropdown → `UDropdownMenu`
- Card → `UCard`
- Empty state → `UEmptyState`
- Alert / banner → `UAlert`
- Toast → `useToast()` composable

If Nuxt UI already ships it, use it directly in the parent view. A thin wrapper is only justified when you need to (a) apply project-wide defaults, (b) compose two Nuxt UI primitives into one reusable unit, or (c) inject project-specific business logic.

### 3. Write the component

Path: `src/components/users/UserCard.vue`

```vue
<script setup lang="ts">
import { computed } from "vue";
import type { User } from "@/types/api/users";

interface Props {
    user: User;
    compact?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    compact: false
});

const emit = defineEmits<{
    select: [userId: number];
    remove: [userId: number];
}>();

const initials = computed(() => {
    const parts = props.user.name.trim().split(/\s+/);
    const first = parts[0]?.[0] ?? "";
    const last = parts[parts.length - 1]?.[0] ?? "";
    return (first + last).toUpperCase();
});

function handleSelect(): void {
    emit("select", props.user.id);
}

function handleRemove(): void {
    emit("remove", props.user.id);
}
</script>

<template>
    <UCard
        class="user-card"
        :class="{ 'user-card--compact': compact }"
        @click="handleSelect"
    >
        <div class="user-card__header">
            <UAvatar :text="initials" />
            <div class="user-card__meta">
                <p class="user-card__name">{{ user.name }}</p>
                <p class="user-card__email">{{ user.email }}</p>
            </div>
            <UButton
                icon="i-material-symbols:delete-outline"
                color="error"
                variant="ghost"
                @click.stop="handleRemove"
            />
        </div>
        <slot />
    </UCard>
</template>

<style scoped lang="scss">
.user-card {
    cursor: pointer;

    &__header {
        display: flex;
        align-items: center;
        gap: 0.75rem;
    }

    &__meta {
        flex: 1;
        min-width: 0;
    }

    &__name {
        font-weight: 600;
        color: var(--ui-text);
    }

    &__email {
        font-size: 0.875rem;
        color: var(--ui-text-muted);
    }

    &--compact &__header {
        gap: 0.5rem;
    }
}
</style>
```

Rules:

- **`<script setup lang="ts">` always.** Never use the options-API (`export default defineComponent`).
- **Props via `defineProps<Props>()`** with an exported-or-inline `interface Props`. Use `withDefaults` for optional props.
- **Emits via `defineEmits<{...}>()`** with typed payloads: `select: [userId: number]`. Never `defineEmits(["select"])` — that erases the payload type.
- **Two-way binding via `defineModel<T>()`**, not manual `modelValue` + `update:modelValue`:
  ```typescript
  const value = defineModel<string>();
  // use value.value, assign to value.value
  ```
- **Scoped SCSS.** Always `<style scoped lang="scss">`. No global styles. BEM naming inside scoped styles is fine — it aids readability.
- **No hardcoded colours.** Use `var(--ui-text)`, `var(--ui-text-muted)`, `var(--ui-border)`, `var(--ui-bg)`, etc. from the Nuxt UI token system. For spacing/sizing, either use `rem` directly or lift magic numbers to `_variables.scss`.
- **No global registration.** Import where used: `import UserCard from "@/components/users/UserCard.vue"`.
- **Slots are named and typed.** If the component exposes slots beyond the default, declare them with `defineSlots<{...}>()` so consumers get autocomplete.
- **Don't reach out.** A component never imports from `@/stores/*` unless the store represents shared UI state that is explicitly its input. Business data flows in via props; results flow out via emits or `defineModel`.

### 4. Choose inputs and outputs deliberately

Before writing the template, list what the component needs **in** and what it produces **out**. This is where most AI-generated components drift.

- **In → `props`**: data rendered by the component (primitives, objects from the feature's types).
- **In → `slots`**: user-provided markup injected into known places.
- **Out → `emits`**: events the parent acts on (`select`, `remove`, `submit`).
- **Out → `defineModel`**: a single value the parent binds with `v-model`.

**Anti-patterns:**
- Passing a callback as a prop (`onSelect: (id) => void`) — use an emit.
- Emitting "the entire new state of the component" — pass only what changed.
- Slots that expect a specific component type (e.g. "must be a `UButton`") — accept any markup; document the intent.

### 5. Use it

Import directly by path — **no auto-import**:

```vue
<script setup lang="ts">
import UserCard from "@/components/users/UserCard.vue";
import type { User } from "@/types/api/users";

defineProps<{ users: User[] }>();

function handleSelect(userId: number): void {
    // ...
}
</script>

<template>
    <UserCard
        v-for="user in users"
        :key="user.id"
        :user="user"
        @select="handleSelect"
    />
</template>
```

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. Open the component in its parent view. Confirm:
   - Required props fail the type check if omitted.
   - Emits fire with the documented payload (log in the parent or use Vue DevTools → Events).
   - `v-model` round-trips if the component exposes `defineModel`.
3. In Vue DevTools, confirm the component's props panel shows the expected types and that slots behave as documented.
4. Resize the browser — confirm no layout breaks at mobile widths (Nuxt UI tokens handle most of this, but catch obvious overflows).
5. Trigger hover / focus / disabled states and confirm the component remains accessible (focus ring visible, disabled buttons not clickable).

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Thin wrapper around a single Nuxt UI component | Adds no value, multiplies import paths | Delete the wrapper; use the Nuxt UI component directly |
| Hardcoded colour (`color: #333`, `background: rgb(...)`) | Breaks theming and dark mode | Use `var(--ui-text)`, `var(--ui-border)`, etc. |
| Global `<style>` (no `scoped`) | Leaks styles to the entire app | Always `<style scoped lang="scss">` |
| `defineEmits(["select"])` (no payload type) | Consumers get `any` for the event handler | `defineEmits<{ select: [id: number] }>()` |
| Two-way with `modelValue` + `update:modelValue` | Verbose, error-prone | `const value = defineModel<T>()` |
| `props.xxx = ...` (mutating props) | Vue warning; unidirectional flow violated | Emit a change; let the parent update its state |
| Component imports from another feature's folder | Creates cross-feature coupling | Lift shared pieces to `components/common/` or `types/` |
| Component imports a store directly | Hidden global coupling; hard to test | Parent reads the store and passes data via props |
| Callback-as-prop (`@select` passed as `:onSelect`) | Breaks with TS event-typing, confuses readers | Use an `emit`; parent binds with `@select` |
| No `:key` on `v-for` / `:key="index"` | List updates misbehave on reorder | `:key="stable.unique.id"` |
| Deep prop drilling (passing the same prop through 3 layers) | Signals missing composition | Use a slot, a composable, or a store for shared UI state |
| Slot content wrapped in extra `<div>` with styles | Slot consumers can't override layout | Render the slot directly when possible; use CSS-grid/flex on the parent |
| Component file > 300 lines | Too much is happening in one file | Split: child components or extract logic to a composable |
