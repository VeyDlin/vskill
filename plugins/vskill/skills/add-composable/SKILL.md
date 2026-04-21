---
name: add-composable
description: Use when extracting a piece of reactive logic into a reusable composable (used in 2+ places, or clearly will be) — e.g. `useClipboard` wrappers, window/focus helpers, `useInfiniteScroll`, any `useXxx` encapsulating refs + watchers + cleanup. Covers VueUse-first search, `MaybeRefOrGetter` inputs, object returns, lifecycle-safe side effects. Do NOT use for API composables (use `add-api-endpoint` which uses vue-query), global shared state (use `add-store`), or one-off logic (keep inline). Triggers: "make a composable", "extract this into useXxx", "reusable hook".
---

# Add a Reusable Composable

**When to use:** Extracting a piece of reactive logic that (a) is used in 2+ places, or (b) will clearly be used in more than one place soon, or (c) is complex enough that isolating it makes a single view easier to read. Typical examples: `useClipboard` wrappers, `useWindowFocus`, `useMediaQuery` wrappers, `useInfiniteScroll` helpers, any `useXxx` that encapsulates a few refs + watchers + cleanup.

**Do not use this skill for:**
- **API composables** (`useUsers`, `useUser`, `useCreateUser`) — those belong in `add-api-endpoint` skill, which uses vue-query. Do not build a hand-rolled `useFetch` replacement.
- **Pinia stores** — if the state needs to be shared globally and survive across route changes, that's a store, not a composable. See `add-store` skill.
- **One-off logic** used in a single component — keep it inside `<script setup>`. Premature extraction is a real cost.

Before writing anything new, **check VueUse first** — odds are the composable already exists (`useDebounceFn`, `useLocalStorage`, `useIntersectionObserver`, `useEventListener`, …). See [vueuse.org](https://vueuse.org).

## Priority rule

If this skill's instructions contradict the project's `CLAUDE.md` at the project root, **follow the project file**. Announce the conflict to the user before acting on either.

---

## Prerequisites

- `src/composables/` exists.
- VueUse is installed (`@vueuse/core`) and you have confirmed the composable you want is **not** already available there.
- The alias `@/` → `src/` is configured.

---

## Steps

Throughout, substitute your real composable name. Keep the casing:

| Aspect | Example |
|--------|---------|
| Composable name | `useCopyWithToast` (always `use*`, camelCase) |
| File name | `useCopyWithToast.ts` |
| File path | `src/composables/useCopyWithToast.ts` |

### 1. Justify it exists

Before writing, answer these out loud (in VIBE-CODER mode, answer them to the user and wait for confirmation):

1. Is this already in VueUse? If yes — stop, use it.
2. Where will this be used? Name at least two callers, or one caller plus a realistic second.
3. What does it **own** — state, side effects, cleanup?
4. What does it **not** own — what stays at the call site?

If you can't answer these clearly, the composable is premature. Inline the logic and extract later when the second caller appears.

### 2. Write the composable

Path: `src/composables/useCopyWithToast.ts`

```typescript
import { useClipboard } from "@vueuse/core";
import { useToast } from "@nuxt/ui/composables/useToast";
import type { MaybeRefOrGetter } from "vue";
import { toValue } from "vue";

export interface UseCopyWithToastOptions {
    successMessage?: string;
    errorMessage?: string;
}

export function useCopyWithToast(
    source: MaybeRefOrGetter<string>,
    options: UseCopyWithToastOptions = {}
) {
    const { successMessage = "Copied", errorMessage = "Copy failed" } = options;
    const toast = useToast();
    const { copy, isSupported } = useClipboard();

    async function run(): Promise<void> {
        const value = toValue(source);
        if (!isSupported.value || value.length === 0) {
            return;
        }
        try {
            await copy(value);
            toast.add({ title: successMessage, color: "success" });
        } catch {
            toast.add({ title: errorMessage, color: "error" });
        }
    }

    return {
        run,
        isSupported
    };
}
```

Rules:

- **One file = one composable.** Helpers used only by this composable can live in the same file (not exported); if they grow, split into `useFoo.helpers.ts` next to it.
- **Inputs accept `MaybeRefOrGetter<T>`** so callers can pass a plain value, a `ref`, a `computed`, or a getter function. Unwrap inside with `toValue()`.
- **Return an object**, never a tuple. Named properties (`{ run, isSupported }`) are self-documenting and survive refactors; positional tuples (`[run, isSupported]`) do not.
- **No side effects at module scope.** All `watch`, `onMounted`, `addEventListener` live **inside** the composable function. Module-level side effects run once when Vite bundles and bypass lifecycle.
- **Clean up what you start.** Every `addEventListener` has a matching `removeEventListener` in `onScopeDispose`; every `setInterval` has a matching `clearInterval`. Rely on VueUse's `useEventListener`, `tryOnScopeDispose`, etc. rather than reimplementing.
- **No `document` / `window` access at module scope.** Even though this is a pure SPA, module-scope access runs at bundle time and breaks test environments.
- **Typed explicitly.** Export the options interface. Never `(options: any)`.

### 3. Register in the composables barrel (optional)

This project does **not** auto-barrel `src/composables/`. Import composables directly by their path:

```typescript
import { useCopyWithToast } from "@/composables/useCopyWithToast";
```

Do not create `src/composables/index.ts` that re-exports everything — barrel files on auto-imported trees cause circular-import headaches and confuse tree-shaking.

### 4. Use it

```vue
<script setup lang="ts">
import { ref } from "vue";
import { useCopyWithToast } from "@/composables/useCopyWithToast";

const inviteLink = ref("https://example.com/invite/abc");
const { run: copyLink, isSupported } = useCopyWithToast(inviteLink);
</script>

<template>
    <UButton
        v-if="isSupported"
        icon="i-material-symbols:content-copy"
        @click="copyLink"
    >
        Copy invite
    </UButton>
</template>
```

---

## Verification

1. Run the `Type Check` and `Lint` tasks — no errors.
2. Import the composable into **two** separate views. If you can't think of a second caller within the current feature, reconsider whether it should be a composable at all.
3. Change the input `ref` from a view and confirm the composable reacts — this proves `MaybeRefOrGetter` + `toValue` are wired correctly.
4. Unmount the host component and confirm any timers / listeners the composable set up are cleaned up (Vue DevTools → Performance → Record, or just check the console for leaks).

---

## Common pitfalls

| Pitfall | Why it's wrong | What to do instead |
|---------|----------------|--------------------|
| Reinventing something VueUse already ships | Duplicates maintenance; VueUse is better tested | Check [vueuse.org](https://vueuse.org) **before** writing |
| Composable with a single caller | Premature abstraction; harder to read than inline code | Inline. Extract on the second use. |
| Input is `string` instead of `MaybeRefOrGetter<string>` | Breaks reactivity — the composable sees a snapshot, not the live value | Accept `MaybeRefOrGetter<T>`, unwrap with `toValue()` |
| Returning a tuple (`[x, y]`) | Swapping order silently renames properties at every call site | Return an object `{ x, y }` |
| `addEventListener` without matching cleanup | Memory leak that accumulates across route navigations | Use `useEventListener` from VueUse, or pair with `onScopeDispose` |
| `watch` / `onMounted` outside the composable's function body | Runs at module eval, bypasses Vue's lifecycle | Put all lifecycle hooks **inside** the exported function |
| Returning `ref.value` (the primitive) | Caller can't bind it in a template reactively | Return the `ref` itself; caller unwraps with `.value` or via template |
| Mixing a composable with a store in the same file | Two distinct concepts; confuses auto-imports and refactors | One file per concept |
| Making the composable async (`export async function useFoo`) | Composables must be called synchronously during setup | Return an async *action*, keep the composable sync |
| Barrel file (`composables/index.ts`) re-exporting everything | Creates circular imports; defeats tree-shaking | Import by direct path |
| Depending on a specific component's DOM | Tightly couples reusable logic to one view | Pass elements in via a `ref`/`MaybeRefOrGetter<HTMLElement>` parameter |
| Storing server data inside the composable with `ref` + manual fetch | That's vue-query's job, done worse | Use `useQuery` from vue-query (see `add-api-endpoint` skill) |
