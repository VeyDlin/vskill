---
name: screen-sketch
description: Draws static HTML "screen sketches" — Figma-style artboards rendered as plain HTML files, opened directly via `file://` with no build step. Use when the user wants a rough visual draft of screens without any working functionality ("набросай экраны", "sketch me a layout", "покажи как могло бы выглядеть", "quick mockup", "wireframe for...", "static mockup", "like in Figma, but in code"). Stack is CDN-only — Tailwind Play CDN + Vue 3 global build + Iconify web component + picsum.photos + Inter Variable. Every sketch is locked to one chosen viewport (desktop 1440×900 or mobile 375×812), no adaptivity, no state, no router, no API. Drives `chrome-devtools` MCP to screenshot each `.html` file, self-critiques against a structural polish checklist, and iterates until the sketch reads cleanly. Distinct from `design-prototype`: that skill builds working Vue apps with real routing/data/states; this skill draws frozen artboards.
---

# Screen Sketch — Figma-style artboards in pure HTML

Draw static visual drafts of screens as single-file HTML pages. No Vite, no `npm install`, no dev server — pages open straight from disk via `file://`.

## When to use this vs. `design-prototype`

| Need | Skill |
|------|-------|
| "I want to see what the screens might look like" | `screen-sketch` |
| "Build me a working app that does X" | `design-prototype` |
| "Just the layout, no buttons that work" | `screen-sketch` |
| "Loading/error/empty states need to work" | `design-prototype` |
| "Like in Figma but in code" | `screen-sketch` |
| "Real router, real mocked data, real forms" | `design-prototype` |

Rule of thumb: if the answer to *"does any button actually need to do something?"* is **no**, you want `screen-sketch`.

## Entry points

- **Via `init-frontend-project`'s dispatcher** (primary). A sketch brief routes here automatically.
- **Directly**. Invoke this skill if the user is already in a project/folder and asks for more sketches.

## Priority rule

If a `CLAUDE.md` exists at the target folder root, **it outranks this skill**. Announce any conflict before acting.

## Prerequisites

- `chrome-devtools` MCP connected — this skill **requires** it for the visual-feedback loop. If absent, warn the user and offer to produce sketches blind, noting the limitation in the hand-off.
- A target directory path. Ask once if not given. Can be anywhere — no Vue project needed.

## What this skill produces

Inside `<target>/sketches/`:

```
sketches/
├── canvas.html         # Figma-like canvas viewer (copied from skill asset, pre-built, do not edit)
├── screens.js          # manifest — array of { path, width, height, title } loaded by canvas.html
├── home.html           # one HTML file per screen (a.k.a. artboards)
├── dashboard.html
├── settings.html
└── ...
```

Plus screenshots in `<target>/.review/` (same convention as `design-prototype`).

Each artboard is a standalone HTML — CDN header + one artboard, opens by double-click. No `package.json`, no `node_modules`. The user's primary entry point is `canvas.html` — double-clicking it shows every sketch at once on a pannable, zoomable board (like opening a Figma page). Individual artboards still work standalone if opened directly.

## Stack (CDN-only)

Every sketch loads exactly these four resources from CDN:

| Resource | URL | Purpose |
|----------|-----|---------|
| Inter Variable font | `https://rsms.me/inter/inter.css` | Default font, loaded as variable woff2 |
| Tailwind Play CDN | `https://cdn.tailwindcss.com` | Utility classes with in-browser JIT |
| Iconify Web Component | `https://code.iconify.design/iconify-icon/3.0.0/iconify-icon.min.js` | `<iconify-icon icon="material-symbols:home">` anywhere |
| Vue 3 global build | `https://unpkg.com/vue@3/dist/vue.global.prod.js` | Only for `v-for` / `v-bind` to de-duplicate repeated items — **no** `ref`/`computed`/reactive state |

Images: `https://picsum.photos/seed/<any-string>/<w>/<h>` — seed makes them deterministic between reloads.

## Autonomy contract

After the initial brief-to-screen-list confirmation, run autonomously. Do not ask again until done or stuck. One progress update per phase (sketches created / review pass N / done). Do **not** narrate every HTML write.

## Steps

### 1. Parse the brief into a screen list + Design DNA

Read the brief once. Produce **one** block in this shape, then wait for a **single** go/no-go:

```
Brief:      [one-line paraphrase]
Viewport:   [desktop 1440×900 | mobile 375×812 — pick one, ask if unclear]
Style DNA:  mood     — [clean | editorial | playful | brutalist | content-first — pick one]
            accent   — [blue-600 | emerald-600 | red-500 | violet-600 | amber-500 — one Tailwind hue]
            density  — [comfortable (py-4, gap-6, card p-6) | compact (py-2, gap-3, card p-4)]
            scale    — [standard 12/14/16/20/24/32 | editorial 14/16/18/24/30/40]
            icons    — [material-symbols outline | material-symbols filled — pick ONE fill style]
Screens:    [home.html — landing/hero, ...]
            [dashboard.html — list of items, ...]
            [settings.html — account options, ...]
Vocabulary: [any non-standard elements — charts, maps, video — flag them so you know what to fake]
```

Do not propose A/B options. Pick one plan; user says "go" or redirects.

**Every sketch in the batch stays consistent with this DNA.** Same accent, same density, same type scale, same icon family and fill style. If screen 1 is editorial+amber+compact, screen 2 can't slide into clean+blue+comfortable — that's DNA drift and will be caught in review. LLMs love to unconsciously reset style between files; resist it by referring back to the DNA block before each new sketch.

### 2. Copy the template per screen

For each screen listed:

1. Copy `assets/template.html` to `<target>/sketches/<screen>.html`.
2. Set the `<title>` to the screen name.
3. Replace the `<!-- TODO -->` marker inside `#app` with the screen's content, built from the vocabulary below.

**No artboard wrapper.** The page *is* the artboard — the iframe in `canvas.html` sizes itself from `screens.js` (1440×900 or 375×812). Do not add `w-[1440px] min-h-[900px] mx-auto bg-white shadow-sm` wrappers inside the body: the canvas viewer already supplies the frame, title, border and canvas background. Adding one produces a white card-in-card with wasted padding. Let `body` (`bg-white`, 0 margin in the template) fill the iframe edge-to-edge.

If the screen has repeated items (card grid, list rows, avatar stack), put the array in the Vue `data()` block at the bottom and `v-for` over it — avoids copy-paste and makes iteration cheaper.

### 3. Wire up the canvas viewer

Two things in this step:

1. **Copy the pre-built canvas viewer.** `assets/canvas.html` → `<target>/sketches/canvas.html`. This is a ~500KB single-file Vue 3 app (built separately, shipped as a static asset). **Do not edit it, do not regenerate it, do not try to build it from source here** — treat it as an opaque binary. If it looks wrong, the fix is in the canvas source project (`tools/canvas-builder/`), not in this skill.

2. **Generate `sketches/screens.js`** — the manifest `canvas.html` reads at runtime:

```js
window.SCREENS = [
    { path: "home.html", width: 1440, height: 900, title: "Home" },
    { path: "dashboard.html", width: 1440, height: 900, title: "Dashboard" },
    { path: "settings.html", width: 1440, height: 900, title: "Settings" },
];
```

Field rules:
- `path` — filename relative to `canvas.html`. Since sketches sit next to it, just the filename.
- `width` / `height` — the viewport picked in step 1. Every entry in a batch uses the same pair (desktop 1440×900 or mobile 375×812).
- `title` — human-readable name; take it from the step 1 screen list (e.g. `home.html — landing/hero` → `"Home"`).

Order of the array = reading order on the canvas. Frames auto-flow left-to-right, wrapping when the row exceeds ~4000px. Group related screens next to each other in the array.

When the user opens `sketches/canvas.html`, the viewer reads `screens.js`, renders each sketch as an iframe on an infinite pannable canvas, and auto-fits everything into view. Toolbar at the bottom has zoom in/out, fit-all, and 100%. Double-click a frame to fit just that frame. Wheel zooms around the cursor.

**Important for `file://`:** the viewer loads `screens.js` via a `<script>` tag, so it works from disk without a server (unlike `fetch` on JSON, which Chrome blocks on `file://`).

### 4. Visual review loop

For each sketch, repeat until it passes the polish checklist or three iterations fail to improve:

1. `mcp__chrome-devtools__new_page` (first time) / `navigate_page` → URL `file:///<absolute-path>/sketches/<screen>.html` (forward slashes on Windows too).
2. `mcp__chrome-devtools__resize_page` to exactly the artboard size (1440×900 or 375×812) — so the screenshot shows the artboard edge-to-edge without surrounding canvas.
3. `mcp__chrome-devtools__take_screenshot` → save to `<target>/.review/<screen>-pass<N>.png`.
4. `mcp__chrome-devtools__list_console_messages` → any error breaks the sketch (usually a CDN blocked or a typo in an icon name).
5. Score the screenshot against the polish checklist below.
6. If defects exist, edit the `.html` directly. No extra skill, no store, no component — it's one file.
7. Refresh the page (`navigate_page` to the same URL), repeat from step 3.

### 5. Hand-off

When every sketch passes:

```
Project:    [target path]
Open:       file:///<abs-path>/sketches/canvas.html   ← main entry point (all sketches on one canvas)
Sketches:   [list of individual file:// URLs for direct access]
Screens:    [final screenshot paths under .review/ — gitignored, so spell them out]
Viewport:   [desktop 1440×900 | mobile 375×812]
Stack:      Pure HTML + Tailwind CDN + Vue 3 global + Iconify + Inter Variable (no build) for sketches;
            pre-built canvas viewer shipped as static asset.
Next:       [one line — e.g. "promote the approved sketches to a working prototype via design-prototype", "tighten copy on dashboard", "add an empty-state sketch for zero projects"]
```

No commit. Sketches live in `sketches/` which is under the user's discretion — if they want it tracked, they `git add sketches/` themselves. `.review/` stays gitignored.

## Vocabulary — inline Tailwind snippets for the common pieces

Memorise these. Write directly; don't build a component layer.

### Typography

| Purpose | Snippet |
|---------|---------|
| Page title (h1) | `<h1 class="text-3xl font-semibold text-neutral-900">Title</h1>` |
| Section title (h2) | `<h2 class="text-xl font-semibold text-neutral-900">Section</h2>` |
| Card title | `<h3 class="font-semibold text-neutral-900">Card</h3>` |
| Body text | `<p class="text-sm text-neutral-700">...</p>` |
| Muted / caption | `<p class="text-sm text-neutral-500">...</p>` |
| Micro-label | `<span class="text-xs uppercase tracking-wider text-neutral-500">Label</span>` |
| Breadcrumb | `<div class="text-sm text-neutral-500">Workspace / Section</div>` |
| Data number (tabular) | `<span class="tabular-nums font-medium text-neutral-900">$1,240.00</span>` |

**Weight hierarchy.** Headings `font-semibold` (600) or `font-bold` (700); labels/buttons `font-medium` (500); body `font-normal` (400). Don't push everything to semibold — it flattens the page.

**Line length.** Body paragraphs should sit in the `max-w-prose` (~65ch) band on desktop. Edge-to-edge long text reads as a wall.

### Interactive-looking elements (purely visual — no handlers)

| Purpose | Snippet |
|---------|---------|
| Primary button | `<button class="h-10 px-4 rounded-md bg-neutral-900 text-white text-sm flex items-center gap-2">Action</button>` |
| Secondary button | `<button class="h-10 px-4 rounded-md border border-neutral-300 text-sm text-neutral-700 flex items-center gap-2">Action</button>` |
| Ghost button | `<button class="h-10 px-3 rounded-md text-sm text-neutral-600 flex items-center gap-2">Action</button>` |
| Text input | `<div class="h-10 px-3 border border-neutral-300 rounded-md flex items-center text-sm text-neutral-400">Placeholder</div>` |
| Tag / pill | `<span class="text-xs px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">Tag</span>` |
| Badge (number) | `<span class="text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white">3</span>` |

### Structural

| Purpose | Snippet |
|---------|---------|
| Top navbar | `<header class="h-16 px-8 flex items-center justify-between border-b border-neutral-200">` |
| Sidebar | `<aside class="w-60 h-full border-r border-neutral-200 p-4">` |
| Card | `<div class="p-5 rounded-lg border border-neutral-200">...</div>` |
| Card with image | `<article class="rounded-lg border border-neutral-200 overflow-hidden">` |
| Divider | `<hr class="border-neutral-200">` |

### Spacing tokens (4/8-rhythm)

Everything sits on a 4px/8px grid. Pick gaps from this ladder, never from arbitrary values like `py-[13px]` or `gap-3.5`.

| Token | Tailwind | Use for |
|-------|----------|---------|
| Inline gap | `gap-2` (8px) | Icon ↔ label, tag rows, inline controls |
| Row gap | `gap-3` / `gap-4` (12 / 16px) | List row items, form row elements |
| Card inner padding | `p-5` / `p-6` (20 / 24px) | Default card body |
| Between cards in grid | `gap-6` (24px) | Card grids, dashboard tiles |
| Between sections | `space-y-12` (48px) | Major content sections on a page |
| Page gutter (desktop) | `px-8` (32px) | Main container horizontal inset |
| Page gutter (mobile) | `px-4` (16px) | Main container on 375px |

**Section spacing tiers**: 16 / 24 / 32 / 48px — within-card, between-cards, between-subsections, between-sections. Nothing in between.

### Icon sizing tokens

| Token | Size | Tailwind text-* equivalent | Use for |
|-------|------|----------------------------|---------|
| sm | 16px | `text-base` | Inline-with-text-sm, dense rows |
| md | 20px | `text-xl` | Default icon in buttons, inline with body |
| lg | 24px | `text-2xl` | Nav icons, card headers, primary actions |

Pick one token family per sketch. Never mix 18 / 22 / 26 arbitrarily.

**One icon family, one fill style.** Stay in `material-symbols:` and commit to either all-outline (`:search`, `:settings`, `:home`) or all-filled (`:search`, `:settings`, `:home` + variant `-rounded` or `-fill`). Mixing filled + outline at the same hierarchy level looks amateur. The DNA block in step 1 fixes this for the whole batch.

### Media

| Purpose | Snippet |
|---------|---------|
| Avatar (sm / md / lg) | `<img src="https://picsum.photos/seed/u1/40/40" class="h-10 w-10 rounded-full">` |
| Hero image | `<img src="https://picsum.photos/seed/hero/1200/400" class="w-full aspect-[3/1] object-cover">` |
| Card thumbnail | `<img src="https://picsum.photos/seed/x/600/320" class="aspect-video w-full object-cover">` |
| Stacked avatars | `<div class="flex -space-x-2"><img class="h-7 w-7 rounded-full border-2 border-white">...</div>` |

### Icons

```html
<!-- Inherit currentColor from Tailwind text-* class -->
<iconify-icon icon="material-symbols:home" class="text-xl text-neutral-500"></iconify-icon>

<!-- Explicit size -->
<iconify-icon icon="material-symbols:settings" width="20"></iconify-icon>
```

Common icons: `material-symbols:home`, `:search`, `:notifications-outline`, `:add`, `:filter-list`, `:more-vert`, `:close`, `:check`, `:chevron-right`, `:arrow-back`, `:chat-outline`, `:task-alt`, `:trending-up`, `:person-outline`, `:settings`, `:menu`, `:edit`, `:delete`, `:star-outline`. For anything else, search `material-symbols:` on [icon-sets.iconify.design](https://icon-sets.iconify.design/material-symbols/).

### Colour palette (grayscale + one accent)

Stick to Tailwind's `neutral-*` scale for surface/text, plus **one** accent colour per sketch (e.g., `blue-600`, `emerald-600`, `red-500`). Over-colouring makes a sketch look like finished work when it isn't.

- `text-neutral-900` — primary text
- `text-neutral-700` — body
- `text-neutral-500` — muted / icons / captions
- `bg-neutral-100` — canvas background (around the artboard)
- `bg-neutral-200` — subtle fills
- `border-neutral-200` — default borders
- `bg-neutral-900 text-white` — primary button / dark header

## Polish checklist (each sketch must pass all)

Grouped into four buckets — a failure in an earlier bucket blocks work on later ones.

### 1. Must not break

- **No console errors.** A `404` on a CDN or `iconify-icon not registered` means a resource failed — fix before anything else.
- **All images render.** No broken-image icons. `picsum.photos` URLs must load — check console for 4xx.
- **All icons render.** No empty squares where `<iconify-icon>` should be. A missing icon name fails silently and leaves a blank spot.
- **Inter is applied.** If text falls back to system sans-serif (bold `g` has a single-storey loop, numbers look cramped), `rsms.me` failed to load.

### 2. Structure & viewport

- **Content fits the declared viewport.** Body fills the iframe edge-to-edge (1440×900 or 375×812 — same values you put in `screens.js`). No horizontal scroll inside the page. Do not wrap content in a `w-[1440px] ... shadow-sm` artboard div — that's the canvas viewer's job.
- **No adaptivity tricks.** No `sm:`, `md:`, `lg:` prefixes. Sketch is locked to the declared viewport.
- **Content priority visible.** Most important info sits top-left / above the fold on desktop; top on mobile. A scannable glance should land on the primary thing first.

### 3. Hierarchy & rhythm

- **Size hierarchy visible.** h1 > h2 > h3 > body is distinguishable by size. If every line looks the same size, fix it.
- **Weight hierarchy visible.** Headings 600-700, labels/buttons 500, body 400. Don't set everything to semibold — it reads as "nothing is important" because everything is.
- **Spacing is 4/8-rhythm.** Gaps come from the Spacing tokens table above. No `gap-3.5`, no `py-[13px]`, no `mt-[22px]`. Arbitrary values are a smell.
- **Section spacing follows tiers.** Within-card 16px, between-cards 24px, between-subsections 32px, between-sections 48px. Nothing in between.
- **Line length controlled.** Body paragraphs ≤ ~65ch (use `max-w-prose`). Full-bleed long text reads as a wall and kills hierarchy.
- **Whitespace is intentional.** Empty space groups related items and separates unrelated ones. Cramming and random gaps both fail.

### 4. Style consistency (across the screen AND across the batch)

- **Only one accent colour.** Count non-neutral hues. More than one means the sketch is pretending to be a final design.
- **One primary CTA per screen.** One solid dark button. Secondary actions are outline or ghost. Two competing primaries force the eye to pick — don't make the user pick.
- **One icon family + one fill style.** All `material-symbols:` and all-outline, or all-filled. No mixing filled and outline at the same hierarchy level. Sizes come from the sm/md/lg tokens only.
- **Density matches DNA.** If the DNA block says `compact`, the whole batch is compact. No sliding into `comfortable` on screen 3 because "this one had more content".
- **Type scale matches DNA.** Same scale across every screen in the batch. Screen 1's h1 is the same size as screen 2's h1.
- **Tabular numbers on data.** Prices, quantities, timestamps, any numeric column that stacks vertically — use `tabular-nums` so digits align. Proportional digits in a table of prices is an instant "looks off" giveaway.
- **Placeholder copy reads real.** "Acme Analytics — Q2 revenue up 12% vs Q1" beats "Lorem ipsum dolor sit amet". If the sketch is for a recipe app, the card titles are recipe names, not placeholder gibberish. Reviewers judge the design through the copy.

## Failure modes — stop and ask

- **Three iterations on the same defect without improvement.** Describe what you tried, ask.
- **User asks for interactivity** (real form validation, real data, real routing). Explain that `screen-sketch` is draft-only; offer to re-dispatch to `design-prototype`.
- **`chrome-devtools` MCP not connected.** Warn; build blind; note the limitation in hand-off.

## Common pitfalls

| Pitfall | Why it's wrong | Fix |
|---------|----------------|-----|
| Wrapping content in a `w-[1440px] min-h-[900px] mx-auto bg-white shadow-sm` artboard div | The canvas viewer already provides the frame, title, border and canvas background. Adding another artboard inside the iframe produces a card-in-card with wasted outer padding | Let `body` (bg-white, 0 margin) fill the iframe; the iframe itself is sized from `screens.js` |
| Using Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) | Sketches are single-viewport; prefixes imply adaptive design that isn't there | Strip all breakpoint prefixes |
| Writing `ref()` / `computed()` / `watch` in the Vue block | This is a sketch, not a prototype; reactivity belongs to `design-prototype` | Plain `data()` with static arrays, only for `v-for` de-duplication |
| Using Nuxt UI components like `<UButton>`, `<USkeleton>`, `<UCard>` | Nuxt UI isn't loaded in this stack; those are for `design-prototype` | Use the vocabulary above — plain HTML + Tailwind |
| Swapping the CDN URLs for pinned versions | Pinning rots; Play CDN auto-updates | Use the URLs verbatim from the Stack table |
| Adding a `package.json` or `npm install` step | Kills the "open by double-click" contract | No build step. Ever. |
| Using `<img src="./local.png">` for mock images | Local files break when the user moves the sketches folder | `https://picsum.photos/seed/<name>/<w>/<h>` only |
| More than one accent colour | Turns a sketch into a pretend final design | Pick one accent; everything else stays neutral-* |
| Mixing filled and outline icons at the same hierarchy level | Looks like two designers fought | Lock fill style in the DNA block; stick to it for the whole batch |
| Two or more primary CTAs competing on the same screen | Forces the user to pick; destroys the "one clear next step" feel | Exactly one solid dark button per screen; the rest outline/ghost |
| Random spacing values breaking the 4/8 rhythm (`py-[13px]`, `gap-3.5`, `mt-[22px]`) | Kills visual rhythm; reads as "AI didn't care" | Pick from the Spacing tokens table. If something doesn't fit, change the layout, not the number |
| Wall-of-text paragraphs with no visual break | Body copy that runs edge-to-edge past 80ch reads as unreviewed | `max-w-prose`, bullet lists, or split into cards |
| Lorem ipsum or off-domain placeholder copy | Forces the reviewer to judge the layout without context and usually fails | Write copy that fits the product — product names, realistic numbers, real section titles |
| DNA drift across the batch (screen 1 editorial+amber+compact, screen 2 clean+blue+comfortable) | Makes the set read as separate projects, not one product | Re-read the DNA block before starting each new sketch; verify in review pass |
| Inconsistent icon sizes (18 / 22 / 26 mixed arbitrarily) | Nothing feels aligned | Icons come from sm/md/lg tokens (16/20/24) only |
| Narrating every file write during review | Wastes the user's attention | One progress update per phase |
