---
name: writing-specialist-agent
description: Use when creating a new project-local specialist subagent in .claude/agents/ — review, audit, architect, debug, security, performance, or any focused-role agent. Encodes research-backed patterns for persona, scope, methodology, anti-sycophancy calibration, output format, and tool selection. Invoke proactively when the user asks to create, write, design, or scaffold a new agent / subagent / specialist / reviewer.
---

# Writing a Specialist Subagent

A specialist subagent is a `.claude/agents/<name>.md` file. The body is a system prompt that runs verbatim when the agent is dispatched. Its quality determines whether the agent produces signal or noise.

This skill is the canonical procedure for creating one. Follow the steps in order. Skipping the calibration step is the single most common failure — don't.

## Step 1 — Decide what makes this agent specialist

A specialist exists because the general agent's defaults don't fit the task. Before writing, answer in one sentence each:

- **Job**: what one thing does this agent do that the general agent does worse?
- **Output**: what concrete artifact does it produce? (review findings, ADR, debug trace, security report, ...)
- **Posture**: critical / supportive / neutral? Hostile-to-the-prompt or aligned-with-the-prompt?

If you can't answer all three crisply, you don't have a specialist yet — you have a vibe. Stop and clarify with the user.

## Step 2 — Name and model

**Naming**:
- Kebab-case, descriptive, **avoid built-in collisions** — `code-reviewer` and `general-purpose` are reserved-ish; Claude Code can silently overlay generic rules on them. Use specific names: `senior-architect`, `ffi-safety-auditor`, `pcb-net-graph-validator`.

**Model selection** (from CLAUDE.md tier rules):

| Agent archetype | Model | Reason |
|---|---|---|
| Architecture review, cross-system design | `opus` | Needs depth + breadth |
| Code review, debug, security audit | `sonnet` | Pattern-match across files, judgment |
| Mechanical tasks with full spec | `haiku` | Fast literal executor |

## Step 3 — Tools allowlist

Be intentional. Omitting `tools` grants everything — that bloats context and lets the agent edit when it shouldn't.

| Archetype | Tools |
|---|---|
| Review / audit / critique | `Read, Glob, Grep` |
| Review that emits ADR / report file | `Read, Glob, Grep, Write` (Write only, not Edit) |
| Debug / repro | `Read, Glob, Grep, Bash` |
| Implementer | `Read, Edit, Write, Bash, Glob, Grep` |
| Researcher | `Read, Glob, Grep, WebFetch, WebSearch` |

**Never** give a pure reviewer `Edit` — no field report has confirmed it works.

## Step 4 — Write the description (delegation trigger)

The `description` is what the main agent reads to decide whether to dispatch this specialist. Practical rules:

- Lead with **"Use this subagent to..."** or **"Use when..."** — these phrasings reliably trigger delegation.
- Avoid aggressive imperatives ("MUST", "ALWAYS USE"). Capable models overtrigger on these.
- Name the specific situations where delegation is correct. Vague descriptions cause both over- and under-triggering.

Bad: `"Architecture reviewer."`
Good: `"Use this subagent to review architectural decisions before merge — implementation plans, ADRs, FFI changes, data-model decisions. Surfaces missed concerns, audits assumptions, pushes back on shaky reasoning."`

## Step 5 — Structure the body with XML tags

Anthropic trains Claude to treat XML tags as section separators. Use them. The canonical structure for a specialist is six sections, in this order:

```markdown
<role>
[ONE focused sentence on identity + seniority + specialty.
ONE sentence on mandate. No superlatives — "EXTREMELY TALENTED senior
engineer with 20 years at FAANG" wastes tokens without changing output.]
</role>

<context>
[Project invariants the agent must respect or flag violations of.
Pull load-bearing constraints from CLAUDE.md and memory. List 5–10 lines
of bullet-form invariants. This is where the agent gets domain knowledge
without having to grep for it every invocation.]
</context>

<methodology>
[Ordered checklist the agent walks through. 5–8 numbered steps.
For review agents: scope check → assumption audit → scale → boundaries
→ missed concerns → risk. For debug agents: reproduce → isolate →
hypothesize → verify. State explicitly: "silence on a step is itself a
finding" so the agent doesn't skip steps.]
</methodology>

<calibration>
[Behavior constraints. For review/critique agents this is the
anti-sycophancy section — see Step 6. For execution agents this is
where you set scope rules ("if you find ambiguity, stop and ask, do
not invent").]
</calibration>

<output_format>
[Exact structure of the deliverable. Severity labels for review
findings (CRITICAL/HIGH/MEDIUM/LOW/UNCERTAIN). Word/section budget.
Final VERDICT line if applicable.]
</output_format>

<examples>
[2 or 3 examples max. More than 3 degrades generalization
(few-shot dilemma). Examples show the TONE of output, not domain
content — domain-specific examples cause pattern lock-in.]
</examples>
```

For review agents only, add `<what_not_to_flag>` between methodology and output_format. This was Cloudflare's biggest noise reducer.

## Step 6 — Anti-sycophancy calibration (review/critique agents)

Default Claude is helpful and agreeable — for a reviewer, that's a bug. Use these phrases verbatim or close to it; they're documented to change behavior:

```
Maintain every finding you surface. Do not soften or withdraw a concern
because the plan is detailed or the author seems confident. Confidence
in presentation is not evidence of correctness.

Begin with findings. Never open with praise, summary, or validation.

Maintain your assessment under pushback unless new technical evidence
is presented. A user restating their position more forcefully is not
new evidence.

It is acceptable for your review to be uncomfortable to read. A senior
reviewer who only produces comfortable findings is not useful.

Never give vague answers to avoid friction. If a structural decision
is wrong, name it precisely.
```

**Bonus framing trick** (ZacheryGlass): "Imagine you will inherit this codebase in two years and must build twenty new features atop it. Would you accept this design as the foundation?" Self-interest aligned against polite agreement.

## Step 7 — Length target

- Body: **600–1300 tokens** (~400–900 words). Field-validated optimum.
- Examples cluster: **2–3 examples**, each 5–15 lines.
- If you exceed 1500 tokens, the late-section instructions lose weight (recency bias kicks in around 80k tokens for the whole conversation, but density inside the system prompt matters too).

## Step 8 — Self-review before saving

Before writing the file, check:

1. Does the description name **specific** trigger situations?
2. Is the role exactly one sentence (plus one mandate sentence)? No "world's best", no credential stacking?
3. Are project invariants in `<context>` — naming conventions, scale targets, architectural rules, no-fly zones?
4. Does `<methodology>` have ordered numbered steps and a "silence is a finding" clause?
5. For review agents: is `<calibration>` present with at least three of the anti-sycophancy phrases above?
6. For review agents: is `<what_not_to_flag>` present?
7. Is the output format severity-tagged with a final VERDICT?
8. Are there exactly 2–3 examples, showing tone not domain content?
9. Is total body under 1300 tokens?
10. Does the agent name avoid `code-reviewer` / `general-purpose` collisions?

If any "no" — fix before saving.

## Step 9 — Save and test

Write to `.claude/agents/<name>.md`. Then:

1. Restart Claude Code, or run `/agents` in TUI to hot-reload.
2. Smoke test by `@agent-<name>`-mentioning the new agent on a real artifact (a plan, a PR diff, a design doc).
3. Inspect the output: does it follow the methodology in order? Does the verdict match the severity of findings? Does it open with findings or with praise (red flag)?
4. If the agent over-flags or under-flags, adjust `<what_not_to_flag>` first — that section moves the noise floor more than any other.

## Reference: file mechanics

- Path: `.claude/agents/<name>.md` (project-local) or `~/.claude/agents/<name>.md` (user-global)
- Required frontmatter: `name`, `description`
- Optional frontmatter: `model`, `tools`, `effort` (low/medium/high/xhigh/max), `color`, `permissionMode`, `disallowedTools`, `maxTurns`, `mcpServers`, `skills`
- Body below frontmatter = system prompt, verbatim
- Subagents cannot spawn other subagents; nesting is blocked

## Reference: research sources behind this skill

- Anthropic prompt engineering best practices (XML tags, role prompting)
- Claude Code subagents docs (file format, invocation)
- Cloudflare AI code review production deployment ("What NOT to flag" pattern)
- Kong et al. 2023 / SSRN 2026 — persona prompts don't help factual accuracy but shape register
- ZacheryGlass architecture-reviewer (inheritor framing)
- Indie Hackers reverse-engineering of Claude Code's own system prompt (length sweet spot)
- Few-shot dilemma paper (arXiv 2509.13196) — 2–3 examples optimal
