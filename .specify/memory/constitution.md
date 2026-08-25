<!--
Sync Impact Report
- Version change: (none) → 1.0.0
- Modified principles: initial ratification
- Added sections: Core Principles (I–X), Product Constraints, Development Workflow, Governance
- Removed sections: none
- Deferred TODOs: none
-->

# Perso Constitution

## Core Principles

### I. Capture Must Stay Invisible
Every durable trace MUST be capturable in under 5 seconds, or collected
without a dedicated form. If a flow requires a long narrative to save an
event, the flow is non-compliant and MUST be redesigned. The phone is the
primary capture surface. Confirmation of inferred traces MUST be optional
and interruptible.

**Rationale**: A personal life OS dies if logging becomes a second job.

### II. The Original Trace Is Sacred
Raw captures (text, photo pointer, amount, timestamp, place, person) MUST
be stored as facts. Derived labels, summaries, and AI interpretations MUST
be stored separately and MUST never overwrite or replace the original.
Deleting an interpretation MUST leave the original intact.

**Rationale**: Ten years later, the proof matters more than today's guess.

### III. Universal Timeline
Every meaningful occurrence MUST become a timestamped Event. Domain objects
(expense, person, place, media, document, task, note, asset, business, meal)
MUST attach to Events rather than live as disconnected silos. A day replay
MUST be reconstructible from Events and their relations.

**Rationale**: "What did I do on Tuesday?" is the core question of the product.

### IV. Pointers Over Heavy Files
The app MUST NOT become a dump of original HD photos, videos, or large
files. Heavy media MUST be referenced (Drive, iCloud, local path, later
storage) with metadata, thumbnail/preview when available, and a resolvable
pointer. The pointer MUST survive even if the file is temporarily
unreachable; the UI MUST say so instead of inventing a substitute.

**Rationale**: Memory of where a file lives is more durable than copying it.

### V. Source And Confidence On Every Datum
Every Event and derived claim MUST record a Source (manual, OCR, photo,
location, bank, inference, import) and a Confidence (certain vs inferred).
Inferred items MUST be visually and verbally distinct from confirmed facts.
The product MUST NEVER present a guess as a fact.

**Rationale**: Self-discipline requires an honest ledger, not a hallucinated one.

### VI. Life Must Be Queryable
Saving is worthless if traces cannot be retrieved. The primary consultation
surface MUST accept natural questions about time, money, people, places,
media, documents, and commitments. Structured filters are allowed; they
MUST NOT replace the question box. Answers MUST cite the underlying Events
and proofs when those exist.

**Rationale**: The value is "interrogate your life", not "archive 10 000 rows".

### VII. Personal Truth Over Motivation
Insights, scores, and coaching MAY exist only if they are computed from
recorded behavior versus stated intent. Motivational copy without evidence
is forbidden. A score MUST be explainable from countable traces (done,
missed, spent, met, postponed). Features that judge without data MUST NOT
ship.

**Rationale**: Discipline is confrontation with reality, not slogans.

### VIII. One-Person Privacy
This is a sovereign personal system for a single owner. Data MUST be treated
as private by default. Sharing, public links, social graphs, and analytics
for third parties are out of constitution unless an amendment explicitly
allows them. Secrets, documents, and relationship notes MUST NOT leak into
logs, crash reports, or model prompts without redaction rules defined in
the plan.

**Rationale**: A total life ledger is a high-value target and a high-trust object.

### IX. Nucleus First
Implementation MUST follow the published phases. V1 is Memory (timeline,
events, expenses, people, places, media pointers, notes, documents, tasks /
commitments, natural-language retrieval). V2 is Understanding. V3 is
Discipline. V4 is Automation. A later-phase capability MUST NOT block or
inflate V1. Scope expansion requires a constitution-compatible spec change.

**Rationale**: Building the whole OS at once produces an unusable empty cathedral.

### X. Spec Before Code
Work on Perso MUST follow Spec-Driven Development: constitution → specify →
clarify (if needed) → plan → tasks → analyze → implement → converge.
Application code MUST NOT start from a vibe prompt that contradicts an
active spec. If code and spec diverge, the spec is updated first or the
code is brought back into spec.

**Rationale**: This product is a long-lived personal system; drift is expensive.

## Product Constraints

- **Audience**: a single owner (the user of this repo), not a multi-tenant
  social product.
- **Primary client**: mobile. Desktop/web MAY come later; they MUST NOT
  redefine capture.
- **Declared stack (planning constraint, not a spec leak)**: Expo, Tamagui,
  Supabase. Google Maps is deferred (later). Additional tools MAY be added
  in a plan only if they serve a specified user need.
- **Language**: product copy MAY be French-first; data is stored in the
  owner's language as captured.
- **Currency**: amounts MUST preserve the captured currency; FCFA is a
  first-class expected currency, not a hard exclusive.
- **Offline**: capture MUST succeed when the network is poor; sync MAY be
  eventual. A failed sync MUST NOT drop a local Event.
- **Integrations**: banks, Wave / Orange Money / MoMo, Drive, calendar,
  contacts, background location, and camera rolls belong to V4 unless a
  spec explicitly pulls a thin slice forward.

## Development Workflow

1. Change product behavior only through an active feature spec under
   `specs/`.
2. Keep `flow.md` as the source vision document. It is not executable.
   Specs treat it; they do not replace it silently.
3. Prefer one independently testable user story per increment.
4. UI work MUST be verified on a real mobile flow (open, capture, retrieve),
   not only a static screen.
5. Do not add a settings jungle. Prefer one capture path and one ask path.
6. Tests MUST cover Event integrity (timestamp, source, relations) and
   retrieval of a day, an amount, and a person.

## Governance

This constitution supersedes informal notes, chat decisions, and
motivational feature lists when they conflict.

- **Amendments**: change this file, bump the version (MAJOR for principle
  removal/redefinition, MINOR for new principle/section, PATCH for wording),
  update Last Amended, and record a Sync Impact Report comment.
- **Compliance**: plans, specs, and PRs MUST state how they honor Capture,
  Original Trace, Timeline, Pointers, Source/Confidence, Queryability,
  Privacy, and Nucleus First.
- **Exceptions**: a later-phase feature MAY be prototyped only as a
  clearly labeled spike that does not merge into the V1 data model as a
  silent requirement.
- **Guidance**: executable requirements live in `specs/`; this file states
  non-negotiable rules only.

**Version**: 1.0.0 | **Ratified**: 2026-08-24 | **Last Amended**: 2026-08-24
