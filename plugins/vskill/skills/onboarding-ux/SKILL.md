---
name: onboarding-ux
description: "Audit a Vue 3 + Nuxt UI app for onboarding gaps — empty states, first-run guidance, feature discoverability, tooltips, contextual hints — then generate the Vue components and copy to fill them. Produces an audit report plus Vue SFCs (using Nuxt UI primitives: UEmptyState, UAlert, UCard, UTooltip, UModal) ready to drop into the project. Triggers: 'onboarding', 'help content', 'empty states', 'user guidance', 'first-run experience', 'feature tour', 'new user experience', 'app is confusing', 'welcome flow'."
compatibility: claude-code-only
---

# Onboarding UX (Vue 3 + Nuxt UI)

Audit a Vue 3 + Nuxt UI web app for onboarding gaps, then generate the in-app guidance to fix them. The goal: a new user should never stare at a blank screen wondering what to do.

## Priority rule

This skill targets projects built on the vskill stack (Vue 3 + Nuxt UI standalone + Pinia + vue-query). If the target project's `CLAUDE.md` contradicts anything here, **follow the project file** and announce the conflict.

## The problem this solves

You've built the features. They work. But when a new user logs in for the first time, they see:

- Empty tables with column headers and nothing else
- Sidebars full of labels that mean nothing to them yet
- No indication of where to start or what the app is for
- Features they don't know exist because nothing points to them

This skill finds those gaps and produces the components and copy to fill them.

## Prerequisites

- `chrome-devtools` MCP connected (for browsing the running app and taking screenshots). Without it, you can still audit the source but cannot verify rendered states.
- A running dev server (`npm run dev`) or deployed URL.
- Target project uses Nuxt UI in standalone mode — every generated component assumes `@nuxt/ui` is installed and its Vite + Vue plugins are wired.

## Workflow

The skill runs in two phases: **audit** to identify gaps, then **generate** the Vue components and copy that fill them. Commit to the audit first; don't start generating until it's written.

---

### Phase 1: Audit — find the gaps

Open the app in the browser (via `mcp__chrome-devtools__navigate_page`). For each route, check:

#### Empty states

Navigate to every list / table / collection view. For each, ask:

| Check | Good | Bad |
|-------|------|-----|
| What does a zero-data page show? | `UEmptyState` with icon + title + description + CTA | Empty `<UTable>` headers, or a blank `<div>` |
| Is there a clear action? | `<UButton>` labelled "Add your first client" | Nothing — user has to hunt for the action in the nav |
| Does it explain the feature? | "Clients are the people and businesses you work with…" | Just an empty container |
| Is it designed? | Icon, helpful copy, prominent CTA | Identical to the populated state minus the data |

#### First impression

Clear localStorage / sign out to simulate a new user, then evaluate the landing view:

| Check | What to look for |
|-------|------------------|
| Landing view | Does `/` show something useful, or is it empty? |
| Orientation | Within 10 seconds, do I know what the app does and where to start? |
| First action | Is the single most important action obvious and prominent? |
| Cognitive load | How many nav items, buttons, and options compete for attention? |
| Welcome content | Is there a welcome banner or checklist? Or just the raw app? |

#### Feature discoverability

For every feature in the nav:

| Check | What to look for |
|-------|------------------|
| Can I find it? | Visible in the nav, or buried in a submenu? |
| Do I know what it does? | Label explains it, or do I need to click to find out? |
| Keyboard shortcuts | Any? Discoverable (via tooltip or help panel)? |
| Advanced features | Filters, bulk actions, search — visible or hidden? |
| Settings | Can I find settings? Does each one say what it does? |

#### Contextual help gaps

On each form and detail view:

| Check | What to look for |
|-------|------------------|
| Form fields | Complex fields have `<UFormField help="...">` or `<UTooltip>`? |
| Jargon | Any labels a non-expert wouldn't understand? |
| Consequences | Destructive actions explain what will happen? (e.g. delete confirmations via `UModal`) |
| Validation | When the user makes a mistake, does the error message say how to fix it? |

#### Write the audit report

Save the findings to the project under `docs/onboarding/audit.md` (create `docs/onboarding/` if it doesn't exist — this is project documentation, not source code):

```markdown
# Onboarding Audit: [App Name]
**Date**: YYYY-MM-DD
**URL**: [app url]

## First Impression Score
[1-5] — Can a new user figure out what to do within 30 seconds?

## Empty States Found
| Route | Current state | Recommendation |
|-------|---------------|----------------|
| /clients | Empty `<UTable>`, no guidance | `UEmptyState` with "Add your first client" CTA |

## Missing Guidance
| Location | Gap | Priority |
|----------|-----|----------|
| Dashboard (/) | No welcome or getting-started checklist | High |
| Settings (/settings) | No `help` prop on UFormField entries | Medium |

## Feature Discovery Issues
| Feature | Problem | Fix |
|---------|---------|-----|
| Keyboard shortcuts | No discovery surface | Add a `<UModal>` help panel bound to `?` |

## Quick Wins
[Top 5 changes with the biggest impact on new-user experience]
```

---

### Phase 2: Generate — build the solutions

Read the project's existing components and stores first so generated code matches the project's patterns (imports from `@/...`, naming conventions, Pinia store usage). Every generated component uses Nuxt UI primitives — never roll custom buttons, cards, or modals.

Generated files go into the target project. **Common** reusable pieces (e.g. a `DismissibleHint.vue` used on many pages) go into `src/components/common/` via the `add-component` skill. **Feature-specific** pieces (e.g. a `ClientsEmptyState.vue` used only on the clients page) go into `src/components/{feature}/` via the same skill.

#### 1. Empty state components

For every empty state identified in the audit, drop `UEmptyState` into the consuming view. Most of the time you do **not** need a wrapper component — `UEmptyState` is already the right abstraction. Only create a wrapper when the empty state needs project-specific behaviour (e.g. reading from a store to decide which CTA to render).

Inline usage (preferred):

```vue
<script setup lang="ts">
import { useClients } from "@/composables/useClients";

const { data: clients, isLoading, isError } = useClients();
</script>

<template>
    <USkeleton v-if="isLoading" class="h-64" />

    <UAlert
        v-else-if="isError"
        color="error"
        icon="i-material-symbols:error-outline"
        title="Could not load clients"
    />

    <UEmptyState
        v-else-if="!clients?.length"
        icon="i-material-symbols:group-off-outline"
        title="No clients yet"
        description="Clients are the people and businesses you work with. Add your first to start tracking relationships."
    >
        <template #actions>
            <UButton icon="i-material-symbols:add" to="/clients/new">
                Add your first client
            </UButton>
        </template>
    </UEmptyState>

    <!-- populated state below -->
</template>
```

For each empty state, write:

- **Title** — what the feature is ("Clients")
- **Description** — why it matters, in one sentence ("Track the people and businesses you work with")
- **Action label** — the next step ("Add your first client")

Write copy like a helpful colleague, not a manual.

#### 2. Welcome / first-run experience

**Simple app (3–5 features): dismissible welcome banner.**

Path: `src/components/common/WelcomeBanner.vue` — generate via the `add-component` skill.

```vue
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";

interface Step {
    label: string;
    to?: string;
}

defineProps<{
    appName: string;
    steps: Step[];
}>();

const dismissed = useLocalStorage("welcome-banner-dismissed", false);
</script>

<template>
    <UCard v-if="!dismissed" class="welcome-banner">
        <template #header>
            <div class="welcome-banner__title">Welcome to {{ appName }}</div>
        </template>

        <p class="welcome-banner__lead">Here's how to get started:</p>
        <ol class="welcome-banner__steps">
            <li v-for="(step, i) in steps" :key="i">
                {{ i + 1 }}. {{ step.label }}
            </li>
        </ol>

        <template #footer>
            <UButton variant="ghost" @click="dismissed = true">Got it</UButton>
        </template>
    </UCard>
</template>

<style scoped lang="scss">
.welcome-banner {
    margin-bottom: 1.5rem;

    &__title {
        font-size: 1.25rem;
        font-weight: 600;
        color: var(--ui-text);
    }

    &__lead {
        color: var(--ui-text-muted);
        margin-bottom: 0.75rem;
    }

    &__steps {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        list-style: none;
        padding: 0;
    }
}
</style>
```

**Complex app (6+ features): getting-started checklist.**

Put the progress state in a persisted Pinia store so progress survives reloads. Use the `add-store` skill to generate it — example shape:

```typescript
// src/stores/onboarding.store.ts
import { defineStore } from "pinia";
import { computed, ref } from "vue";

export const useOnboardingStore = defineStore("onboarding", () => {
    const completed = ref<string[]>([]);

    function markComplete(stepId: string): void {
        if (!completed.value.includes(stepId)) {
            completed.value = [...completed.value, stepId];
        }
    }

    const isComplete = computed(() => (id: string) => completed.value.includes(id));

    return { completed, markComplete, isComplete };
}, {
    persist: {
        key: "onboarding",
        storage: localStorage,
        pick: ["completed"]
    }
});
```

Then a checklist component (generate via `add-component`):

```vue
<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useOnboardingStore } from "@/stores/onboarding.store";

interface Step {
    id: string;
    label: string;
}

const props = defineProps<{ steps: Step[] }>();

const store = useOnboardingStore();
const { completed } = storeToRefs(store);

const progress = computed(() =>
    Math.round((completed.value.length / props.steps.length) * 100)
);
</script>

<template>
    <UCard>
        <template #header>
            <div class="onboarding-checklist__header">
                <div class="onboarding-checklist__title">Getting started</div>
                <p class="onboarding-checklist__progress">
                    {{ completed.length }} of {{ steps.length }} complete
                </p>
            </div>
        </template>

        <UProgress :value="progress" class="onboarding-checklist__bar" />

        <ul class="onboarding-checklist__steps">
            <li v-for="step in steps" :key="step.id" class="onboarding-checklist__step">
                <UIcon
                    :name="completed.includes(step.id)
                        ? 'i-material-symbols:check-circle'
                        : 'i-material-symbols:radio-button-unchecked'"
                    :class="{ 'onboarding-checklist__icon--done': completed.includes(step.id) }"
                />
                <span>{{ step.label }}</span>
            </li>
        </ul>
    </UCard>
</template>

<style scoped lang="scss">
.onboarding-checklist {
    &__title {
        font-weight: 600;
        color: var(--ui-text);
    }

    &__progress {
        font-size: 0.875rem;
        color: var(--ui-text-muted);
    }

    &__bar {
        margin-bottom: 1rem;
    }

    &__steps {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        list-style: none;
        padding: 0;
    }

    &__step {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    &__icon--done {
        color: var(--ui-color-success-500);
    }
}
</style>
```

#### 3. Feature tour (only if the audit justifies one)

A feature tour is friction for returning users. Add one only when the audit shows a genuine discoverability problem that empty states and hints cannot solve.

For Vue, use [driver.js](https://driverjs.com) (framework-agnostic). Ask the user before installing — it's a new dependency.

Tour steps live in `src/data/tour.ts`:

```typescript
import type { DriveStep } from "driver.js";

export const appTourSteps: DriveStep[] = [
    {
        element: "[data-tour='sidebar-clients']",
        popover: {
            title: "Clients",
            description: "The people and businesses you work with live here. Add new ones from the top of this list."
        }
    },
    {
        element: "[data-tour='create-button']",
        popover: {
            title: "Create new",
            description: "Start a new client, project, or invoice from here."
        }
    }
];
```

Also list every `data-tour` attribute you'll need to add to existing components. Keep the tour to **≤5 steps** — longer tours get dismissed on the first step.

#### 4. Tooltip and help content

For complex form fields, prefer `<UFormField help="…">` — Nuxt UI renders it inline under the field, no extra component needed:

```vue
<UFormField
    label="Significance"
    name="significance"
    help="1–5 rating of how important this client is to your business."
    required
>
    <USelect v-model="state.significance" :items="[1, 2, 3, 4, 5]" />
</UFormField>
```

When a tooltip is genuinely needed (icon triggers, label-adjacent info), use `<UTooltip>`:

```vue
<div class="field-label-with-info">
    <span>Significance</span>
    <UTooltip text="1–5 rating of how important this client is to your business.">
        <UIcon name="i-material-symbols:info-outline" />
    </UTooltip>
</div>
```

Generate a content map `{ fieldName: helpText }` for every field that needs explanation and save it to `docs/onboarding/tooltip-content.md` so copy changes can be reviewed by a human.

#### 5. Dismissible inline hints

Path: `src/components/common/DismissibleHint.vue` — generate via the `add-component` skill.

```vue
<script setup lang="ts">
import { useLocalStorage } from "@vueuse/core";

const props = defineProps<{ id: string }>();

const dismissed = useLocalStorage(`hint-${props.id}`, false);

function dismiss(): void {
    dismissed.value = true;
}
</script>

<template>
    <UAlert
        v-if="!dismissed"
        color="info"
        variant="soft"
        icon="i-material-symbols:lightbulb-outline"
        class="dismissible-hint"
        :close="true"
        @close="dismiss"
    >
        <template #description>
            <slot />
        </template>
    </UAlert>
</template>

<style scoped lang="scss">
.dismissible-hint {
    margin-bottom: 0.75rem;
}
</style>
```

Usage:

```vue
<DismissibleHint id="keyboard-shortcuts">
    Tip: Press <kbd>Ctrl</kbd>+<kbd>K</kbd> to jump to any page or record.
</DismissibleHint>
```

#### 6. Seed data that teaches

Write sample records that demonstrate the app's features — realistic names, relationships between entities (client → contact → invoice), records in every state (draft / active / completed / archived). Put this in `src/data/seed/` (or equivalent the project already uses). Avoid "Test Client 1" / "Lorem ipsum" placeholders — they teach the user nothing.

#### 7. Help page content

Generate an in-app help view (`/help`) at `src/views/HelpView.vue` with content answering the top 5 things a new user would ask. Copy is grounded in the actual app — read the code to make sure each answer reflects what the app actually does.

```markdown
## How do I add a new client?
1. Click **Clients** in the sidebar
2. Click **Add Client** in the top right
3. Fill in the name and email — everything else is optional
4. Click **Save**

## What does "significance" mean?
…
```

Render the markdown via `vue-markdown-render` or inline as Vue template — pick whichever the project already uses.

## Output summary

After Phase 2, the project contains:

- `docs/onboarding/audit.md` — the gap analysis
- `docs/onboarding/tooltip-content.md` — the tooltip copy map
- `src/components/common/WelcomeBanner.vue` (simple apps)
- `src/components/common/OnboardingChecklist.vue` (complex apps)
- `src/components/common/DismissibleHint.vue`
- `src/stores/onboarding.store.ts` (complex apps only)
- `src/data/tour.ts` + driver.js install (only if the audit justifies a tour)
- Inline changes to existing views: `UEmptyState` branches, `UFormField help` props, `data-tour` attributes
- Optional: `src/views/HelpView.vue` + a route registration via `add-page`

Tell the user exactly which files changed, which were created, and where to verify each piece in the browser.

## Tips

- **Match the project's patterns.** Read two or three existing `.vue` files before generating, so imports, naming, and style align.
- **Empty states are the highest-impact fix.** Do them first.
- **Feature tours are annoying.** Max 5 steps. Only after empty states and hints.
- **Dismissible hints must actually dismiss.** Test by clicking close → reload → confirm it stays gone.
- **Copy matters more than code.** A great `UEmptyState` with mediocre copy is worse than a plain `UEmptyState` with a sentence that tells the user why they should care.
- **Don't reinvent Nuxt UI.** `UEmptyState`, `UAlert`, `UCard`, `UTooltip`, `UModal`, `UProgress`, `UCheckbox` already exist. Use them.

## Pairing with other skills

| If you also run… | This skill adds… |
|------------------|------------------|
| `ux-audit` | Uses the audit findings as input — fixes the problems found |
| `design-review` | After generating onboarding UI, run `design-review` to catch spacing / hierarchy issues in the new components |
| `design-prototype` | Onboarding is rarely part of the first prototype pass — layer this skill on *after* the prototype is usable |
