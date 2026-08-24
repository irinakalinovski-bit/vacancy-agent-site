/**
 * Private project command for a scheduled research task.
 *
 * It is not an HTTP endpoint and accepts no public requests. It reads a local
 * JSON payload created by the scheduled researcher, routes it through the
 * server's single validation gate, then records the resulting audit and
 * source-URL deduplicated database changes.
 */
import { readFile } from "node:fs/promises";
import { ingestRefresh, refreshSubmissionSchema } from "../server/tracker";

const payloadPath = process.argv[2];

if (!payloadPath) {
  throw new Error("Usage: pnpm tsx scripts/ingest-scheduled-refresh.ts <payload.json>");
}

const rawPayload = await readFile(payloadPath, "utf8");
const payload = refreshSubmissionSchema.parse(JSON.parse(rawPayload));
const result = await ingestRefresh(payload);

console.log(JSON.stringify({ ok: true, ...result }));
process.exit(0);
