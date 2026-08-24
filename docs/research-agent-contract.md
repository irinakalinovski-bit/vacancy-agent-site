# Research Agent Contract

The vacancy site is independent of the model that performs web research.

## Manual mode

1. Click **Search new vacancies**.
2. Copy the authoritative research request.
3. Give it to any research-capable AI (ChatGPT, Gemini, Claude, Manus, etc.).
4. Ask the AI to return the structured JSON defined by `server/tracker.ts`.
5. Click **Import AI results** and paste the JSON.
6. The server validates and screens the result, deduplicates by `sourceUrl`, writes the refresh audit, and publishes accepted vacancies.

## Agent mode

`POST /api/research/import` accepts the same payload. It requires:

`Authorization: Bearer <RESEARCH_IMPORT_TOKEN>`

The token is deliberately kept server-side. The research agent must never receive database credentials.

## Required result envelope

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
      "freshnessDetail": "Verified 2026-08-22",
      "intro": "Why this role matches.",
      "proof": ["Evidence from the source page"],
      "caveat": "Any remaining uncertainty.",
      "tags": ["Node.js", "AWS"],
      "dimensions": [{"label":"Node / TS","value":95}],
      "rawRequirements": "Raw requirements from source"
    }
  ]
}
```

The application remains authoritative: an AI result is untrusted input and can be withheld by the server-side exclusion screen.


## Import contract

A result is imported as either `{ "requestCode": "FIND-...", "runLabel": "...", "vacancies": [...] }` or a raw vacancy array in the UI; the UI attaches the currently active request code. Each vacancy must satisfy `incomingVacancySchema`. Manual imports are accepted only once per request code. Direct agent submission uses `POST /api/research/import` with `Authorization: Bearer <RESEARCH_IMPORT_TOKEN>`.


## Paywall / payment exclusion

Research agents must exclude vacancies when access to the full vacancy, contact information, application process, or application submission requires payment, a paid subscription, premium membership, credits, or other paid service. This includes payment requirements revealed only at the final application step. Free registration, login, email verification, and free candidate profiles are allowed. The absence of information about payment is not evidence of a paywall. Unknown pricing, an unfamiliar platform, or lack of a statement that access is free must not cause withholding. Exclude only when the source provides positive evidence that payment is mandatory for access to the vacancy, essential vacancy information, contact, or application.
