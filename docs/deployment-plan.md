# Independent deployment plan

The intended low-cost deployment is:

- Frontend + serverless API: Vercel Hobby.
- Persistent PostgreSQL: Supabase Free.
- AI provider: independent of the application; manual JSON import works without an AI API key.

The application does not require a paid AI API to perform the manual research/import workflow.

The deployment must not expose DATABASE_URL or RESEARCH_IMPORT_TOKEN to the browser.
