import { strict as assert } from "node:assert";
import { CANONICAL_RESEARCH_PLAYBOOK, CANONICAL_RESEARCH_PLAYBOOK_VERSION } from "../server/canonicalResearchPlaybook";
import { buildManualSearchPrompt } from "../server/tracker";

const requestCode = "FIND-VERIFY01";
const requestedAt = new Date("2026-08-20T08:30:00.000Z");
const prompt = buildManualSearchPrompt(requestCode, requestedAt);

assert.ok(prompt.includes(`Request ID: ${requestCode}`));
assert.ok(prompt.includes(`Requested at (UTC): ${requestedAt.toISOString()}`));
assert.ok(prompt.includes(`Canonical policy version: ${CANONICAL_RESEARCH_PLAYBOOK_VERSION}`));
assert.ok(prompt.includes(CANONICAL_RESEARCH_PLAYBOOK));
assert.ok(!prompt.includes("ingest-scheduled-refresh.ts"));
assert.ok(!prompt.includes("/tmp/tailored-vacancy-refresh.json"));

console.log(JSON.stringify({
  requestCode,
  requestedAt: requestedAt.toISOString(),
  canonicalPlaybookVersion: CANONICAL_RESEARCH_PLAYBOOK_VERSION,
  exactCanonicalPlaybookIncluded: true,
  privateWriterDetailsExcluded: true,
}, null, 2));
