/** VACANCY TRACKER — policy tests guard the user’s non-negotiable screening rules. */
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { buildManualSearchPrompt, incomingVacancySchema, rejectionReason, vacancyPreferenceInputSchema } from "./tracker";
import { CANONICAL_RESEARCH_PLAYBOOK, CANONICAL_RESEARCH_PLAYBOOK_VERSION } from "./canonicalResearchPlaybook";

const vacancy = incomingVacancySchema.parse({ sourceUrl: "https://example.com/job/1", sourceLabel: "Example", company: "Example Labs", title: "Senior Node.js Engineer", region: "Poland remote", workModel: "Remote", matchScore: 90, freshness: "Fresh", freshnessDetail: "Today", intro: "Node.js and AWS serverless role with API and microservice ownership.", proof: ["Node.js", "AWS"], caveat: "Verify contract model.", tags: ["Node.js"], dimensions: [{ label: "Node / TS", value: 100 }], rawRequirements: "Node.js TypeScript AWS" });

describe("rejectionReason", () => {
  it("allows a matching Node.js and AWS vacancy", () => expect(rejectionReason(vacancy)).toBeNull());
  it("rejects Tech Lead and Architect titles", () => expect(rejectionReason({ ...vacancy, title: "Tech Lead — Node.js" })).toMatch(/Tech Lead/));
  it("rejects an English C1 requirement", () => expect(rejectionReason({ ...vacancy, rawRequirements: "English C1 required" })).toMatch(/C1/));
  it("rejects Java and Angular requirements", () => expect(rejectionReason({ ...vacancy, rawRequirements: "Node.js, Angular and Java" })).toMatch(/Java/));
  it("rejects a named excluded employer", () => expect(rejectionReason({ ...vacancy, company: "Revolut" })).toMatch(/exclusion/));
  it("allows Senior roles, JavaScript roles, and secondary Python", () => expect(rejectionReason({ ...vacancy, title: "Senior JavaScript Developer", rawRequirements: "JavaScript, Node.js, TypeScript; Python is a nice-to-have" })).toBeNull());
  it("allows Python and Django when they are explicitly a plus alongside a mandatory non-Python stack", () => expect(rejectionReason({ ...vacancy, rawRequirements: "Node.js and TypeScript are required; mandatory AI-platform experience; Python and Django are a plus" })).toBeNull());
  it("rejects Python-primary roles without treating all Python mentions as excluded", () => expect(rejectionReason({ ...vacancy, title: "Python Backend Engineer", rawRequirements: "Python is the primary technology" })).toMatch(/Python-primary/));
  it("rejects explicit paid access or application fees", () => {
    expect(rejectionReason({ ...vacancy, rawRequirements: "Premium subscription required to view full vacancy details" })).toMatch(/Paid access/);
    expect(rejectionReason({ ...vacancy, rawRequirements: "Application fee required before submitting" })).toMatch(/Paid access/);
  });
  it("rejects a paywall discovered at the final application step", () => expect(rejectionReason({ ...vacancy, rawRequirements: "Complete the application form; payment is required before final submission" })).toMatch(/Paid access/));
  it("allows ordinary free registration", () => expect(rejectionReason({ ...vacancy, rawRequirements: "Free registration and email verification required before applying" })).toBeNull());
  it("does not reject an unfamiliar or otherwise unspecified job board", () => {
    expect(rejectionReason({ ...vacancy, sourceLabel: "Unknown Jobs Board", rawRequirements: "Remote job board listing; pricing information not stated" })).toBeNull();
    expect(rejectionReason({ ...vacancy, rawRequirements: "Optional premium membership is available; applying remains free" })).toBeNull();
  });
  it("accepts the new canonical-policy geography values", () => {
    expect(incomingVacancySchema.parse({ ...vacancy, region: "Wrocław onsite/hybrid" }).region).toBe("Wrocław onsite/hybrid");
    expect(incomingVacancySchema.parse({ ...vacancy, region: "Europe remote" }).region).toBe("Europe remote");
  });
});

describe("buildManualSearchPrompt", () => {
  it("matches the checked-in canonical source artifact exactly after newline normalization", () => {
    const sourcePath = path.resolve(process.cwd(), "docs/research-policy/canonical-vacancy-research-policy-2026-08-22.2.txt");
    const sourceText = readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
    expect(sourceText).toBe(CANONICAL_RESEARCH_PLAYBOOK);
  });

  it("includes the complete versioned canonical policy verbatim without exposing private writer instructions", () => {
    const requestedAt = new Date("2026-08-20T08:30:00.000Z");
    const prompt = buildManualSearchPrompt("FIND-ABC12345", requestedAt);
    expect(prompt).toContain("FIND-ABC12345");
    expect(prompt).toContain("2026-08-20T08:30:00.000Z");
    expect(prompt).toContain(CANONICAL_RESEARCH_PLAYBOOK_VERSION);
    expect(prompt).toContain(CANONICAL_RESEARCH_PLAYBOOK);
    expect(prompt).toContain("Node.js");
    expect(prompt).toContain("JavaScript");
    expect(prompt).toContain("PHP");
    expect(prompt).toContain("AWS Lambda");
    expect(prompt).toContain("Symfony");
    expect(prompt).toContain("Senior roles ARE ALLOWED.");
    expect(prompt).toContain("Tech Lead");
    expect(prompt).toContain("Technical Lead");
    expect(prompt).toContain("Architect");
    expect(prompt).toContain("Java and JavaScript are different technologies.");
    expect(prompt).toContain("Python is NOT globally excluded.");
    expect(prompt).toContain("English at C1 level or higher.");
    expect(prompt).toContain("Wrocław");
    expect(prompt).toContain("Remote - Europe");
    expect(prompt).toContain("sourceUrl");
    expect(prompt).toContain("NEW · 7 DAYS");
    expect(prompt).not.toContain("ingest-scheduled-refresh.ts");
    expect(prompt).not.toContain("/tmp/tailored-vacancy-refresh.json");
  });

  it("contains every required canonical-policy validation item without adding a Senior exclusion", () => {
    const requiredPolicyTerms = [
      "Node.js", "JavaScript", "TypeScript", "PHP", "AWS", "cloud computing", "serverless architecture", "AWS Lambda", "microservices", "Symfony",
      "Senior roles ARE ALLOWED.", "Tech Lead", "Technical Lead", "Architect", "JAVA IS EXCLUDED.", "Java and JavaScript are different technologies.",
      "ANGULAR", "Python is NOT globally excluded.", "English at C1 level or higher.",
      "Allegro", "Scalo", "Antal PL", "ALM Services", "Aircashback", "Esurance", "Capgemini", "iTeamly", "Edge1S", "Spyrosoft", "Blue Language Labs", "Cloudfide", "InPost", "Alten", "Inuits", "Link Group", "Aura", "Playbook", "SoftServe", "Volvo", "FYUL", "Wise", "Revolut", "GitLab", "Automattic",
      "Onsite or hybrid roles based in Wrocław.", "Remote roles explicitly available from Poland.", "Remote roles explicitly available from Europe.", "Cross-border remote roles where the permitted work location includes Poland or Europe.", "Global remote roles where the employer explicitly permits working from Europe.",
      "Open the original vacancy/source page.", "Verify that the vacancy is not closed or expired.", "Use sourceUrl as the unique vacancy identifier.", "update last_seen_at.", "set first_seen_at.", "Calculate matchScore from 0 to 100.", "NEW · 7 DAYS",
    ];
    for (const term of requiredPolicyTerms) expect(CANONICAL_RESEARCH_PLAYBOOK).toContain(term);
    expect(CANONICAL_RESEARCH_PLAYBOOK).not.toContain("Senior is excluded");
  });
});

describe("vacancyPreferenceInputSchema", () => {
  it("accepts only a positive vacancy id and private saved or hidden status", () => {
    expect(vacancyPreferenceInputSchema.parse({ vacancyId: 42, status: "saved" })).toEqual({ vacancyId: 42, status: "saved" });
    expect(vacancyPreferenceInputSchema.parse({ vacancyId: 42, status: "hidden" })).toEqual({ vacancyId: 42, status: "hidden" });
    expect(() => vacancyPreferenceInputSchema.parse({ vacancyId: 0, status: "archived" })).toThrow();
  });
});
