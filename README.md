# PlacePrep (placeprep.me)

Placement-test practice for many students at once. The first track is the **Infosys Systems Engineer** online assessment:

- **Full proctored mocks** that follow the reported SE pattern: sectional timers, no going back to a finished section, full-screen enforcement, tab-switch warnings
- **Unlimited topic practice** with instant answers and explanations
- **Student analytics and personal recommendations**
- **Admin panel** to monitor students and their behaviour, with a block list and an audit log

## Local development

```bash
npm install
cp .env.example .env        # put your email in ADMIN_EMAILS
createdb placeprep          # local Postgres (or set DATABASE_URL to Supabase)
npm run db:migrate          # applies drizzle/ migrations
npm run dev                 # http://localhost:3000
```

You need Node 20 or newer. Sign up with an email listed in `ADMIN_EMAILS` and you'll land in `/admin`. Admins can promote other users from the panel.

| Script | What it does |
|---|---|
| `npm test` | Runs the question-generator checks (every topic × 400 seeds), exam-flow, admin-query and rate-limit tests on a throwaway local Postgres DB (`placeprep_test`, recreated each run) |
| `npm run typecheck` | Runs `tsc --noEmit` |
| `npm run db:generate` | Creates a new migration after you edit `src/db/schema.ts` |
| `npm run db:studio` | Opens Drizzle Studio to browse the database |

## Deploying to placeprep.me

The recommended setup is one small VPS (AWS EC2 / Lightsail, DigitalOcean, Hetzner; 1–2 vCPU and 2 GB RAM is enough) running Docker. Caddy gets and renews the HTTPS certificate for you.

1. **DNS:** where you bought the domain, add `A` records for `placeprep.me` and `www.placeprep.me` pointing to the server's public IP.
2. **Server:** install Docker. Open ports 80 and 443 only.
3. **Deploy:**
   ```bash
   git clone <your repo> placeprep && cd placeprep
   cp .env.production.example .env.production   # set DATABASE_URL (Supabase) and ADMIN_EMAILS
   docker compose up -d --build
   ```
   On boot the app applies database migrations automatically (`src/instrumentation-node.ts`). The database is your Supabase Postgres; nothing is stored on the VPS.
4. **Update:** `git pull && docker compose up -d --build`
5. **Backups:** Supabase takes daily backups (paid plans add point-in-time recovery). For your own copy:
   ```bash
   pg_dump "$DATABASE_URL" -Fc -f backups/placeprep-$(date +%F).dump
   ```

**Serverless (Vercel) instead?** Use Supabase's *transaction pooler* URL (port 6543); the client already disables prepared statements for it. The in-memory rate limiter is per instance there, so move it to Redis/Upstash if abuse becomes a problem.

## Handling many students

The things that matter when a whole batch is logged in at once:

- **Postgres connection pool** (`src/db/index.ts`, size via `DATABASE_POOL`, default 10). Keep it under your Supabase plan's pooler limit.
- **Set-based writes.** Grading a whole test is one `UPDATE … CASE` plus one `UPDATE` with sub-selects for the score, not one query per question. Creating a test is one transaction.
- **Atomic counters.** Time spent per question and violation counts are incremented in SQL (`x = x + ?`), so overlapping requests from the same student can't overwrite each other.
- **SQL aggregation for analytics.** `GROUP BY` and a `ROW_NUMBER()` window keep the last 40 answers per topic. Page cost stays flat no matter how much a student has practised.
- **Throttled "last seen" writes.** At most one per user per minute, and the session lookup runs once per request (React `cache`).
- **Rate limits:** login (per IP + email, and per IP), sign-up per IP, test starts per user, and exam API calls per user.

**Load test** (included; the numbers below were measured on the earlier SQLite build, so re-run against Postgres): 500 students each take the reasoning section at the same time, at about 15× real exam speed. Result: 9,500 requests, **p95 8 ms, p99 19 ms, 0 errors** on a single Node process. In a stress run where 300 students fire every request with no pauses, the server handled about 410 req/s with 0 errors; latency rises only because requests queue.

```bash
createdb placeprep_load
LOAD_USERS=500 DATABASE_URL=postgres://localhost:5432/placeprep_load npx vitest run --config scripts/load/vitest.load.config.ts
# start the app against placeprep_load (production build), then:
PACE_MS=4000 node scripts/load/run.mjs http://localhost:3000
```

When to outgrow this: once you're consistently in the thousands of *simultaneous* test-takers, add Redis for rate limits and run more than one app instance.

## Admin panel (`/admin`)

| Page | What it shows |
|---|---|
| Overview | Students, online now, active in 24 h, mocks and warnings in 24 h, mocks in progress (with live warning counts), flagged students, sign-ups chart |
| Users | Search, filters (active / flagged / blocked / admins), per-student answered count, mocks, average mock score, warnings |
| User detail | Section-wise preparation, every test, behaviour log (logins, failed logins, warnings with device/IP), login IPs, moderation, audit log |
| Activity | Site-wide event feed, filterable by type |
| Block list | Every blocked account with reason, when, by whom, and one-click unblock |

**Blocking** signs the student out on every device, closes any open test, and stops future logins with a "suspended" message. Every admin action (block, unblock, revoke sessions, role change) is written to `admin_actions`. Admins must be demoted before they can be blocked, and you can't block or demote yourself.

**Flagging:** 3 or more proctoring warnings, or any auto-submitted mock, in the last 7 days. Change `FLAG_VIOLATIONS_7D` in `src/lib/admin.ts`.

## Test pattern used

| Section | Questions | Time |
|---|---|---|
| Reasoning Ability | 15 | 25 min |
| Mathematical Ability | 10 | 35 min |
| Verbal Ability | 20 | 20 min |
| Pseudocode | 5 | 10 min |
| Numerical Puzzles | 4 | 10 min |
| Writing (essay) | 1 | 20 min |

There's no negative marking, and each section has its own cut-off. This is the most commonly reported pattern for recent drives; edit it in `src/lib/exam/pattern.ts`. The "practice targets" in the app are goals, not official cut-offs.

## Architecture

```
src/
  db/                  Drizzle schema (users, sessions, attempts, questions, events, admin_actions) + Postgres client (postgres.js)
  instrumentation*.ts  Runs migrations on production boot
  lib/
    auth.ts            bcrypt passwords, server-side sessions (hashed tokens), roles, blocking
    events.ts          Behaviour log (login, violations, test start/submit…)
    rate-limit.ts      Sliding-window limiter
    admin.ts           Admin queries (all SQL aggregates)
    questions/         Seeded question generators + original verbal banks
    exam/service.ts    Builds tests, server-authoritative timers, grading, violations
    analytics.ts       Topic mastery, readiness, mock history, recommendations
  app/
    (auth)/            Login / register
    (app)/             Student pages
    admin/             Admin panel + server actions
    attempt/[id]/      Full-screen exam runner
    api/attempts/[id]  Exam API (answer, submit, violation)
```

### What proctoring can and can't do

The browser checks are full-screen enforcement, tab and window switch detection, blocked copy/paste/right-click, blocked devtools shortcuts, and an optional local camera preview that is never recorded or uploaded. The admin panel shows the resulting warnings for each student. These checks recreate the *rules and pressure* of the real exam. They are not tamper-proof: nothing running in a browser can be.
