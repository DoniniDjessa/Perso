# Quickstart — Perso (Dépenses, TODOs, Agenda)

## 1. Env

The app reads `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

The service role key is **not** used by the mobile client.

## 2. Schema

In the Supabase SQL editor, run `supabase/migrations/001_init.sql`.

Enable Email auth in Authentication → Providers.

## 3. Run

```bash
npm install
npx expo start --web
```

Or scan the QR code with Expo Go.

## 4. First use

Create an account on the login screen, then add a dépense, a TODO, and an agenda event.
