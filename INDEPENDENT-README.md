# Tailored Vacancy Research — Independent v1

This is the first independent version derived from the verified Manus project.

## What changed

- Removed the Manus runtime plugin from the build.
- Removed Manus OAuth/storage registration from the server startup path.
- Added a single-user local context so the site does not require Manus login.
- Preserved the canonical policy v2026-08-22.2 and the existing vacancy tracker/ingestion logic.
- Added `tracker.importResearch`, which validates and ingests a structured AI result through the existing tracker.
- Added an **Import AI results** UI so ChatGPT/Gemini/Claude/Manus output can be pasted as JSON and published without editing the database.
- Preserved sourceUrl deduplication, first_seen_at, last_seen_at, refresh audits and NEW · 7 DAYS.

## Important current limitation

The application still uses the existing MySQL/Drizzle persistence layer. This is intentional for this first build milestone: the next deployment step is to choose and wire a genuinely free persistent database/hosting combination. Do not interpret this archive as already deployed to a public production URL.

## Research contract

The expected import payload is:

```json
{
  "requestCode": "FIND-XXXXXXXX",
  "runLabel": "AI research",
  "vacancies": [
    {
      "sourceUrl": "https://example.com/job",
      "sourceLabel": "Employer",
      "company": "Example",
      "title": "Senior Software Engineer",
      "region": "Europe remote",
      "workModel": "Remote — Europe",
      "matchScore": 90,
      "freshness": "Fresh",
      "freshnessDetail": "Verified today",
      "intro": "...",
      "proof": ["..."],
      "caveat": "...",
      "tags": ["Node.js", "AWS"],
      "dimensions": [{"label":"Node / TS","value":95}],
      "rawRequirements": "..."
    }
  ]
}
```

The server remains authoritative: external AI output is untrusted and is screened before database writes.


## Current independent architecture

The project is designed for a free-first deployment: Vercel Hobby for the app/API and Supabase Free for persistent PostgreSQL. The research layer is provider-agnostic. The zero-API-key path is: Search New Vacancies -> copy the authoritative request into any research-capable AI -> paste structured JSON into Import AI Results. The protected /api/research/import endpoint is available for a future agent that can submit results directly.
