# Neo — Personal Market Intelligence

Neo reads the news, newsletters, podcasts and feeds you already follow, then writes one morning briefing about what happened, through your own lens: your role, your market and your goals.

Most news is written for everyone, so it isn't about anyone. You tell Neo who you are once, and every story is explained in terms of your situation, with a source and a timestamp on each one.

**Live:** https://neo-flax-theta.vercel.app

## What it does

- **One briefing from many sources.** Publications, Substack newsletters, podcasts, YouTube channels, Reddit, Hacker News, Google News and GDELT, filtered to the last 24 hours and de-duplicated, including against your previous briefing so you never see a story twice.
- **A personal lens.** Your role, market and goals shape what is kept, what is dropped and why each story matters to you.
- **Three depths.** Scan (8 stories, two sentences each), Read (12 stories with context) and Deep (5 stories, full analysis).
- **Three voices.** Analyst, Journalist or Advisor, plus an expertise setting that controls how much jargon is explained.
- **Every story attributed.** Each item names its source and how long ago it was published, and every briefing links to the sources behind it.
- **Delivered every morning.** By email, and on a dashboard where you can generate one on demand, browse history and change your settings.

## How it works

```
 Sign up → Onboarding (topics, sources, lens, voice)
                │
                ▼
        profiles table (Supabase)
                │
  Vercel Cron ──┤   daily
                ▼
   /api/cron  ── dispatches one request per user ──┐
                                                   ▼
                              /api/generate-briefing   (own 60s invocation per user)
                              1. fetch sources in parallel (24h window)
                              2. de-duplicate and rank
                              3. Claude writes the briefing for the user's lens (their own key)
                              4. save to briefings table
                              5. email via Gmail SMTP
```

The dashboard calls the same `/api/generate-briefing` endpoint, so a manual briefing and a scheduled one take the same path. The cron only dispatches work. Each user is generated in a separate serverless invocation so no single run has to finish everyone inside Vercel's 60-second limit.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 14 (App Router), TypeScript |
| Styling | Tailwind CSS, hand-written design tokens |
| Auth and database | Supabase (Postgres, Auth, row level security) |
| AI | Google Gemini, OpenAI or Anthropic, using each user's own API key |
| Email | Gmail SMTP through Nodemailer |
| Hosting and scheduling | Vercel (Hobby plan is enough) |
| Runtime and package manager | Bun |

Everything runs on free tiers. Each user brings their own AI key (Gemini has a free tier; OpenAI and Anthropic are paid), so the AI cost is theirs.

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/jeet-totla/neo.git
cd neo
bun install
```

### 2. Create the database

Create a project at [supabase.com](https://supabase.com), open the SQL editor and run [`supabase/schema.sql`](supabase/schema.sql). It creates the `profiles` and `briefings` tables with row level security.

In **Authentication → URL Configuration**, add your site URL and `http://localhost:3000/auth/callback` to the redirect URLs.

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Same page. Server only, never exposed to the browser |
| `ENCRYPTION_KEY` | Any long random string, for example `openssl rand -hex 32`. Encrypts the AI keys users add. Keep it safe: if it changes, saved keys can no longer be read |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | A Gmail account with 2-step verification on, then Google Account → Security → App passwords |
| `CRON_SECRET` | Any random string, for example `openssl rand -hex 32` |
| `NEWSAPI_KEY` | Optional. Extra coverage from [newsapi.org](https://newsapi.org) |

### 4. Run it

```bash
bun run dev
```

Open http://localhost:3000, create an account, finish onboarding and generate your first briefing from the dashboard.

### 5. Deploy

1. Push to GitHub and import the repository in [Vercel](https://vercel.com).
2. Add the same environment variables in **Project Settings → Environment Variables**.
3. Deploy. Vercel reads [`vercel.json`](vercel.json) and runs the daily cron automatically, sending `CRON_SECRET` as a bearer token.

Always run `bun run build` locally before pushing. A failed build on Vercel keeps the previous deployment live, but it is faster to catch it on your machine.

## Project structure

```
app/
  page.tsx                  Landing page
  login, signup, forgot-password, reset-password
  onboarding/               Topics → sources → lens → voice
  dashboard/                Today, history and settings
  privacy, terms
  api/
    generate-briefing/      Generates, saves and emails one briefing
    cron/                   Daily dispatcher
  auth/                     Supabase callback and sign out
components/                 Logo, icons, auth and legal layouts
lib/
  briefing-engine.ts        Source fetching, ranking and the Claude prompt
  mailer.ts                 Gmail SMTP and the email template
  catalog.ts                Topics, publications and podcasts people can pick
  supabase/                 Browser, server, admin and middleware clients
supabase/schema.sql         Database schema and row level security
```

## Limits and design decisions

- **Bring your own key.** Users add a Gemini, OpenAI or Anthropic API key in onboarding. It is verified, encrypted with AES-256-GCM and stored in a table that only the server can read. The browser only ever learns the last four characters.
- **Cost control.** Each account can generate five briefings per rolling 24 hours, and the cron skips anyone who already received one recently.
- **Scale.** One cron run starts up to 25 briefings. That keeps a run inside Vercel's time limit and Gmail's daily sending cap (about 500 messages). Past a few hundred users, move email to a transactional provider and raise the batch size.
- **One delivery time.** The Hobby plan allows one cron per day, so every briefing goes out at the same time (11:00 UTC) rather than at a time you choose.
- **Freshness over volume.** Only stories from the last 24 hours are used, and stories from your previous briefing are removed.

## Design

The interface follows a small set of rules: a warm paper palette with one ember accent, a display serif only for large headlines, a monospace for datelines, line icons at one size, a 4px spacing grid, and light glass used only where real content sits behind it. Design principles are adapted from [unslop](https://github.com/heydamir/unslop) by Damir Sokolovsky (CC BY 4.0).

## Want one for your company?

I build custom market intelligence systems that track a sector, its competitors and sources, and send a team a briefing on a schedule.

Email [jeettotla@gmail.com](mailto:jeettotla@gmail.com).
