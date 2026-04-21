# vskill — Design Skills for Claude Code

**Owner**: Kyle Nekto (`nekto@veydlin.com`)
**Upstream**: Forked from [jezweb/claude-skills](https://github.com/jezweb/claude-skills) (MIT) — narrowed to design-only skills.

Design-focused skills for Claude Code CLI. Every skill produces visible output (pages, components, design systems, audit reports) and — where relevant — reviews that output multimodally via the `chrome-devtools` MCP.

## Philosophy

- Every skill must produce visible output (files, configurations, deployable projects)
- "The context window is a public good" — only include what Claude doesn't already know
- **Teach patterns, not ship scripts** — skills teach Claude *what* to do, Claude generates scripts adapted to the user's environment. Pre-built scripts in `scripts/` are the rare exception, not the default. Put proven implementation patterns in `references/` for Claude to adapt.
- Follows the official Claude Code plugin spec

## Directory Structure

```
claude-skills/
├── plugins/
│   └── vskill/                             # 1 plugin, 17 skills — Vue 3 + Nuxt UI design stack
│       ├── .claude-plugin/plugin.json
│       └── skills/
│           ├── init-frontend-project/      # Scaffold Vue 3 + Nuxt UI project; ships CLAUDE.md as an asset
│           ├── stack-reference/            # Canonical stack definition — packages, folder layout, patterns, VS Code workspace
│           ├── add-api-endpoint/           # Recipes — each produces a specific file type inside a scaffolded project
│           ├── add-store/
│           ├── add-composable/
│           ├── add-component/
│           ├── add-form/
│           ├── add-page/
│           ├── debug-common-errors/
│           ├── design-prototype/           # Autonomous brief→scaffold→build→screenshot→self-critique→iterate loop
│           ├── design-review/              # Visual design quality review
│           ├── design-system/              # Extract a design system into docs/DESIGN.md
│           ├── ux-audit/                   # Exhaustive UX audit with 8-scenario battery
│           ├── ux-extract/                 # Extract a reusable pattern library from a reference app
│           ├── ux-compare/                 # Compare pattern libraries
│           ├── responsiveness-check/       # Breakpoint sweep with screenshots
│           └── onboarding-ux/              # Audit onboarding gaps + generate in-app guidance
├── .claude-plugin/                         # Marketplace config
│   └── marketplace.json
├── CLAUDE.md                               # This file
├── README.md                               # Public-facing overview
└── LICENSE                                 # MIT
```

**What this fork is for:** skills that let Claude *make* a design, *build it* out of a canonical Vue 3 + Nuxt UI stack, and *see* the result — UI generation plus multimodal visual feedback (screenshots, DOM inspection, console) via the `chrome-devtools` MCP.

### Skill layers

- **Scaffold** (`init-frontend-project`) — drops `CLAUDE.md` at the target project root. That file is the project's behavioural contract and outranks every skill in this plugin.
- **Reference** (`stack-reference`) — canonical Vue 3 + Nuxt UI stack definition (packages, folder layout, API/store/composable patterns, naming, tooling, VS Code workspace). Not shipped as a file in the project root; consulted on demand so stack updates roll out through the plugin without touching cloned projects.
- **Recipes** (`add-api-endpoint`, `add-store`, `add-composable`, `add-component`, `add-form`, `add-page`, `debug-common-errors`) — each produces a specific file type. They cross-reference each other but never batch multiple produce-types into one step.
- **Design** (`design-prototype`, `design-review`, `design-system`, `ux-audit`, `ux-extract`, `ux-compare`, `responsiveness-check`, `onboarding-ux`) — higher-level skills that drive the recipes, review UI visually, or extract/audit UX.

### Priority contract

Every skill announces the same rule: if the target project has `CLAUDE.md` at its root, that file **outranks the skill**. The skills are defaults — the project's own instructions override them. `init-frontend-project` is what places `CLAUDE.md` in a new project. The stack architecture lives in the `stack-reference` skill, not in the project, so stack evolution propagates through the plugin rather than decaying inside every cloned project.

## Plugin Anatomy (Anthropic Spec)

Each plugin contains one or more skills, auto-discovered from `skills/`:

```
plugin-name/
├── .claude-plugin/
│   └── plugin.json        # name, description, author
└── skills/
    └── skill-name/
        ├── SKILL.md       # Frontmatter + instructions (inline everything critical)
        ├── ERRATA.md      # Optional: versioned corrections discovered during builds
        ├── scripts/       # Executable scripts the agent RUNS (not reads)
        ├── references/    # Supplementary/variant docs (NOT critical path)
        └── assets/        # Files used in output (templates, images)
```

## Adding a New Plugin

1. Create the plugin directory:
   ```bash
   mkdir -p plugins/my-plugin/{.claude-plugin,skills}
   ```

2. Create `.claude-plugin/plugin.json`:
   ```json
   {
     "name": "my-plugin",
     "description": "What this plugin does.",
     "author": { "name": "Kyle Nekto", "email": "nekto@veydlin.com" }
   }
   ```

3. Add skills inside `plugins/my-plugin/skills/` (each with SKILL.md)

4. Add an entry to `.claude-plugin/marketplace.json`:
   ```json
   { "name": "my-plugin", "description": "...", "source": "./plugins/my-plugin", "category": "development" }
   ```

5. Update the directory tree in this file and the table in README.md

**Categories**: `development`, `design`, `productivity`, `testing`, `security`, `database`, `monitoring`, `deployment`

## Creating a Skill

Use [Anthropic's official skill-creator](https://github.com/anthropics/skills/blob/main/skills/skill-creator/SKILL.md) or ask Claude: "Create a new skill for [use case]"

Key principle: **every skill must produce something.** If it's just reference material Claude already knows, it doesn't earn a place here.

### Skill Design: Inline Everything Critical

**If the agent skipping it would derail the workflow, it goes in SKILL.md.** Reference files are for genuinely optional material — variant-specific docs, supplementary examples, historical context. Anything on the critical path must be inline.

This was learned the hard way: an agent was told "see references/stitch-direct.md for the curl commands." It skipped the file entirely and tried to use the website in a browser instead. The critical commands were 20 lines away in a reference file. It never read them.

| Content type | Where it goes | Example |
|-------------|--------------|---------|
| Workflow steps, commands, scripts | **SKILL.md body (inline)** | curl commands, Python scripts, mapping tables |
| Executable helper scripts | `scripts/` | Agent runs them without reading (fine) |
| Variant/optional docs | `references/` | Platform-specific variants (AWS vs GCP) |
| Templates copied into user projects | `assets/` | React boilerplate, config files |

**Why not reference files for critical content?** When a skill loads, SKILL.md goes directly into context. The agent sees it immediately. Reference files require a deliberate choice to read another file — an extra decision point that LLMs deprioritise in favour of acting. The instruction to "go read file X" competes with the instruction to "do the task" and loses.

**No file size anxiety.** The old 500-line limit was a context economics rule from the 200K era. A 500-line skill is ~2500 tokens — 0.25% of 1M context, 1.25% of 200K. Even on smaller contexts, a working skill that's 800 lines beats a broken skill that's 300 lines with critical content in references the agent never reads.

### Frontmatter Validation

- `name`: kebab-case, lowercase letters/digits/hyphens, max 64 characters
- `description`: max 1024 characters, no angle brackets. Include trigger phrases.
- Optional: `license`, `compatibility`, `allowed-tools`, `metadata`

## Installing Plugins

```bash
# Add marketplace (one-time)
/plugin marketplace add VeyDlin/vskill

# Install the plugin
/plugin install vskill@vskill

# Local dev (loads the plugin without install)
claude --plugin-dir ./plugins/vskill
```

After installing, restart Claude Code to load the plugin.

## Quality Bar

Before committing a skill:
- [ ] SKILL.md has valid YAML frontmatter (name: kebab-case max 64 chars, description: max 1024 chars)
- [ ] Everything on the critical path is inline in SKILL.md (no "see references/" for must-do steps)
- [ ] Produces tangible output (not just reference material)
- [ ] Tested by actually using it on a real task
- [ ] Rich enough that the agent doesn't need to improvise — include exact commands, scripts, mapping tables
- [ ] Not brutally summarised — detail is better than brevity when the detail prevents mistakes

## Skill Errata (ERRATA.md)

When a skill's instructions are correct at one point but a library update changes behaviour, capture the correction in `ERRATA.md` alongside the SKILL.md rather than immediately rewriting the skill.

**Status lifecycle**: `active` (current correction) → `absorbed` (folded into SKILL.md) → `outdated` (library changed again)

Only for version-specific issues. Small typos or obvious mistakes should just be fixed in SKILL.md directly.

## Fork Scope

`vskill` is a design-only subset of the upstream repo, further consolidated into a single plugin and extended with a Vue 3 + Nuxt UI recipe chain plus an autonomous design-prototype loop.

Kept from upstream: a UX-focused subset of the original `frontend` and `dev-tools` skills (visual review, UX audit, pattern extraction/comparison, responsive sweep, design-system extraction, onboarding UX). Those skills have been merged into the single `vskill` plugin and patched so their defaults match the Vue 3 + Nuxt UI stack (no Tailwind-specific examples, no React Router references, project docs outrank the skill).

Added on top: `init-frontend-project` (scaffolds the canonical stack and ships `CLAUDE.md` as an asset), `stack-reference` (canonical stack definition consulted on demand instead of being copied into every project), seven recipe skills (`add-api-endpoint`, `add-store`, `add-composable`, `add-component`, `add-form`, `add-page`, `debug-common-errors`), and `design-prototype` (the autonomous loop that chains all of the above).

Removed from upstream: everything else (cloudflare, integrations, writing, shopify, wordpress, social-media, web-design, design-assets, the non-UX dev-tools skills — project-health, brains-trust, git-workflow, deep-research, roadmap, vitest, etc.), plus upstream-specific publishing infrastructure (`tools/statusline-npm/`, `publish-contextbricks.yml`) and author-private artifacts. The original `design-loop` skill was also removed — its React/Tailwind assumptions conflicted with the Vue 3 stack; `design-prototype` replaces it.

Upstream history (105-skill v1 collection, archive branches) lives in the upstream repo, not this fork.
