# CryptoLearn

An interactive course that teaches **how crypto is transferred on the Ethereum
blockchain** — from blockchain architecture to signing your first transaction.

This is the **app skeleton**: full auth, database schema, progress tracking, and
UI/data flow are implemented. All teaching material (lesson bodies and question
text) is intentionally **empty** for now — only the structure exists.

## Stack

- **React + Vite + TypeScript** (frontend)
- **Supabase** (auth + Postgres database with Row Level Security)
- **React Router** (routing)

## Course structure

4 sections, 23 lessons (see `src/data/course.ts` — the single source of truth):

1. **Blockchain & Ethereum Architecture** (5 lessons)
2. **Types of Cryptocurrencies & the Major Coins** (6 lessons)
3. **Wallet Architecture** (5 lessons)
4. **Transactions** (7 lessons)

Each lesson currently has 3 empty practice-question slots (`QUESTIONS_PER_LESSON`).

## Setup

### 1. Create the database tables

Open your Supabase project → **SQL Editor** → paste and run the contents of
[`supabase/schema.sql`](./supabase/schema.sql). This creates:

- `accounts` — profile (email, username, DOB), keyed to the auth user
- `course_progress`, `section_progress`, `lesson_progress`, `question_progress`

All tables have Row Level Security so each user can only see/modify their own rows.

> **Email confirmation:** by default Supabase requires email confirmation before
> login. For quick local testing, turn it off under
> **Authentication → Providers → Email → "Confirm email" (off)**.

### 2. Configure environment

`.env` is already filled in with your project URL and the **public anon key**
(safe to expose — RLS protects the data). To use a different project, edit `.env`.

### 3. Run

```bash
npm install
npm run dev
```

Open http://localhost:5173 → sign up → you land on the course dashboard.

## How the data flow works

`question_progress` is the **source of truth**. When a user completes a question:

1. The question's row is upserted (`completed = true`).
2. The lesson is recomputed (complete when **all** its questions are) and persisted.
3. The section and course rollups are recomputed and persisted.

So all four progress tables always agree, and the UI reflects them:

- **Green checkmarks** on completed sections / lessons; dots for questions.
- **Resume button** jumps to the first question still marked `false`, in order.
- **Reset** buttons (question / lesson / section / whole course) flip rows back to
  `false` and re-roll-up — the resume target updates accordingly.

Core logic lives in `src/services/progress.ts`; the React binding is
`src/hooks/useProgress.ts`.

## Adding material later

Fill in `content`, `prompt`, and `visual` fields in `src/data/course.ts`. Nothing
else needs to change — the UI and progress flow are already wired to the structure.
