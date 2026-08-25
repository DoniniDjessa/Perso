# Implementation Plan: Starter Dépenses / TODOs / Agenda

**Branch**: `001-life-memory-core` | **Date**: 2026-08-24 | **Spec**: [spec.md](./spec.md)

**Input**: Narrowed V1 slice requested by owner: only expenses, todos, and agenda, with `icon.jpg` branding, `.env.local` Supabase credentials, floating bottom tabs (mockup 1) and profile sidebar (mockup 2).

## Summary

Ship a single-owner Expo (React Native) app with Tamagui UI and Supabase Auth + Postgres. First increment is Home + Dépenses + TODOs + Agenda. Capture stays under 5 seconds. Heavy life-OS features stay out.

## Technical Context

**Language/Version**: TypeScript, React 19, Expo SDK 57

**Primary Dependencies**: Expo Router, Tamagui, `@tamagui/lucide-icons`, `@supabase/supabase-js`, `@react-navigation/drawer`

**Storage**: Supabase Postgres (RLS per `auth.uid()`). Client uses URL + anon key from `.env.local` (`NEXT_PUBLIC_*`). Service role MUST NEVER ship in the app.

**Testing**: Manual flow on Expo Web / device. SQL migration in `supabase/migrations`.

**Target Platform**: iOS / Android / Web (Expo). Phone-first.

**Project Type**: mobile-app

**Performance Goals**: Capture save feels instant; lists of a few hundred rows remain scrollable.

**Constraints**: Offline-tolerant later; V1 requires network for sync. French UI. FCFA default.

**Scale/Scope**: One owner. 5 tab roots + sidebar. 3 entities.

## Constitution Check

- Capture Must Stay Invisible: add sheets with amount/title + save only.
- Original Trace Is Sacred: rows are facts; no AI overwrite.
- Universal Timeline: Home reconstructs today from the 3 entities.
- Pointers Over Heavy Files: N/A this slice.
- Source And Confidence: source = manual, confidence = certain.
- Life Must Be Queryable: deferred (Ask tab out of this slice).
- Personal Truth Over Motivation: Home shows counts, not scores.
- One-Person Privacy: RLS; no sharing.
- Nucleus First: this slice is the nucleus of the nucleus.
- Spec Before Code: this plan + narrowed screens.

## Project Structure

```text
app/
  _layout.tsx
  (auth)/login.tsx
  (app)/_layout.tsx          # drawer
  (app)/(tabs)/_layout.tsx   # floating pill tabs
  (app)/(tabs)/index.tsx     # Home
  (app)/(tabs)/depenses.tsx
  (app)/(tabs)/todos.tsx
  (app)/(tabs)/agenda.tsx
  (app)/expense-modal.tsx
  (app)/todo-modal.tsx
  (app)/agenda-modal.tsx
lib/supabase.ts
lib/env.ts
components/navigation/*
supabase/migrations/001_init.sql
assets/images/icon.jpg|png   # from icon.jpg
```

**Structure Decision**: Expo Router app in repository root (not a monorepo). Spec Kit artifacts stay in `.specify/` and `specs/`.
