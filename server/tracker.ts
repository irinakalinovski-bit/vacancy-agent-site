/**
 * VACANCY TRACKER — server-side policy and persistence.
 * Keep external research untrusted: this module rejects prohibited employers, titles and mandatory requirements before any write.
 */
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb } from "./db";
import { manualSearchRequests, refreshRuns, trackerConfigs, vacancies, vacancyPreferences } from "../drizzle/schema";
import { CANONICAL_RESEARCH_PLAYBOOK, CANONICAL_RESEARCH_PLAYBOOK_VERSION } from "./canonicalResearchPlaybook";

export const TRACKER_CONFIG_ID = "primary";
export const NEW_WINDOW_DAYS = 7;

const blockedCompanies = new Set([
  "allegro", "scalo", "antalpl", "antal pl", "alm services", "aircashback", "esurance", "capgemini", "iteamly", "edge1s", "spyrosoft", "blue language labs", "cloudfide", "inpost", "alten", "inuits", "link group", "aura", "playbook", "soft serve", "softserve", "volvo", "fyul", "wise", "revolut", "gitlab", "automattic",
]);

export const incomingVacancySchema = z.object({
  sourceUrl: z.string().url().max(1024),
  directApplicationUrl: z.string().url().max(1024).optional().nullable(),
  sourceLabel: z.string().min(2).max(128),
  company: z.string().min(2).max(255),
  title: z.string().min(2).max(255),
  region: z.enum(["Wrocław onsite/hybrid", "Poland remote", "Europe remote", "Cross-border remote", "Global remote"]),
  workModel: z.string().min(2).max(255),
  matchScore: z.number().int().min(0).max(100),
  freshness: z.enum(["Fresh", "Current", "Verify freshness", "Confirm eligibility"]).default("Current"),
  freshnessDetail: z.string().min(2).max(255),
  intro: z.string().min(10).max(1000),
  proof: z.array(z.string().min(2).max(300)).min(1).max(6),
  caveat: z.string().min(2).max(1200),
  tags: z.array(z.string().min(1).max(60)).min(1).max(10),
  dimensions: z.array(z.object({ label: z.string().min(1).max(30), value: z.number().int().min(0).max(100) })).min(1).max(6),
  rawRequirements: z.string().max(8000).optional().nullable(),
  sourcePublishedAt: z.coerce.date().optional().nullable(),
});

export const refreshSubmissionSchema = z.object({
  runLabel: z.string().max(200).optional(),
  requestCode: z.string().max(32).optional(),
  vacancies: z.array(incomingVacancySchema).max(80),
});

export const vacancyPreferenceInputSchema = z.object({
  vacancyId: z.number().int().positive(),
  status: z.enum(["saved", "hidden"]),
});

export type IncomingVacancy = z.infer<typeof incomingVacancySchema>;

function normalized(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/** Returns the non-negotiable reason that prevents a role entering the public tracker. */
export function rejectionReason(input: IncomingVacancy): string | null {
  const company = normalized(input.company);
  const title = normalized(input.title);
  const requirements = normalized(`${input.title} ${input.rawRequirements ?? ""} ${input.proof.join(" ")}`);
  const companyExcluded = Array.from(blockedCompanies).some((blocked) => company === blocked || company.includes(blocked));
  const titleIncludesPython = /\bpython\b/.test(title);
  const titleIncludesCoreNonPythonStack = /\bnode js\b|\bjavascript\b|\btypescript\b|\bphp\b|\bsymfony\b/.test(title);
  const pythonSecondary = /\bpython\b(?:\s+\w+){0,6}\s+(?:plus|optional|secondary)\b|\bpython\b(?:\s+\w+){0,6}\s+nice\s+to\s+have\b/.test(requirements);
  const pythonPrimary = !pythonSecondary && (/\bpython\b(?:\s+\w+){0,2}\s+(?:is\s+)?(?:primary|core|main|focused|required|mandatory)\b|\b(?:primary|core|main|focused|required|mandatory)(?:\s+\w+){0,2}\s+python\b/.test(requirements));
  const javaCore = /\bjava\b/.test(requirements);
  if (companyExcluded) return "Employer is on the exclusion list";
  if (/\btech lead\b|\btechnical lead\b|\barchitect\b/.test(title)) return "Tech Lead and Architect titles are excluded";
  if (javaCore) return "Java is required or referenced as a core skill";
  if (/\bangular\b/.test(requirements)) return "Angular is required or referenced as a core skill";
  if (/\benglish\s*(?:at\s*)?(?:level\s*)?c[1-9]\b|\bc[1-9]\s*(?:english|level)\b/.test(requirements)) return "English C1+ is required";
  // Payment is an exclusion only when the input contains positive evidence of a mandatory payment requirement.
  // Unknown pricing, optional paid features, or an unfamiliar board are NOT evidence of a paywall.
  const paywall = /\b(?:paywall|(?:paid|payment|subscription|premium|membership|credits?)\s+(?:access|fee|subscription|membership|service|plan)?\s*(?:is\s+)?(?:required|mandatory|needed)|(?:subscription|premium|membership)\s+(?:required|needed|mandatory)|(?:payment|fee)\s+(?:is\s+)?(?:required|mandatory|needed)|paid\s+to\s+(?:view|access|apply|apply\s+for)|pay\s+to\s+(?:view|access|apply)|application\s+fee|fee\s+to\s+apply|purchase\s+(?:credits|access)\s+(?:required|needed|mandatory)|credits\s+(?:required|needed|mandatory)|unlock\s+(?:the\s+)?(?:job|vacancy|application|details)\s+(?:requires?|with)\s+(?:payment|subscription|premium|credits?)|(?:free\s+trial|trial)\s+(?:requires?|needs?)\s+(?:payment|card|subscription)|(?:payment|card)\s+details\s+(?:are\s+)?required)\b/.test(requirements);
  if (paywall) return "Paid access or paywall is required";
  if (pythonPrimary || (titleIncludesPython && !titleIncludesCoreNonPythonStack)) return "Python-primary roles are excluded";
  return null;
}

const baseline: IncomingVacancy[] = [
  { sourceUrl: "https://justjoin.it/job-offer/future-mind-experienced-node-js-developer-mid-senior--warszawa-javascript-3e4c843f", sourceLabel: "JustJoin", company: "Future Mind", title: "Experienced Node.js Developer (Mid/Senior)", region: "Poland remote", workModel: "Fully remote · full-time / B2B", matchScore: 92, freshness: "Current", freshnessDetail: "Verified 18 Aug 2026", intro: "Deepest direct overlap with the documented modern backend toolkit and IoT-adjacent delivery.", proof: ["Node.js · TypeScript · NestJS", "PostgreSQL · Redis · MongoDB", "RabbitMQ / SQS · Docker · AWS · microservices"], caveat: "The public listing did not expose its complete criteria. Its company overview mentions Angular elsewhere, but not as a role requirement.", tags: ["NestJS", "AWS", "Messaging", "Microservices"], dimensions: [{ label: "Node / TS", value: 100 }, { label: "AWS cloud", value: 88 }, { label: "Architecture", value: 96 }, { label: "Full stack", value: 76 }, { label: "Work model", value: 100 }], rawRequirements: "Node.js TypeScript NestJS PostgreSQL Redis MongoDB RabbitMQ SQS Docker AWS microservices" },
  { sourceUrl: "https://www.remotefront.com/remote-jobs/b3-consulting-poland-senior-fullstack-developer-node-js-react-9bedb", sourceLabel: "RemoteFront", company: "B3 Consulting Poland", title: "Senior Fullstack Developer", region: "Poland remote", workModel: "Remote · geography to confirm", matchScore: 89, freshness: "Verify freshness", freshnessDetail: "Source shows 3 months old", intro: "An unusually broad match spanning recent Node/AWS work and earlier PHP/MySQL experience.", proof: ["Node.js · NestJS · TypeScript · React", "PostgreSQL · AWS · scalable architecture", "PHP / MySQL in legacy migration context"], caveat: "Verify that the company application page is still accepting candidates before investing application time.", tags: ["NestJS", "React", "AWS", "PHP"], dimensions: [{ label: "Node / TS", value: 100 }, { label: "AWS cloud", value: 87 }, { label: "Architecture", value: 88 }, { label: "Full stack", value: 100 }, { label: "Work model", value: 72 }], rawRequirements: "Senior fullstack TypeScript Node.js NestJS React PostgreSQL AWS PHP MySQL" },
  { sourceUrl: "https://www.remoterocketship.com/company/cujo-ai/jobs/senior-backend-engineer-node-js-typescript-aws-lithuania-remote/", directApplicationUrl: "https://www.comeet.com/jobs/cujo/C4.005/senior-backend-engineer-node_jstypescript-aws/", sourceLabel: "Remote Rocketship / Comeet", company: "CUJO AI", title: "Senior Backend Engineer, Node.js / TypeScript / AWS", region: "Cross-border remote", workModel: "Lithuania remote · confirm Poland eligibility", matchScore: 88, freshness: "Confirm eligibility", freshnessDetail: "Verified 18 Aug 2026", intro: "The technically closest international serverless role, with real message-stream and cloud-security scope.", proof: ["Lambda · API Gateway · Cognito · CDK", "DynamoDB · CloudFront · MSK", "Node / TypeScript · OAuth/OIDC · CI/CD"], caveat: "Confirm Poland-based engagement first. The post mentions learning other languages; it does not require existing Java or Angular experience.", tags: ["Serverless", "AWS CDK", "MSK", "Security"], dimensions: [{ label: "Node / TS", value: 100 }, { label: "AWS cloud", value: 100 }, { label: "Architecture", value: 94 }, { label: "Full stack", value: 55 }, { label: "Work model", value: 60 }], rawRequirements: "TypeScript Node.js AWS Lambda API Gateway Cognito CDK DynamoDB MSK REST CI/CD OAuth OIDC" },
  { sourceUrl: "https://remotar.com.br/job/157627/scopic-software/remote-senior-fullstack-javascript-developer", sourceLabel: "Remotar / Zohorecruit", company: "Scopic", title: "Senior Fullstack JavaScript Developer", region: "Global remote", workModel: "Fully remote · work from anywhere", matchScore: 86, freshness: "Fresh", freshnessDetail: "Updated 17 Aug 2026", intro: "Best explicitly global option for React, Node, TypeScript, API and AWS-preferred delivery.", proof: ["JavaScript / TypeScript across the stack", "Node.js · React · REST APIs", "Relational / NoSQL databases · AWS preferred"], caveat: "Strong English and cross-time-zone overlap are required. Cloud requirements are broad rather than serverless-specific.", tags: ["Global remote", "React", "Node.js", "AWS preferred"], dimensions: [{ label: "Node / TS", value: 100 }, { label: "AWS cloud", value: 76 }, { label: "Architecture", value: 82 }, { label: "Full stack", value: 100 }, { label: "Work model", value: 100 }], rawRequirements: "Senior JavaScript TypeScript Node.js React REST APIs databases AWS remote" },
  { sourceUrl: "https://www.remoterocketship.com/company/career-sigma-software/jobs/principal-javascript-node-js-engineer-poland-remote/", directApplicationUrl: "https://jobs.smartrecruiters.com/sigmasoftware2/744000144000200-principal-javascript-node-js-mcp-engineer", sourceLabel: "Remote Rocketship / SmartRecruiters", company: "Sigma Software Group", title: "Principal JavaScript / Node.js Engineer", region: "Poland remote", workModel: "Poland remote · full-time", matchScore: 76, freshness: "Current", freshnessDetail: "Verified 18 Aug 2026", intro: "A platform-architecture stretch with strong Node and distributed-systems overlap.", proof: ["TypeScript · Node.js · distributed systems", "APIs · SDKs · reusable platform components", "MCP / A2A / LLM tooling architecture"], caveat: "Principal scope and MCP/A2A experience are central. Treat it as a stretch rather than a first application.", tags: ["Platform", "Distributed systems", "MCP", "Principal"], dimensions: [{ label: "Node / TS", value: 100 }, { label: "AWS cloud", value: 52 }, { label: "Architecture", value: 100 }, { label: "Full stack", value: 54 }, { label: "Work model", value: 96 }], rawRequirements: "Principal TypeScript Node.js distributed systems API SDK MCP A2A" },
  { sourceUrl: "https://www.remoterocketship.com/gb/company/talentuch/jobs/fullstack-developer-node-typescript-react-native-europe-remote/", directApplicationUrl: "https://talentuch.breezy.hr/p/827e110b07cc-fullstack-developer-node-typescript-react-native-for-based-in-europe-candidates-only", sourceLabel: "Remote Rocketship / Breezy", company: "Talentuch", title: "FullStack Developer — Node, TypeScript, React Native", region: "Cross-border remote", workModel: "Europe remote · EST overlap", matchScore: 73, freshness: "Fresh", freshnessDetail: "Posted 4 days ago", intro: "A viable Europe-remote option with a solid backend stack, offset by mobile and schedule requirements.", proof: ["NestJS · Node.js · TypeScript · PostgreSQL", "REST · Docker / Linux · Prisma · Redis", "AWS / microservices / distributed systems desirable"], caveat: "React Native, app-store deployment and EST overlap are material gaps. Python/Django is a plus only.", tags: ["Europe remote", "NestJS", "PostgreSQL", "Mobile"], dimensions: [{ label: "Node / TS", value: 96 }, { label: "AWS cloud", value: 72 }, { label: "Architecture", value: 80 }, { label: "Full stack", value: 74 }, { label: "Work model", value: 54 }], rawRequirements: "Node.js TypeScript NestJS PostgreSQL REST Docker Linux Prisma Redis AWS microservices React Native" },
];

async function ensureConfig() {
  const db = await getDb();
  if (!db) return null;
  await db.insert(trackerConfigs).values({ id: TRACKER_CONFIG_ID, newWindowDays: NEW_WINDOW_DAYS }).onConflictDoNothing({ target: trackerConfigs.id });
  return db;
}

/** The initial researched shortlist is real source-linked data, not demo content. */
export async function ensureBaseline() {
  const db = await ensureConfig();
  if (!db) return;
  const existing = await db.select({ id: vacancies.id }).from(vacancies).limit(1);
  if (existing.length > 0) return;
  const firstSeenAt = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000);
  await db.insert(vacancies).values(baseline.map((item) => ({ ...item, directApplicationUrl: item.directApplicationUrl ?? null, rawRequirements: item.rawRequirements ?? null, sourcePublishedAt: null, firstSeenAt, lastSeenAt: new Date(), isBaseline: true, isActive: true }))).onConflictDoUpdate({ target: vacancies.sourceUrl, set: { lastSeenAt: new Date() } });
}

export async function getTrackerSnapshot() {
  const db = await ensureConfig();
  if (!db) return { vacancies: [], config: null, recentRuns: [] };
  const [config] = await db.select().from(trackerConfigs).where(eq(trackerConfigs.id, TRACKER_CONFIG_ID)).limit(1);
  const rows = await db.select().from(vacancies).where(eq(vacancies.isActive, true)).orderBy(desc(vacancies.matchScore), desc(vacancies.lastSeenAt));
  const runs = await db.select().from(refreshRuns).orderBy(desc(refreshRuns.startedAt)).limit(5);
  const now = Date.now();
  const windowMs = (config?.newWindowDays ?? NEW_WINDOW_DAYS) * 86_400_000;
  return {
    config,
    recentRuns: runs,
    vacancies: rows.map((row) => ({
      ...row,
      directApplicationUrl: row.directApplicationUrl ?? undefined,
      rawRequirements: undefined,
      isNew: !row.isBaseline && now - row.firstSeenAt.getTime() <= windowMs,
    })),
  };
}

/** Idempotently writes an agent-researched refresh payload after central policy screening. */
export async function ingestRefresh(payload: z.infer<typeof refreshSubmissionSchema>) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  const now = new Date();
  const [run] = await db.insert(refreshRuns).values({ status: "running", receivedCount: payload.vacancies.length, details: payload.runLabel ?? "Research import" }).returning({ id: refreshRuns.id });
  let acceptedCount = 0; let updatedCount = 0; let rejectedCount = 0;
  const reasons: string[] = [];
  try {
    for (const input of payload.vacancies) {
      const reason = rejectionReason(input);
      if (reason) { rejectedCount += 1; reasons.push(`${input.company}: ${reason}`); continue; }
      const [existing] = await db.select({ id: vacancies.id }).from(vacancies).where(eq(vacancies.sourceUrl, input.sourceUrl)).limit(1);
      const values = { ...input, directApplicationUrl: input.directApplicationUrl ?? null, rawRequirements: input.rawRequirements ?? null, sourcePublishedAt: input.sourcePublishedAt ?? null, lastSeenAt: now, isActive: true };
      if (existing) {
        updatedCount += 1;
        await db.update(vacancies).set(values).where(eq(vacancies.id, existing.id));
      } else {
        acceptedCount += 1;
        await db.insert(vacancies).values({ ...values, firstSeenAt: now, isBaseline: false });
      }
    }
    await db.update(refreshRuns).set({ status: rejectedCount ? "partial" : "success", acceptedCount, updatedCount, rejectedCount, details: reasons.slice(0, 12).join(" | ") || payload.runLabel || "Refresh completed", finishedAt: new Date() }).where(eq(refreshRuns.id, run.id));
    await db.update(trackerConfigs).set({ lastRefreshAt: new Date(), lastRefreshStatus: rejectedCount ? "partial" : "success", lastRefreshMessage: reasons.slice(0, 3).join(" | ") || payload.runLabel || "Refresh completed" }).where(eq(trackerConfigs.id, TRACKER_CONFIG_ID));
    if (payload.requestCode) {
      await db.update(manualSearchRequests).set({ status: "completed", completedAt: new Date(), resultSummary: `Refresh completed: ${acceptedCount} new, ${updatedCount} refreshed, ${rejectedCount} withheld.` }).where(eq(manualSearchRequests.requestCode, payload.requestCode));
    }
    return { acceptedCount, updatedCount, rejectedCount, reasons };
  } catch (error) {
    await db.update(refreshRuns).set({ status: "failed", acceptedCount, updatedCount, rejectedCount, details: String(error), finishedAt: new Date() }).where(eq(refreshRuns.id, run.id));
    await db.update(trackerConfigs).set({ lastRefreshAt: new Date(), lastRefreshStatus: "failed", lastRefreshMessage: String(error) }).where(eq(trackerConfigs.id, TRACKER_CONFIG_ID));
    if (payload.requestCode) {
      await db.update(manualSearchRequests).set({ status: "failed", completedAt: new Date(), resultSummary: String(error) }).where(eq(manualSearchRequests.requestCode, payload.requestCode));
    }
    throw error;
  }
}

export async function importResearchResult(raw: unknown) {
  const payload = refreshSubmissionSchema.parse(raw);
  if (!payload.requestCode) throw new Error("requestCode is required for a manual research import");
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  const [request] = await db.select().from(manualSearchRequests).where(eq(manualSearchRequests.requestCode, payload.requestCode)).limit(1);
  if (!request) throw new Error("Unknown research request code");
  if (request.status === "completed") throw new Error("This research request has already been imported");
  return ingestRefresh(payload);
}

export async function recordSchedule(taskUid: string, nextRefreshAt?: Date | null) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  await db.update(trackerConfigs).set({ scheduleCronTaskUid: taskUid, nextRefreshAt: nextRefreshAt ?? null }).where(eq(trackerConfigs.id, TRACKER_CONFIG_ID));
}

export function buildManualSearchPrompt(requestCode: string, requestedAt = new Date()) {
  return `AUTHORITATIVE RESEARCH REQUEST
Request ID: ${requestCode}
Requested at (UTC): ${requestedAt.toISOString()}
Canonical policy version: ${CANONICAL_RESEARCH_PLAYBOOK_VERSION}

The following canonical research policy is authoritative and included verbatim. Follow it exactly.

--- BEGIN CANONICAL RESEARCH POLICY ---
${CANONICAL_RESEARCH_PLAYBOOK}
--- END CANONICAL RESEARCH POLICY ---

GUIDED RESEARCH HANDOFF
Research live public sources according to the canonical policy, verify the original source page for every accepted vacancy, and report the vetted structured results back in this chat. The application will preserve its protected ingestion, sourceUrl deduplication, last_seen_at updates, first_seen_at for genuinely new vacancies, refresh-run audits, and NEW · 7 DAYS mechanism after the research result is returned. Do not request, display, or expose database credentials, secrets, or private write commands.`;
}

/** Records a deliberate search request; the companion chat performs the live research without requiring an API key in the site. */
export async function createManualSearchRequest(requestedByUserId: number) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  const requestCode = `FIND-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
  const requestedAt = new Date();
  const prompt = buildManualSearchPrompt(requestCode, requestedAt);
  await db.insert(manualSearchRequests).values({ requestCode, requestedByUserId, status: "requested", requestedAt });
  return { requestCode, prompt, status: "requested" as const, requestedAt };
}

export async function getLatestManualSearchRequest(requestedByUserId: number) {
  const db = await ensureConfig();
  if (!db) return null;
  const [request] = await db.select().from(manualSearchRequests).where(eq(manualSearchRequests.requestedByUserId, requestedByUserId)).orderBy(desc(manualSearchRequests.requestedAt)).limit(1);
  return request ? { ...request, prompt: buildManualSearchPrompt(request.requestCode, request.requestedAt) } : null;
}

/** Returns a signed-in user's private shortlist state without changing shared vacancy visibility. */
export async function getVacancyPreferences(userId: number) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  return db.select({ vacancyId: vacancyPreferences.vacancyId, status: vacancyPreferences.status }).from(vacancyPreferences).where(eq(vacancyPreferences.userId, userId));
}

/** Upserts a signed-in user's saved or hidden state after confirming the vacancy still exists. */
export async function setVacancyPreference(userId: number, input: z.infer<typeof vacancyPreferenceInputSchema>) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  const [vacancy] = await db.select({ id: vacancies.id }).from(vacancies).where(eq(vacancies.id, input.vacancyId)).limit(1);
  if (!vacancy) throw new Error("Vacancy not found");
  await db.insert(vacancyPreferences).values({ userId, vacancyId: input.vacancyId, status: input.status }).onConflictDoUpdate({ target: [vacancyPreferences.userId, vacancyPreferences.vacancyId], set: { status: input.status, updatedAt: new Date() } });
  return { vacancyId: input.vacancyId, status: input.status };
}

/** Clears a user's private preference, returning the role to the default public shortlist view. */
export async function clearVacancyPreference(userId: number, vacancyId: number) {
  const db = await ensureConfig();
  if (!db) throw new Error("Database is unavailable");
  await db.delete(vacancyPreferences).where(and(eq(vacancyPreferences.userId, userId), eq(vacancyPreferences.vacancyId, vacancyId)));
  return { vacancyId, status: null };
}
