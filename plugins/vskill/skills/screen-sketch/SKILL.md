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

### 1. Parse the brief into a screen list

Read the brief once. Produce **one** block in this shape, then wait for a **single** go/no-go:

```
Brief:      [one-line paraphrase]
Viewport:   [desktop 1440×900 | mobile 375×812 — pick one, ask if unclear]
Screens:    [home.html — landing/hero, ...]
            [dashboard.html — list of items, ...]
            [settings.html — account options, ...]
Vocabulary: [any non-standard elements — charts, maps, video — flag them so you know what to fake]
```

Do not propose A/B options. Pick one plan; user says "go" or redirects.

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

- **No console errors.** A `404` on a CDN or `iconify-icon not registered` means a resource failed — fix before anything else.
- **Content fits the declared viewport.** Body fills the iframe edge-to-edge (1440×900 or 375×812 — same values you put in `screens.js`). No horizontal scroll inside the page. Do not wrap content in a `w-[1440px] ... shadow-sm` artboard div — that's the canvas viewer's job, not the sketch's.
- **Hierarchy is visible.** h1 > h2 > body is distinguishable by size and/or weight. If every line looks the same, fix it.
- **Spacing scale is consistent.** Gaps are from `0.25 / 0.5 / 0.75 / 1 / 1.5 / 2 rem` — not random values like `gap-3.5`.
- **All images render.** No broken-image icons. `picsum.photos` URLs must load — check console for 4xx.
- **All icons render.** No empty squares where `<iconify-icon>` should be. A missing icon name fails silently and leaves a blank spot.
- **Inter is applied.** If the text falls back to system sans-serif (bold `g` has a single-storey loop, numbers look cramped), `rsms.me` failed to load.
- **Only one accent colour.** Count non-neutral hues. More than one means the sketch is pretending to be a final design.
- **No adaptivity tricks.** No `sm:`, `md:`, `lg:` prefixes. Sketch is locked to the declared viewport.

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
| Narrating every file write during review | Wastes the user's attention | One progress update per phase |
