# Scheduled Vacancy Research — Private Write Model

## Purpose

The vacancy researcher runs twice daily at **07:00 and 19:00 Europe/Warsaw**. It searches live public career pages and reputable boards, then writes only source-verified eligible results to the project tracker.

## Access Boundary

The researcher works in the project workspace and writes through the private command below:

```bash
cd /home/ubuntu/tailored-job-vacancy-report
pnpm tsx scripts/ingest-scheduled-refresh.ts /tmp/tailored-vacancy-refresh.json
```

The command is not an HTTP route and cannot be invoked from a browser. It parses the local JSON payload and sends it through `server/tracker.ts`, which remains the authoritative gate for employer exclusions, Tech Lead/Architect titles, Java, Angular, English C1, senior-Python-led requirements, schema validity, source-URL deduplication, audit rows, and the seven-day NEW window.

No user API key, job-board login, or external connector is required for public sources. The only required capability is the project’s scheduled-research task having access to its own workspace and managed database runtime. The database is not exposed publicly and the former public ingestion route is not mounted.

## Durable Storage

| Table | Purpose |
|---|---|
| `vacancies` | Active source-linked shortlist. `source_url` is unique and is the deduplication key. |
| `refresh_runs` | Immutable audit for each accepted submission: received, accepted, updated, rejected, timing, and reasons. |
| `tracker_configs` | Last result state, timestamp, message, scheduled-task identity, and NEW window. |

## Controlled First-Run Evidence

On **19 August 2026**, the private command processed an official Fundraise Up Poland-remote Senior Backend Engineer source. The first execution recorded **1 accepted** and inserted one active, non-baseline vacancy. A second execution with the same original source URL recorded **0 accepted / 1 updated**, proving the duplicate guard updated the existing record rather than inserting another. The website renders this role with a **NEW · 7 DAYS** marker and the tracker state as successful.

Source-level checks that failed the saved filters remain recorded in `direct_write_test_research.md`; no rejected role was inserted.
